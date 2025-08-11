import { Request, Response } from 'express';
import Anime from '../models/Anime';

/**
 * GET /api/anime
 * Query params:
 *  anime1, anime2: string (optional)
 *  sort: one of score|aired|popularity|episodes|duration|favorites|ranked|members (default: score)
 *  order: asc|desc (default: desc)
 *  beforeYear, afterYear: string or number (optional)
 *  season: Spring|Summer|Autumn|Winter (optional)
 *  minRating/minScore, maxRating/maxScore: numbers (optional)
 *  page: number (default 1)
 *  limit: number (default 25)
 */
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
      // accept both minRating/maxRating and minScore/maxScore
      minRating,
      maxRating,
      minScore,
      maxScore,
      page = '1',
      limit = '25',
    } = req.query as Record<string, string>;

    const pageNumber = Math.max(parseInt(page || '1', 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit || '25', 10) || 25, 1), 100);

    const sortMap: Record<string, string> = {
      score: 'Score',
      aired: 'Aired',
      popularity: 'Popularity',
      episodes: 'Episodes',
      duration: 'Duration',
      favorites: 'Favorites',
      ranked: 'Rank',
      members: 'Members',
    };
    const sortField = sortMap[(sort || '').toLowerCase()] || 'Score';
    const sortOrder: 1 | -1 = order === 'asc' ? 1 : -1;

    // Normalize rating inputs and allow 0 values
    const minR = (minRating ?? minScore) !== undefined && (minRating ?? minScore) !== ''
      ? Number(minRating ?? minScore)
      : undefined;
    const maxR = (maxRating ?? maxScore) !== undefined && (maxRating ?? maxScore) !== ''
      ? Number(maxRating ?? maxScore)
      : undefined;

    // Build OR search for anime1 / anime2; if missing, no constraint (full list).
    const nameFilters: any[] = [];
    if (anime1) nameFilters.push({ Name: { $regex: `^${escapeRegex(anime1)}$`, $options: 'i' } });
    if (anime2) nameFilters.push({ Name: { $regex: `^${escapeRegex(anime2)}$`, $options: 'i' } });

    const match: any = {};
    if (nameFilters.length) match.$or = nameFilters;

    // We’ll extract numeric years from Aired and then filter ↓
    // Also prepare a normalized season string from Premiered.
    const pipeline: any[] = [
      { $match: match },

      // Deduplicate by lower(Name) first to avoid double-counting later operations
      {
        $group: {
          _id: { $toLower: '$Name' },
          doc: { $first: '$$ROOT' },
        },
      },
      { $replaceRoot: { newRoot: '$doc' } },

      // Add numeric yearStart/yearEnd from Aired (strings like "Oct 2009 to Mar 2010")
      {
        $addFields: {
          _yearsExtract: {
            $regexFindAll: { input: '$Aired', regex: /(\d{4})/g },
          },
        },
      },
      {
        $addFields: {
          yearStart: {
            $cond: [
              { $gt: [{ $size: '$_yearsExtract' }, 0] },
              { $toInt: { $arrayElemAt: ['$_yearsExtract.match', 0] } },
              null,
            ],
          },
          yearEnd: {
            $cond: [
              { $gt: [{ $size: '$_yearsExtract' }, 1] },
              { $toInt: { $arrayElemAt: ['$_yearsExtract.match', -1] } },
              null,
            ],
          },
          premieredNorm: {
            $cond: [
              { $isArray: '$Premiered' }, // just in case
              { $toLower: { $arrayElemAt: ['$Premiered', 0] } },
              { $toLower: '$Premiered' },
            ],
          },
        },
      },

      // Apply filters with numeric comparisons if provided
      {
        $match: {
          ...(season
            ? { premieredNorm: { $regex: new RegExp(`^${escapeRegex(season.toLowerCase())}`) } }
            : {}),
          ...(minR !== undefined || maxR !== undefined
            ? {
                Score: {
                  ...(minR !== undefined ? { $gte: minR } : {}),
                  ...(maxR !== undefined ? { $lte: maxR } : {}),
                },
              }
            : {}),
          // Year filters: if yearStart/yearEnd exist, use them; if null, let them pass (so we don't hide unknowns)
          ...(afterYear
            ? {
                $expr: {
                  $or: [
                    { $and: [{ $ne: ['$yearEnd', null] }, { $gte: ['$yearEnd', Number(afterYear)] }] },
                    { $and: [{ $ne: ['$yearStart', null] }, { $gte: ['$yearStart', Number(afterYear)] }] },
                  ],
                },
              }
            : {}),
          ...(beforeYear
            ? {
                $expr: {
                  $or: [
                    { $and: [{ $ne: ['$yearStart', null] }, { $lte: ['$yearStart', Number(beforeYear)] }] },
                    { $and: [{ $ne: ['$yearEnd', null] }, { $lte: ['$yearEnd', Number(beforeYear)] }] },
                  ],
                },
              }
            : {}),
        },
      },

      // Sorting: if sorting by Aired, sort by numeric yearStart then Name as tie breaker
      ...(sortField === 'Aired'
        ? [{ $sort: { yearStart: sortOrder, Name: 1 } }]
        : [{ $sort: { [sortField]: sortOrder, Name: 1 } }]),

      // Facet for pagination + total count in one go
      {
        $facet: {
          results: [{ $skip: (pageNumber - 1) * pageSize }, { $limit: pageSize }],
          meta: [{ $count: 'total' }],
        },
      },
      {
        $project: {
          results: 1,
          total: { $ifNull: [{ $arrayElemAt: ['$meta.total', 0] }, 0] },
        },
      },
    ];

    const out = await Anime.aggregate(pipeline).allowDiskUse(true);
    const results = out[0]?.results ?? [];
    const total = out[0]?.total ?? 0;

    res.status(200).json({ results, total });
  } catch (err) {
    console.error('❌ Error fetching anime list:', err);
    res.status(500).json({ message: 'Failed to fetch anime list' });
  }
};

// Safe regex escape
function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /api/anime/titles
export const getAnimeTitles = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const q = (req.query.q as string) || '';

    const pipeline: any[] = [
      ...(q ? [{ $match: { Name: { $regex: escapeRegex(q), $options: 'i' } } }] : []),
      {
        $group: {
          _id: { $toLower: '$Name' },
          Name: { $first: '$Name' },
          Popularity: { $min: '$Popularity' },
        },
      },
      { $sort: { Popularity: 1 } },
      { $limit: limit },
      { $project: { _id: 0, label: '$Name' } },
    ];

    const uniqueTitles = await Anime.aggregate(pipeline).allowDiskUse(true);
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
