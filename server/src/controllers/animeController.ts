import { Request, Response } from 'express';
import Anime from '../models/Anime';

// GET /api/anime (with filters, sorting, deduplication, pagination)

export const getAllAnime = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      anime1,
      anime2,
      sort = 'Score',
      order = 'desc',
      beforeYear,
      afterYear,
      season,
      minRating,
      maxRating,
      page = '1',
      limit = '',
    } = req.query;

    const pageNumber = parseInt(page as string) || 1;
    const pageSize = parseInt(limit as string) || 25;

    const filter: any = {};

    // Compare mode: exact name match
    const nameFilters = [anime1, anime2]
      .filter(Boolean)
      .map((name) => ({
        Name: { $regex: `^${name}$`, $options: 'i' }
      }));

    const isCompareMode = nameFilters.length > 0;
    if (isCompareMode) {
      filter.$or = nameFilters;
    }

    // Only apply filters when NOT in compare mode
    const andConditions: any[] = [];

    if (!isCompareMode) {
      // Year filter using $expr
      if (afterYear || beforeYear) {
        const exprConditions: any[] = [];

        if (afterYear) {
          exprConditions.push({
            $gte: [
              { $toInt: { $substr: ["$Aired", 0, 4] } },
              parseInt(afterYear as string)
            ]
          });
        }

        if (beforeYear) {
          exprConditions.push({
            $lte: [
              { $toInt: { $substr: ["$Aired", 0, 4] } },
              parseInt(beforeYear as string)
            ]
          });
        }

        andConditions.push({
          $expr: {
            $and: exprConditions
          }
        });
      }

      // Season filter
      if (season) {
        andConditions.push({
          Premiered: { $regex: `${season}`, $options: 'i' }
        });
      }

      // Rating filter
      if (minRating !== undefined || maxRating !== undefined) {
        const scoreCond: any = {};
        if (minRating) scoreCond.$gte = parseFloat(minRating as string);
        if (maxRating) scoreCond.$lte = parseFloat(maxRating as string);
        andConditions.push({ Score: scoreCond });
      }
    }

    // Append all AND conditions
    if (andConditions.length > 0) {
      if (!filter.$and) filter.$and = [];
      filter.$and.push(...andConditions);
    }

    const sortMap: Record<string, string> = {
      score: 'Score',
      aired: 'Aired',
      popularity: 'Popularity',
      episodes: 'Episodes',
      duration: 'Duration',
      favorites: 'Favorites',
      ranked: 'Rank',
      members: 'Members'
    };

    const sortField = sortMap[sort.toString().toLowerCase()] || 'Score';
    const sortOrder: 1 | -1 = order === 'asc' ? 1 : -1;

    // Aggregation pipeline
    const basePipeline = [
      { $match: filter },
      {
        $group: {
          _id: { $toLower: "$Name" },
          doc: { $first: "$$ROOT" }
        }
      },
      { $replaceRoot: { newRoot: "$doc" } },
      { $sort: { [sortField]: sortOrder } }
    ];

    const paginationStages = isCompareMode
      ? []
      : [
          { $skip: (pageNumber - 1) * pageSize },
          { $limit: pageSize }
        ];

    const animeList = await Anime.aggregate([
      ...basePipeline,
      ...paginationStages
    ]).allowDiskUse(true);

    // Total count (only calculated when not in compare mode)
    let total = 0;
    if (!isCompareMode && pageNumber === 1) {
      const countAgg = await Anime.aggregate([
        { $match: filter },
        {
          $group: {
            _id: { $toLower: "$Name" }
          }
        },
        { $count: "total" }
      ]);
      total = countAgg[0]?.total || 0;
    }

    res.status(200).json({ results: animeList, total });
  } catch (err) {
    console.error('❌ Error fetching anime list:', err);
    res.status(500).json({ message: 'Failed to fetch anime list' });
  }
};


// GET /api/anime/titles
export const getAnimeTitles = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const searchQuery = (req.query.q as string) || '';

    const filter = searchQuery
      ? { Name: { $regex: searchQuery, $options: 'i' } }
      : {};

    const animeList = await Anime.find(filter, { Name: 1, Popularity: 1, _id: 0 })
      .sort({ Popularity: 1 })
      .limit(100)
      .lean();

    const seen = new Set<string>();
    const uniqueTitles = [];

    for (const anime of animeList) {
      const key = anime.Name.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueTitles.push({ label: anime.Name.trim() });
      }
      if (uniqueTitles.length === limit) break;
    }

    res.status(200).json(uniqueTitles);
  } catch (err) {
    console.error('❌ Failed to fetch anime titles:', err);
    res.status(500).json({ message: 'Error fetching anime titles.' });
  }
};

// POST /api/anime
export const createAnime = async (req: Request, res: Response): Promise<void> => {
  try {
    const anime = new Anime(req.body);
    const savedAnime = await anime.save();
    res.status(201).json(savedAnime);
  } catch (error) {
    res.status(400).json({ message: 'Error creating anime.' });
  }
};

// GET /api/anime/:id
export const getAnimeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const anime = await Anime.findById(req.params.id);
    if (!anime) {
      res.status(404).json({ message: 'Anime not found.' });
      return;
    }
    res.status(200).json(anime);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving anime.' });
  }
};

// GET /api/anime/popular
export const getAnimeSortedByPopularity = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = req.query.order === 'asc' ? 1 : -1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const sortedAnime = await Anime.find()
      .sort({ Popularity: order })
      .limit(limit)
      .lean();

    res.status(200).json(sortedAnime);
  } catch (err) {
    console.error("Error sorting anime by popularity:", err);
    res.status(500).json({ message: 'Failed to fetch sorted anime list.' });
  }
};
