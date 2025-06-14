import { Request, Response } from 'express';
import Anime from '../models/Anime';

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
      minRating,
      maxRating,
      page = '1',
      limit = '25',
    } = req.query;

    const pageNumber = parseInt(page as string) || 1;
    const pageSize = parseInt(limit as string) || 25;

    // Construct MongoDB filter
    const filter: any = {};

    if (anime1 || anime2) {
      filter.title = { $in: [anime1, anime2].filter(Boolean) };
    }

    if (beforeYear || afterYear) {
      filter.aired = {};
      if (afterYear) filter.aired.$gte = new RegExp(`${afterYear}`);
      if (beforeYear) filter.aired.$lte = new RegExp(`${beforeYear}`);
    }

    if (season) {
      filter.aired = {
        ...filter.aired,
        $regex: new RegExp(`${season}`, 'i'),
      };
    }

    if (minRating || maxRating) {
      filter.score = {};
      if (minRating) filter.score.$gte = parseFloat(minRating as string);
      if (maxRating) filter.score.$lte = parseFloat(maxRating as string);
    }

    const sortField = sort as string;
    const sortOrder: 1 | -1 = order === 'asc' ? 1 : -1;

    // Deduplicate by lowercase title before pagination
    const animeList = await Anime.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $toLower: "$title" }, // case-insensitive deduplication
          doc: { $first: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$doc" } },
      { $sort: { [sortField]: sortOrder } },
      { $skip: (pageNumber - 1) * pageSize },
      { $limit: pageSize },
    ]);

    // Total count of unique titles (before pagination)
    const totalUnique = await Anime.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $toLower: "$title" },
        },
      },
      { $count: "total" },
    ]);

    const total = totalUnique[0]?.total || 0;

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
      ? { title: { $regex: searchQuery, $options: 'i' } }
      : {};

    // Step 1: Find matching documents with title + popularity
    const animeList = await Anime.find(filter, { title: 1, popularity: 1, _id: 0 })
      .sort({ popularity: 1 }) // most popular first
      .limit(100)              // fetch more than needed to ensure unique trimming
      .lean();

    // Step 2: Remove duplicate titles (case-insensitive)
    const seen = new Set<string>();
    const uniqueTitles = [];

    for (const anime of animeList) {
      const key = anime.title.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueTitles.push({ label: anime.title.trim() });
      }
      if (uniqueTitles.length === limit) break;
    }

    res.status(200).json(uniqueTitles);
  } catch (err) {
    console.error('❌ Failed to fetch anime titles:', err);
    res.status(500).json({ message: 'Error fetching anime titles.' });
  }
};


export const createAnime = async (req: Request, res: Response): Promise<void> => {
    try {
      const anime = new Anime(req.body);
      const savedAnime = await anime.save();
      res.status(201).json(savedAnime);
    } catch (error) {
      res.status(400).json({ message: 'Error creating anime.' });
    }
  };
  
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
  
export const getAnimeSortedByPopularity = async (req: Request, res: Response): Promise<void> => {
  try {
    // Determine the sort order based on query parameter
    // 'asc' means lower popularity values come first (more popular), 'desc' is the reverse
    const order = req.query.order === 'asc' ? 1 : -1;

    // Determine the maximum number of anime entries to return (capped at 100)
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    // Query the Anime collection
    // - No filter: fetches all anime
    // - Sorted by the 'popularity' field in specified order
    // - Limited to 'limit' results
    const sortedAnime = await Anime.find()
      .sort({ popularity: order })
      .limit(limit)
      .lean(); // .lean() improves read performance by returning plain JS objects

    // Send the sorted list in the response
    res.status(200).json(sortedAnime);

  } catch (err) {
    // In case of an error during query execution, log it and return a 500 error
    console.error("Error sorting anime by popularity:", err);
    res.status(500).json({ message: 'Failed to fetch sorted anime list.' });
  }
};