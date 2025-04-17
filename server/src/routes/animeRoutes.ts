import express from 'express';
import { getAllAnime, createAnime, getAnimeById,getAnimeTitles } from '../controllers/animeController';

const router = express.Router();

router.get('/', getAllAnime);
router.get('/titles', getAnimeTitles);
router.post('/', createAnime);
router.get('/:id', getAnimeById);

export default router;