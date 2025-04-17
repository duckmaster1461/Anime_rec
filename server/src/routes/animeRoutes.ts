import express from 'express';
import { getAllAnime, createAnime, getAnimeById } from '../controllers/animeController';

const router = express.Router();

router.get('/', getAllAnime);
router.post('/', createAnime);
router.get('/:id', getAnimeById);

export default router;