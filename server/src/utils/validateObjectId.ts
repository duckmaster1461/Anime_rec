// src/utils/validateObjectId.ts
import mongoose from "mongoose";

export const ensureValidObjectId = (value: string): boolean =>
  mongoose.isValidObjectId(value);
