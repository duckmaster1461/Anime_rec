// src/controllers/animeController.ts
import { Request, Response } from 'express';
import AnimeFinal from '../models/Anime';

/* ======================= Helpers ======================= */

// parse to number but ignore NaN / blanks
const toNum = (v: any) => {
  if (v === undefined || v === null) return undefined;
  const n = parseFloat(String(v).trim());
  return Number.isFinite(n) ? n : undefined;
};

// escape user-provided strings for safe RegExp
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// build safe title filter across fields
const titleRegexFilter = (raw?: string) => {
  if (!raw || typeof raw !== 'string' || !raw.trim()) return null;
  const escaped = esc(raw.trim());
  const exact = new RegExp(`^${escaped}$`, 'i');
  const loose = new RegExp(escaped, 'i');
  return {
    $or: [
      { title_userPreferred: { $regex: exact } },
      { title_romaji: { $regex: exact } },
      { title_english: { $regex: exact } },
      { title_native: { $regex: exact } },
      // fallback loose matches
      { title_userPreferred: { $regex: loose } },
      { title_romaji: { $regex: loose } },
      { title_english: { $regex: loose } },
    ],
  };
};

// (optional) season → months map (Winter/Spring/Summer/Fall)
const seasonToMonths: Record<string, number[]> = {
  winter: [12, 1, 2],
  spring: [3, 4, 5],
  summer: [6, 7, 8],
  fall: [9, 10, 11],
};

/* ======================= Controllers ======================= */

// GET /api/anime
export const getAllAnime = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      anime1,
      anime2,
      sort = 'score',
      order = 'desc',
      beforeYear,
      afterYear,
      season,
      // backward-compat aliases
      minRating,
      maxRating,
      minScore,
      maxScore,
      isAdult,
      genre,
      page = '1',
      limit = '',
    } = req.query;

    const pageNumber = parseInt(page as string) || 1;
    const pageSize = parseInt(limit as string) || 25;

    const a1 = typeof anime1 === 'string' ? anime1.trim() : '';
    const a2 = typeof anime2 === 'string' ? anime2.trim() : '';
    const isCompareMode = a1.length > 0 && a2.length > 0;

    const filter: any = {};
    const and: any[] = [];

    // Compare titles across fields
    if (isCompareMode) {
      const or: any[] = [];
      const f1 = titleRegexFilter(a1);
      const f2 = titleRegexFilter(a2);
      if (f1) or.push(f1);
      if (f2) or.push(f2);
      if (or.length) filter.$or = or;
    }

    // Year range on startDate_year
    const minYear = toNum(afterYear);
    const maxYear = toNum(beforeYear);
    if (minYear !== undefined || maxYear !== undefined) {
      const yr: any = {};
      if (minYear !== undefined) yr.$gte = minYear;
      if (maxYear !== undefined) yr.$lte = maxYear;
      if (Object.keys(yr).length) and.push({ startDate_year: yr });
    }

    // Season via startDate_month
    if (typeof season === 'string' && season.trim()) {
      const months = seasonToMonths[season.toLowerCase()];
      if (months) and.push({ startDate_month: { $in: months } });
    }

    // Adult filter
    if (typeof isAdult === 'string') {
      if (isAdult.toLowerCase() === 'true') and.push({ isAdult: true });
      if (isAdult.toLowerCase() === 'false') and.push({ isAdult: false });
    }

    // Genre (exact, case-insensitive)
    if (typeof genre === 'string' && genre.trim()) {
      const safe = esc(genre.trim());
      const rx = new RegExp(`^${safe}$`, 'i');
      and.push({ genres: { $elemMatch: { $regex: rx } } });
    }

    // Score filters map to averageScore
    const min = toNum(minScore ?? minRating);
    const max = toNum(maxScore ?? maxRating);
    if (min !== undefined || max !== undefined) {
      const sc: any = {};
      if (min !== undefined) sc.$gte = min;
      if (max !== undefined) sc.$lte = max;
      if (Object.keys(sc).length) and.push({ averageScore: sc });
    }

    if (and.length) {
      if (isCompareMode) filter.$and = (filter.$and || []).concat(and);
      else filter.$and = and;
    }

    // Sorting map
    const sortMap: Record<string, string> = {
      score: 'averageScore',
      averagescore: 'averageScore',
      meanscore: 'meanScore',
      popularity: 'popularity',
      year: 'startDate_year',
      month: 'startDate_month',
      episodes: 'episodes',
      duration: 'duration',
      title: 'title_userPreferred',
      title_romaji: 'title_romaji',
      title_english: 'title_english',
    };
    const sortField = sortMap[String(sort).toLowerCase()] || 'averageScore';
    const sortOrder: 1 | -1 = order === 'asc' ? 1 : -1;

    // Build pipeline
    const pipeline: any[] = [
      { $match: filter },
      { $sort: { [sortField]: sortOrder, _id: 1 } }, // stable secondary sort
      ...(isCompareMode ? [] : [{ $skip: (pageNumber - 1) * pageSize }, { $limit: pageSize }]),
    ];

    const results = await AnimeFinal.aggregate(pipeline).allowDiskUse(true);

    let total = 0;
    if (!isCompareMode) {
      // Count only when listing
      total = await AnimeFinal.countDocuments(filter);
    } else {
      // For compare view, cap at 2 visually, but send whatever matches the two titles
      total = results.length;
    }

    res.status(200).json({ results, total });
  } catch (err) {
    console.error('❌ Error fetching anime list:', err);
    res.status(500).json({ message: 'Failed to fetch anime list' });
  }
};

