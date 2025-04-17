import mongoose, { Schema, Document } from 'mongoose';

export interface IAnime extends Document {
  uid: number;
  title: string;
  synopsis: string;
  genre: string[];
  aired: string;
  episodes: number;
  members: number;
  popularity: number;
  ranked: number;
  score: number;
  img_url: string;
  link: string;
}

const AnimeSchema: Schema = new Schema({
  uid: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  synopsis: { type: String, required: true },
  genre: [{ type: String }],
  aired: { type: String },
  episodes: { type: Number },
  members: { type: Number },
  popularity: { type: Number },
  ranked: { type: Number },
  score: { type: Number },
  img_url: { type: String },
  link: { type: String }
});

export default mongoose.model<IAnime>('Anime', AnimeSchema);
