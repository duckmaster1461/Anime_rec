import { Request, Response } from 'express';
import Anime from '../models/Anime';

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

    const isAnime1Set = typeof anime1 === 'string' && anime1.trim() !== '';
    const isAnime2Set = typeof anime2 === 'string' && anime2.trim() !== '';
    const isCompareMode = isAnime1Set || isAnime2Set;

    const filter: any = {};
    if (isCompareMode) {
      const nameFilters = [];
      if (isAnime1Set) {
        nameFilters.push({ Name: { $regex: `^${anime1}$`, $options: 'i' } });
      }
      if (isAnime2Set) {
        nameFilters.push({ Name: { $regex: `^${anime2}$`, $options: 'i' } });
      }
      filter.$or = nameFilters;
    }

    const andConditions: any[] = [];

    if (!isCompareMode) {
      // Year range
      if (afterYear || beforeYear) {
        const exprConditions: any[] = [];

        const extractYearExpr = {
          $cond: [
            { $regexMatch: { input: "$Aired", regex: "[0-9]{4}" } },
            {
              $toInt: {
                $arrayElemAt: [
                  {
                    $map: {
                      input: {
                        $filter: {
                          input: { $split: ["$Aired", " "] },
                          cond: { $regexMatch: { input: "$$this", regex: "^[0-9]{4}$" } }
                        }
                      },
                      as: "y",
                      in: "$$y"
                    }
                  },
                  0
                ]
              }
            },
            null
          ]
        };

        if (afterYear) {
          exprConditions.push({
            $gte: [extractYearExpr, parseInt(afterYear as string)]
          });
        }

        if (beforeYear) {
          exprConditions.push({
            $lte: [extractYearExpr, parseInt(beforeYear as string)]
          });
        }

        if (exprConditions.length > 0) {
          andConditions.push({ $expr: { $and: exprConditions } });
        }
      }

      // Season filter
      if (season) {
        andConditions.push({ Premiered: { $regex: `${season}`, $options: 'i' } });
      }

      // Rating filter
      if (minRating !== undefined || maxRating !== undefined) {
        const scoreCond: any = {};
        if (minRating !== undefined) scoreCond.$gte = parseFloat(minRating as string);
        if (maxRating !== undefined) scoreCond.$lte = parseFloat(maxRating as string);
        andConditions.push({ Score: scoreCond });
      }

      if (andConditions.length > 0) {
        filter.$and = andConditions;
      }
    }

    console.log('📥 Query Params:', req.query);
    console.log('🔍 Filter Object:', JSON.stringify(filter, null, 2));

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

    console.log(`📊 Sorting by: ${sortField} (${sortOrder === 1 ? 'asc' : 'desc'})`);

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

    const fullPipeline = [...basePipeline, ...paginationStages];
    console.log('🧱 Aggregation Pipeline:', JSON.stringify(fullPipeline, null, 2));

    const animeList = await Anime.aggregate(fullPipeline).allowDiskUse(true);
    console.log(`✅ Retrieved ${animeList.length} anime`);

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
      console.log(`📦 Total distinct anime count: ${total}`);
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
