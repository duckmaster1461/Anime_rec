import express from 'express';
import {
  getAllAnime,
  createAnime,
  getAnimeById,
  getAnimeTitles,
  getAnimeSortedByPopularity,
} from '../controllers/animeController';

const router = express.Router();

router.get('/', getAllAnime);
router.get('/titles', getAnimeTitles);
router.get('/popular', getAnimeSortedByPopularity);
router.post('/', createAnime);
router.get('/:id', getAnimeById);

export default router;
