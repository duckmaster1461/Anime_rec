// src/data/dummyAnimeData.ts
export interface Anime {
  Name: string;
  Synopsis: string;
  Score: number;
  Aired: string;
  "Image URL": string;
}

export const dummyAnimeList: Anime[] = [
  {
    Name: "Attack on Titan",
    Synopsis: "Humans fight for survival against man-eating Titans.",
    Score: 9.1,
    Aired: "2013",
    "Image URL": "https://cdn.myanimelist.net/images/anime/10/47347.jpg",
  },
  {
    Name: "Fullmetal Alchemist: Brotherhood",
    Synopsis: "Two brothers seek the Philosopher's Stone to restore their bodies.",
    Score: 9.2,
    Aired: "2009",
    "Image URL": "https://cdn.myanimelist.net/images/anime/1223/96541.jpg",
  },
  {
    Name: "Death Note",
    Synopsis: "A student finds a notebook that kills anyone whose name is written in it.",
    Score: 8.6,
    Aired: "2006",
    "Image URL": "https://cdn.myanimelist.net/images/anime/9/9453.jpg",
  },
];