// GET /api/anime/titles?q=&limit=
export const getAnimeTitles = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const q = (req.query.q as string) || '';

    const filter = q
      ? {
          $or: [
            { title_userPreferred: { $regex: q, $options: 'i' } },
            { title_romaji: { $regex: q, $options: 'i' } },
            { title_english: { $regex: q, $options: 'i' } },
            { title_native: { $regex: q, $options: 'i' } },
          ],
        }
      : {};

    const docs = await AnimeFinal.find(filter, {
      title_userPreferred: 1,
      title_romaji: 1,
      title_english: 1,
      popularity: 1,
      _id: 0,
    })
      .collation({ locale: 'en', strength: 2 })
      .sort({ popularity: 1, title_userPreferred: 1, title_romaji: 1, title_english: 1 })
      .limit(200)
      .lean();

    const seen = new Set<string>();
    const titles: Array<{ label: string }> = [];

    for (const d of docs) {
      const label =
        (d as any).title_userPreferred ||
        (d as any).title_english ||
        (d as any).title_romaji ||
        '';
      const norm = label.trim().toLowerCase();
      if (!label || seen.has(norm)) continue;
      seen.add(norm);
      titles.push({ label: label.trim() });
      if (titles.length >= limit) break;
    }

    res.status(200).json(titles);
  } catch (err) {
    console.error('❌ Failed to fetch anime titles:', err);
    res.status(500).json({ message: 'Error fetching anime titles.' });
  }
};

// POST /api/anime
export const createAnime = async (req: Request, res: Response): Promise<void> => {
  try {
    const anime = new AnimeFinal(req.body);
    const saved = await anime.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error('❌ Error creating anime:', error);
    res.status(400).json({ message: 'Error creating anime.' });
  }
};

// GET /api/anime/:id
export const getAnimeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const anime = await AnimeFinal.findById(req.params.id);
    if (!anime) {
      res.status(404).json({ message: 'Anime not found.' });
      return;
    }
    res.status(200).json(anime);
  } catch (error) {
    console.error('❌ Error retrieving anime:', error);
    res.status(500).json({ message: 'Error retrieving anime.' });
  }
};

// GET /api/anime/popular?order=asc|desc&limit=50
export const getAnimeSortedByPopularity = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = req.query.order === 'asc' ? 1 : -1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const sorted = await AnimeFinal.find(
      {},
      { title_userPreferred: 1, title_romaji: 1, title_english: 1, popularity: 1, bannerImage: 1 }
    )
      .sort({ popularity: order })
      .limit(limit)
      .lean();

    res.status(200).json(sorted);
  } catch (err) {
    console.error('❌ Error sorting anime by popularity:', err);
    res.status(500).json({ message: 'Failed to fetch sorted anime list.' });
  }
};
