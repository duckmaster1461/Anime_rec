import mongoose, { Schema, Document } from 'mongoose';

export interface IAnimeTag {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  rank?: number | null;
  isGeneralSpoiler?: boolean;
  isMediaSpoiler?: boolean;
  isAdult?: boolean;
}

export interface IAnimeExternalLink {
  id?: number;
  url: string;
  site: string;     // e.g., "Official Site"
  type?: string;    // e.g., "INFO" | "STREAMING" | "SOCIAL"
  language?: string | null;
  color?: string | null;
  icon?: string | null;
  notes?: string | null;
  isDisabled?: boolean;
}

export interface IStreamingEpisode {
  title: string;
  thumbnail?: string;
  url?: string;
  site?: string;
}

export interface IRelationNodeTitle {
  romaji?: string | null;
  english?: string | null;
  native?: string | null;
}

export interface IRelationNode {
  id: number;
  title?: IRelationNodeTitle;
  type?: string;     // "ANIME" | "MANGA" etc.
  format?: string;   // "TV" | "MOVIE" | "ONA" ...
  status?: string;   // "FINISHED" | "RELEASING" | ...
}

export interface IRelation {
  id: number;
  relationType: string; // "SEQUEL" | "ADAPTATION" | ...
  node: IRelationNode;
}

export interface IStudioNode {
  id: number;
  name: string;
  isAnimationStudio?: boolean;
}

export interface IStudio {
  id: number;
  isMain?: boolean;
  node: IStudioNode;
}

export interface IAnimeFinal extends Document {
  title_romaji: string;
  title_english?: string;
  title_native?: string;
  title_userPreferred?: string;

  format?: string;
  description?: string;

  startDate_year?: number | null;
  startDate_month?: number | null;
  startDate_day?: number | null;
  endDate_year?: number | null;
  endDate_month?: number | null;
  endDate_day?: number | null;

  episodes?: number | null;
  duration?: number | null;       // minutes
  countryOfOrigin?: string;
  source?: string;

  hashtag?: string;
  trailer_thumbnail?: string;
  bannerImage?: string;

  genres: string[];
  synonyms: string[];
  tags: IAnimeTag[];

  averageScore?: number | null;
  meanScore?: number | null;
  popularity?: number | null;
  isAdult?: boolean;
  siteUrl?: string;

  externalLinks: IAnimeExternalLink[];
  streamingEpisodes: IStreamingEpisode[];
  relations: IRelation[];
  studios: IStudio[];
}

/* ---------- Sub-schemas (strongly typed) ---------- */
const TagSchema = new Schema<IAnimeTag>(
  {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    description: { type: String, default: null },
    category: { type: String, default: null },
    rank: { type: Number, default: null },
    isGeneralSpoiler: { type: Boolean, default: false },
    isMediaSpoiler: { type: Boolean, default: false },
    isAdult: { type: Boolean, default: false },
  },
  { _id: false }
);

const ExternalLinkSchema = new Schema<IAnimeExternalLink>(
  {
    id: { type: Number },
    url: { type: String, required: true },
    site: { type: String, required: true },
    type: { type: String },
    language: { type: String, default: null },
    color: { type: String, default: null },
    icon: { type: String, default: null },
    notes: { type: String, default: null },
    isDisabled: { type: Boolean, default: false },
  },
  { _id: false }
);

const StreamingEpisodeSchema = new Schema<IStreamingEpisode>(
  {
    title: { type: String, required: true },
    thumbnail: { type: String },
    url: { type: String },
    site: { type: String },
  },
  { _id: false }
);

const RelationNodeTitleSchema = new Schema<IRelationNodeTitle>(
  {
    romaji: { type: String, default: null },
    english: { type: String, default: null },
    native: { type: String, default: null },
  },
  { _id: false }
);

const RelationNodeSchema = new Schema<IRelationNode>(
  {
    id: { type: Number, required: true },
    title: { type: RelationNodeTitleSchema, default: undefined },
    type: { type: String },
    format: { type: String },
    status: { type: String },
  },
  { _id: false }
);

const RelationSchema = new Schema<IRelation>(
  {
    id: { type: Number, required: true },
    relationType: { type: String, required: true },
    node: { type: RelationNodeSchema, required: true },
  },
  { _id: false }
);

const StudioNodeSchema = new Schema<IStudioNode>(
  {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    isAnimationStudio: { type: Boolean, default: undefined },
  },
  { _id: false }
);

const StudioSchema = new Schema<IStudio>(
  {
    id: { type: Number, required: true },
    isMain: { type: Boolean, default: undefined },
    node: { type: StudioNodeSchema, required: true },
  },
  { _id: false }
);

/* ---------- Main schema ---------- */
const AnimeFinalSchema = new Schema<IAnimeFinal>(
  {
    title_romaji: { type: String, required: true, index: true },
    title_english: { type: String, index: true },
    title_native: { type: String },
    title_userPreferred: { type: String, index: true },

    format: { type: String },
    description: { type: String },

    startDate_year: { type: Number },
    startDate_month: { type: Number },
    startDate_day: { type: Number },
    endDate_year: { type: Number },
    endDate_month: { type: Number },
    endDate_day: { type: Number },

    episodes: {
      type: Number,
      set: (v: any) => (typeof v === 'string' ? parseFloat(v) : v),
    },
    duration: {
      type: Number,
      set: (v: any) => (typeof v === 'string' ? parseFloat(v) : v),
    },
    countryOfOrigin: { type: String },
    source: { type: String },

    hashtag: { type: String },
    trailer_thumbnail: { type: String },
    bannerImage: { type: String },

    genres: {
      type: [String],
      default: [],
      set: (val: string[] | string) =>
        Array.isArray(val) ? val : String(val).split(',').map(g => g.trim()).filter(Boolean),
    },
    synonyms: {
      type: [String],
      default: [],
      set: (val: string[] | string) =>
        Array.isArray(val) ? val : String(val).split(',').map(s => s.trim()).filter(Boolean),
    },
    tags: { type: [TagSchema], default: [] },

    averageScore: { type: Number },
    meanScore: { type: Number },
    popularity: { type: Number, index: true },
    isAdult: { type: Boolean, default: false },
    siteUrl: { type: String },

    externalLinks: { type: [ExternalLinkSchema], default: [] },
    streamingEpisodes: { type: [StreamingEpisodeSchema], default: [] },
    relations: { type: [RelationSchema], default: [] },
    studios: { type: [StudioSchema], default: [] },
  },
  { timestamps: true }
);

// Useful indexes
AnimeFinalSchema.index({ title_userPreferred: 1, title_romaji: 1, title_english: 1 });
AnimeFinalSchema.index({
  title_userPreferred: 'text',
  title_romaji: 'text',
  title_english: 'text',
  title_native: 'text',
  genres: 'text',
  synonyms: 'text',
});

export default mongoose.model<IAnimeFinal>('anime_final', AnimeFinalSchema, 'anime_final');
