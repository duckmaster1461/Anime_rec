// src/routes/animeRoutes.ts
import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import {
  createAnime,
  getAnimeById,
  listAnime,
  updateAnime,
  deleteAnime,
  getAnimeMeta, // <-- add this
} from "../controllers/animeController";

const router = Router();

router.post("/", asyncHandler(createAnime));
router.get("/", asyncHandler(listAnime));

// NEW: metadata for filters (formats + year bounds)
router.get("/meta", asyncHandler(getAnimeMeta));

// Only match valid ObjectId pattern (24 hex chars)
router.get("/:id([a-f0-9]{24})", asyncHandler(getAnimeById));
router.put("/:id([a-f0-9]{24})", asyncHandler(updateAnime));
router.patch("/:id([a-f0-9]{24})", asyncHandler(updateAnime));
router.delete("/:id([a-f0-9]{24})", asyncHandler(deleteAnime));

export default router;
