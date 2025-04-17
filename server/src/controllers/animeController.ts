import { Request, Response } from 'express';
import Anime from '../models/Anime';

export const getAllAnime = async (req: Request, res: Response): Promise<void> => {
    try {
      const animeList = await Anime.find();
      console.log("🎯 Found anime list:", animeList);
      res.status(200).json(animeList);
    } catch (err) {
      console.error("❌ Error fetching anime list:", err);
      res.status(500).json({ message: 'Failed to fetch anime list' });
    }
  };
  

export const createAnime = async (req: Request, res: Response): Promise<void> => {
    try {
      const anime = new Anime(req.body);
      const savedAnime = await anime.save();
      res.status(201).json(savedAnime);
    } catch (error) {
      res.status(400).json({ message: 'Error creating anime.' });
    }
  };
  
  export const getAnimeById = async (req: Request, res: Response): Promise<void> => {
    try {
      const anime = await Anime.findById(req.params.id);
      if (!anime) {
        res.status(404).json({ message: 'Anime not found.' });
        return;
      }
      res.status(200).json(anime);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving anime.' });
    }
  };
  