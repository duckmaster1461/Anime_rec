// src/controllers/animeController.ts
import { Request, Response, NextFunction } from "express";
import { Anime } from "../models/Anime";
import { ensureValidObjectId } from "../utils/validateObjectId";

// Whitelist sort fields to avoid injection
const SORT_WHITELIST = new Set([
  "createdAt",
  "updatedAt",
  "popularity",
  "averageScore",
  "meanScore",
  "startDate_year",
  "title_romaji",
]);

export const createAnime = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const anime = await Anime.create(req.body);
    res.status(201).json(anime);
    return;
  } catch (err) {
    next(err);
  }
};

export const getAnimeById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (!ensureValidObjectId(id)) {
      res.status(400).json({ error: "Invalid id format. Expected 24-hex ObjectId." });
      return;
    }
    const anime = await Anime.findById(id).lean();
    if (!anime) { res.status(404).json({ error: "Not found" }); return; }
    res.json(anime);
  } catch (err) { next(err); }
};

function parseSafeSort(input: string | undefined) {
  if (!input || typeof input !== "string") return { createdAt: -1 } as const;
  const parts = input.split(",").map((s) => s.trim()).filter(Boolean);
  const sortObj: Record<string, 1 | -1> = {};
  for (const p of parts) {
    const dir: 1 | -1 = p.startsWith("-") ? -1 : 1;
    const field = p.replace(/^-/, "");
    if (SORT_WHITELIST.has(field)) sortObj[field] = dir;
  }
  if (Object.keys(sortObj).length === 0) return { createdAt: -1 } as const;
  return sortObj;
}

// NEW: normalize any raw DB shape into stable UI fields
function normalizeAnime(doc: any) {
  const title =
    doc?.title_userPreferred ||
    doc?.title?.userPreferred ||
    doc?.title_romaji ||
    doc?.title?.romaji ||
    doc?.Name ||
    doc?.["English name"] ||
    doc?.title_native ||
    doc?.title?.native ||
    null;

  const year =
    doc?.startDate_year ??
    doc?.startDate?.year ??
    doc?.endDate_year ??
    doc?.endDate?.year ??
    null;

  const score =
    typeof doc?.averageScore === "number"
      ? doc.averageScore
      : typeof doc?.meanScore === "number"
      ? doc.meanScore
      : null;

  const format = doc?.format ?? null;

  const popularity =
    typeof doc?.popularity === "number" ? doc.popularity : null;

  const genres = Array.isArray(doc?.genres) ? doc.genres : [];

  const siteUrl = doc?.siteUrl ?? null;

  const externalLinks = Array.isArray(doc?.externalLinks)
    ? doc.externalLinks
    : [];

  // Return original doc + stable UI fields
  return {
    ...doc,
    uiTitle: title,
    uiYear: year,
    uiScore: score,            // number 0-100 or null
    uiFormat: format,          // string or null
    uiPopularity: popularity,  // number or null
    uiGenres: genres,          // string[]
    uiSiteUrl: siteUrl,        // string or null
    uiExternalLinks: externalLinks, // [{ url, site? }, ...]
  };
}

export const listAnime = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      q,
      format,
      isAdult,
      year,
      page = "1",
      limit = "20",
      sort: sortParam = "-createdAt",
    } = req.query as Record<string, string>;

    const filter: any = {};

    if (q) {
      filter.$or = [
        { title_romaji: { $regex: q, $options: "i" } },
        { title_native: { $regex: q, $options: "i" } },
        { title_userPreferred: { $regex: q, $options: "i" } },
        { "title.romaji": { $regex: q, $options: "i" } },        // nested support
        { "title.userPreferred": { $regex: q, $options: "i" } },  // nested support
        { "title.native": { $regex: q, $options: "i" } },         // nested support
        { Name: { $regex: q, $options: "i" } },                   // legacy support
        { "English name": { $regex: q, $options: "i" } },         // legacy support
        { genres: { $elemMatch: { $regex: q, $options: "i" } } },
        { "tags.name": { $regex: q, $options: "i" } },
      ];
    }

    if (format) filter.format = format;

    if (typeof isAdult !== "undefined" && isAdult !== "") {
      if (isAdult === "true") filter.isAdult = true;
      else if (isAdult === "false") filter.isAdult = false;
    }

    if (year) {
      const y = Number(year);
      if (!isNaN(y)) {
        const or = filter.$or || [];
        filter.$or = [...or, { startDate_year: y }, { endDate_year: y }, { "startDate.year": y }, { "endDate.year": y }];
      }
    }

    const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(String(limit), 10) || 20, 1), 100);
    const sort = parseSafeSort(sortParam);

    const [raw, total] = await Promise.all([
      Anime.find(filter).sort(sort).skip((pageNum - 1) * pageSize).limit(pageSize).lean(),
      Anime.countDocuments(filter),
    ]);

    const items = raw.map(normalizeAnime);

    res.json({
      items,
      page: pageNum,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    next(err);
  }
};

export const updateAnime = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (!ensureValidObjectId(id)) {
      res.status(400).json({ error: "Invalid id format. Expected 24-hex ObjectId." });
      return;
    }
    const anime = await Anime.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!anime) { res.status(404).json({ error: "Not found" }); return; }
    res.json(anime);
  } catch (err) { next(err); }
};

export const deleteAnime = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (!ensureValidObjectId(id)) {
      res.status(400).json({ error: "Invalid id format. Expected 24-hex ObjectId." });
      return;
    }
    const result = await Anime.findByIdAndDelete(id);
    if (!result) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ok: true });
  } catch (err) { next(err); }
};

// NEW: lightweight metadata for filters
// NEW: lightweight metadata for filters
export const getAnimeMeta = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [formats, minDoc, maxDoc] = await Promise.all([
      Anime.distinct("format"),
      Anime.findOne({ startDate_year: { $ne: null } })
        .sort({ startDate_year: 1 })
        .select({ startDate_year: 1, _id: 0 })
        .lean<{ startDate_year?: number } | null>(),
      Anime.findOne({ startDate_year: { $ne: null } })
        .sort({ startDate_year: -1 })
        .select({ startDate_year: 1, _id: 0 })
        .lean<{ startDate_year?: number } | null>(),
    ]);

    const minYear = (minDoc?.startDate_year ?? null);
    const maxYear = (maxDoc?.startDate_year ?? null);

    res.json({
      formats: (formats || []).filter(Boolean).sort(),
      minYear,
      maxYear,
    });
  } catch (err) {
    next(err);
  }
};

