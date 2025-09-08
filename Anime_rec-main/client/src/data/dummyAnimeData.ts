// src/data/dummyAnimeData.ts

export interface AnimeTag {
  id: number;
  name: string;
}

export interface Anime {
  title_romaji: string;
  title_native?: string;
  title_userPreferred?: string;
  format?: string;
  description?: string;
  startDate_year?: number;
  startDate_month: number;
  startDate_day: number;
  endDate_year?: number;
  endDate_month: number;
  endDate_day: number;
  episodes?: number;
  duration?: number;
  countryOfOrigin?: string;
  source?: string;
  bannerImage?: string;
  genres?: string[];
  tags?: AnimeTag[];
  averageScore?: number;
  meanScore?: number;
  popularity?: number;
  isAdult?: boolean;
  siteUrl?: string;
  imageUrl?: string;
}

// src/data/dummyAnimeData.ts
export const dummyAnimeList = [
  {
    title_romaji: "Naruto",
    title_native: "ナルト",
    title_userPreferred: "Naruto",
    format: "TV",
    description: "A young ninja strives to become Hokage of his village.",
    startDate_year: 2002,
    endDate_year: 2007,
    episodes: 220,
    duration: 23,
    countryOfOrigin: "JP",
    source: "MANGA",
    genres: ["Action", "Adventure", "Shounen"],
    tags: [{ id: 1, name: "Ninja" }],
    averageScore: 79,
    meanScore: 76,
    popularity: 16338,
    isAdult: false,
    siteUrl: "https://anilist.co/anime/20/Naruto",
    imageUrl: "https://via.placeholder.com/300x420?text=Naruto"
  },
  {
    title_romaji: "Naruto: Shippuden",
    title_native: "ナルト 疾風伝",
    title_userPreferred: "Naruto Shippuden",
    format: "TV",
    description: "The continuation of Naruto’s journey as he faces new enemies.",
    startDate_year: 2007,
    endDate_year: 2017,
    episodes: 500,
    duration: 23,
    countryOfOrigin: "JP",
    source: "MANGA",
    genres: ["Action", "Adventure", "Shounen"],
    tags: [{ id: 2, name: "Ninja" }],
    averageScore: 82,
    meanScore: 80,
    popularity: 20000,
    isAdult: false,
    siteUrl: "https://anilist.co/anime/1735/Naruto-Shippuden",
    imageUrl: "https://via.placeholder.com/300x420?text=Naruto"
  },
  {
    title_romaji: "One Piece",
    title_native: "ワンピース",
    title_userPreferred: "One Piece",
    format: "TV",
    description: "A young man sets sail to become the King of the Pirates.",
    startDate_year: 1999,
    episodes: 1100,
    duration: 24,
    countryOfOrigin: "JP",
    source: "MANGA",
    genres: ["Action", "Adventure", "Fantasy"],
    tags: [{ id: 3, name: "Pirates" }],
    averageScore: 88,
    meanScore: 85,
    popularity: 25000,
    isAdult: false,
    siteUrl: "https://anilist.co/anime/21/One-Piece",
    imageUrl: "https://via.placeholder.com/300x420?text=One Piece"
  },
  {
    title_romaji: "Bleach",
    title_native: "ブリーチ",
    title_userPreferred: "Bleach",
    format: "TV",
    description: "A teenager gains the powers of a Soul Reaper.",
    startDate_year: 2004,
    endDate_year: 2012,
    episodes: 366,
    duration: 24,
    countryOfOrigin: "JP",
    source: "MANGA",
    genres: ["Action", "Supernatural", "Shounen"],
    tags: [{ id: 4, name: "Soul Reapers" }],
    averageScore: 77,
    meanScore: 75,
    popularity: 18000,
    isAdult: false,
    siteUrl: "https://anilist.co/anime/269/Bleach",
    imageUrl: "https://via.placeholder.com/300x420?text=Bleach"
  },
  {
    title_romaji: "Attack on Titan",
    title_native: "進撃の巨人",
    title_userPreferred: "Shingeki no Kyojin",
    format: "TV",
    description: "Humanity fights against giant Titans for survival.",
    startDate_year: 2013,
    endDate_year: 2023,
    episodes: 87,
    duration: 24,
    countryOfOrigin: "JP",
    source: "MANGA",
    genres: ["Action", "Drama", "Fantasy"],
    tags: [{ id: 5, name: "Titans" }],
    averageScore: 92,
    meanScore: 90,
    popularity: 23000,
    isAdult: false,
    siteUrl: "https://anilist.co/anime/16498/Shingeki-no-Kyojin",
    imageUrl: "https://via.placeholder.com/300x420?text=Attack on Titan"
  },
  {
    title_romaji: "Fullmetal Alchemist: Brotherhood",
    title_native: "鋼の錬金術師 FULLMETAL ALCHEMIST",
    title_userPreferred: "FMA Brotherhood",
    format: "TV",
    description: "Two brothers search for the Philosopher’s Stone after a failed ritual.",
    startDate_year: 2009,
    endDate_year: 2010,
    episodes: 64,
    duration: 24,
    countryOfOrigin: "JP",
    source: "MANGA",
    genres: ["Action", "Adventure", "Drama"],
    tags: [{ id: 6, name: "Alchemy" }],
    averageScore: 95,
    meanScore: 94,
    popularity: 21000,
    isAdult: false,
    siteUrl: "https://anilist.co/anime/5114/Fullmetal-Alchemist-Brotherhood",
    imageUrl: "https://via.placeholder.com/300x420?text=Fullmetal Alchemist"
  },
  {
    title_romaji: "Death Note",
    title_native: "デスノート",
    title_userPreferred: "Death Note",
    format: "TV",
    description: "A high schooler discovers a notebook with deadly powers.",
    startDate_year: 2006,
    endDate_year: 2007,
    episodes: 37,
    duration: 23,
    countryOfOrigin: "JP",
    source: "MANGA",
    genres: ["Thriller", "Supernatural", "Psychological"],
    tags: [{ id: 7, name: "Crime" }],
    averageScore: 89,
    meanScore: 87,
    popularity: 22000,
    isAdult: false,
    siteUrl: "https://anilist.co/anime/1535/Death-Note",
    imageUrl: "https://via.placeholder.com/300x420?text=Death Note"
  },
  {
    title_romaji: "Dragon Ball Z",
    title_native: "ドラゴンボールZ",
    title_userPreferred: "Dragon Ball Z",
    format: "TV",
    description: "The adventures of Goku and friends defending Earth.",
    startDate_year: 1989,
    endDate_year: 1996,
    episodes: 291,
    duration: 24,
    countryOfOrigin: "JP",
    source: "MANGA",
    genres: ["Action", "Martial Arts", "Shounen"],
    tags: [{ id: 8, name: "Martial Arts" }],
    averageScore: 85,
    meanScore: 83,
    popularity: 24000,
    isAdult: false,
    siteUrl: "https://anilist.co/anime/813/Dragon-Ball-Z",
    imageUrl: "https://via.placeholder.com/300x420?text=Dragon Ball Z"
  },
  {
    title_romaji: "Demon Slayer: Kimetsu no Yaiba",
    title_native: "鬼滅の刃",
    title_userPreferred: "Kimetsu no Yaiba",
    format: "TV",
    description: "A boy becomes a demon slayer after demons attack his family.",
    startDate_year: 2019,
    episodes: 44,
    duration: 24,
    countryOfOrigin: "JP",
    source: "MANGA",
    genres: ["Action", "Supernatural", "Historical"],
    tags: [{ id: 9, name: "Demons" }],
    averageScore: 90,
    meanScore: 89,
    popularity: 19500,
    isAdult: false,
    siteUrl: "https://anilist.co/anime/101922/Kimetsu-no-Yaiba",
    imageUrl: "https://via.placeholder.com/300x420?text=Demon Slayer"
  },
  {
    title_romaji: "My Hero Academia",
    title_native: "僕のヒーローアカデミア",
    title_userPreferred: "Boku no Hero Academia",
    format: "TV",
    description: "In a world where almost everyone has powers, a boy without any dreams to become a hero.",
    startDate_year: 2016,
    episodes: 138,
    duration: 24,
    countryOfOrigin: "JP",
    source: "MANGA",
    genres: ["Action", "Superhero", "Shounen"],
    tags: [{ id: 10, name: "Superpowers" }],
    averageScore: 84,
    meanScore: 82,
    popularity: 19000,
    isAdult: false,
    siteUrl: "https://anilist.co/anime/21459/Boku-no-Hero-Academia",
    imageUrl: "https://via.placeholder.com/300x420?text=My hero Academia"
  }
];
