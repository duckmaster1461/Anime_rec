import mongoose, { Schema, Document, model } from "mongoose";

export interface ITag {
  id: number;
  name: string;
  description?: string;
  category?: string;
  rank?: number;
  isGeneralSpoiler?: boolean;
  isMediaSpoiler?: boolean;
  isAdult?: boolean;
}

export interface IExternalLink {
  id?: number;
  url: string;
  site?: string;        // e.g., "Official Site"
  type?: string;        // e.g., "INFO"
  language?: string | null;
  color?: string | null;
  icon?: string | null;
  notes?: string | null;
  isDisabled?: boolean;
}

export interface IAnime extends Document {
  title_romaji: string;
  title_native?: string;
  title_userPreferred?: string;
  format?: "TV" | "TV_SHORT" | "MOVIE" | "SPECIAL" | "OVA" | "ONA" | "MUSIC" | "MANGA" | "NOVEL" | "ONE_SHOT" | string;
  description?: string;
  startDate_year?: number;
  endDate_year?: number;
  episodes?: number;
  duration?: number; // minutes per episode / for movie: length
  countryOfOrigin?: string; // ISO-2/ISO-3-like code
  source?: "ORIGINAL" | "MANGA" | "LIGHT_NOVEL" | "VISUAL_NOVEL" | "VIDEO_GAME" | "NOVEL" | "DOUJINSHI" | "ANIME" | "WEB_NOVEL" | "LIVE_ACTION" | "GAME" | "MULTIMEDIA_PROJECT" | "PICTURE_BOOK" | string;
  genres?: string[];
  synonyms?: string[];
  tags?: ITag[];
  averageScore?: number;
  meanScore?: number;
  popularity?: number;
  isAdult?: boolean;
  siteUrl?: string;
  externalLinks?: IExternalLink[];
  streamingEpisodes?: any[]; // keeping flexible as source is empty
  relations?: any[];
  studios?: any[];
  createdAt: Date;
  updatedAt: Date;
}

const TagSchema = new Schema<ITag>(
  {
    id: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    category: { type: String },
    rank: { type: Number },
    isGeneralSpoiler: { type: Boolean, default: false },
    isMediaSpoiler: { type: Boolean, default: false },
    isAdult: { type: Boolean, default: false },
  },
  { _id: false }
);

const ExternalLinkSchema = new Schema<IExternalLink>(
  {
    id: { type: Number },
    url: { type: String, required: true, trim: true },
    site: { type: String },
    type: { type: String },
    language: { type: String, default: null },
    color: { type: String, default: null },
    icon: { type: String, default: null },
    notes: { type: String, default: null },
    isDisabled: { type: Boolean, default: false },
  },
  { _id: false }
);

const AnimeSchema = new Schema<IAnime>(
  {
    title_romaji: { type: String, required: true, trim: true, index: true },
    title_native: { type: String, trim: true },
    title_userPreferred: { type: String, trim: true },
    format: { type: String, default: "TV" },
    description: { type: String },
    startDate_year: { type: Number, min: 1800, max: 3000 },
    endDate_year: { type: Number, min: 1800, max: 3000 },
    episodes: { type: Number, min: 0 },
    duration: { type: Number, min: 0 },
    countryOfOrigin: { type: String, trim: true },
    source: { type: String, default: "ORIGINAL" },
    genres: [{ type: String, trim: true }],
    synonyms: [{ type: String, trim: true }],
    tags: { type: [TagSchema], default: [] },
    averageScore: { type: Number, min: 0, max: 100 },
    meanScore: { type: Number, min: 0, max: 100 },
    popularity: { type: Number, min: 0 },
    isAdult: { type: Boolean, default: false },
    siteUrl: { type: String, trim: true, index: { unique: true, sparse: true } },
    externalLinks: { type: [ExternalLinkSchema], default: [] },
    streamingEpisodes: { type: Array, default: [] },
    relations: { type: Array, default: [] },
    studios: { type: Array, default: [] },
  },
  { timestamps: true }
);

// Helpful composite index for lookups by title + year
AnimeSchema.index(
  { title_romaji: 1, startDate_year: 1 },
  { name: "title_year_idx" }
);

export const Anime =
  (mongoose.models.Anime as mongoose.Model<IAnime>) ||
  model<IAnime>("Anime", AnimeSchema);
