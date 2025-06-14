import mongoose, { Schema, Document } from 'mongoose';

export interface IAnime extends Document {
  anime_id: number;
  Name: string;
  'English name'?: string;
  'Other name'?: string;
  Score: number;
  Genres: string[];
  Synopsis: string;
  Type?: string;
  Episodes: number;
  Aired?: string;
  Premiered?: string;
  Status?: string;
  Producers?: string;
  Licensors?: string;
  Studios?: string;
  Source?: string;
  Duration?: string;
  Rating?: string;
  Rank?: number;
  Popularity: number;
  Favorites?: number;
  'Scored By'?: number;
  Members: number;
  'Image URL': string;
}

const AnimeSchema: Schema = new Schema({
  anime_id: { type: Number, required: true, unique: true },
  Name: { type: String, required: true },
  'English name': { type: String },
  'Other name': { type: String },
  Score: { type: Number, required: true },
  Genres: {
    type: [String],
    set: (val: string | string[]) => Array.isArray(val) ? val : val.split(',').map(g => g.trim())
  },
  Synopsis: { type: String, required: true },
  Type: { type: String },
  Episodes: {
    type: Number,
    set: (val: string | number) => typeof val === 'string' ? parseFloat(val) : val
  },
  Aired: { type: String },
  Premiered: { type: String },
  Status: { type: String },
  Producers: { type: String },
  Licensors: { type: String },
  Studios: { type: String },
  Source: { type: String },
  Duration: { type: String },
  Rating: { type: String },
  Rank: {
    type: Number,
    set: (val: string | number) => typeof val === 'string' ? parseFloat(val) : val
  },
  Popularity: { type: Number, required: true },
  Favorites: { type: Number },
  'Scored By': {
    type: Number,
    set: (val: string | number) => typeof val === 'string' ? parseFloat(val) : val
  },
  Members: { type: Number, required: true },
  'Image URL': { type: String, required: true }
});

export default mongoose.model<IAnime>('Anime', AnimeSchema, 'animes_new');
