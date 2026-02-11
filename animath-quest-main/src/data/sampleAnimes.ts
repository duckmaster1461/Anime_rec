export interface Anime {
  id: number;
  name: string;
  imageUrl: string;
  rating: number;
  popularity: number;
  year: number;
  genre: string;
}

export const sampleAnimes: Anime[] = [
  {
    id: 1,
    name: "Dragon Quest Chronicles",
    imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&h=400&fit=crop",
    rating: 8.5,
    popularity: 95000,
    year: 2020,
    genre: "Action"
  },
  {
    id: 2,
    name: "Moonlight Warriors",
    imageUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&h=400&fit=crop",
    rating: 9.2,
    popularity: 120000,
    year: 2021,
    genre: "Fantasy"
  },
  {
    id: 3,
    name: "Silent Shadows",
    imageUrl: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=300&h=400&fit=crop",
    rating: 7.8,
    popularity: 75000,
    year: 2019,
    genre: "Mystery"
  },
  {
    id: 4,
    name: "Cyber Nexus",
    imageUrl: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=300&h=400&fit=crop",
    rating: 8.9,
    popularity: 105000,
    year: 2022,
    genre: "Sci-Fi"
  },
  {
    id: 5,
    name: "Eternal Flames",
    imageUrl: "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=300&h=400&fit=crop",
    rating: 8.1,
    popularity: 88000,
    year: 2020,
    genre: "Adventure"
  },
  {
    id: 6,
    name: "Ocean's Destiny",
    imageUrl: "https://images.unsplash.com/photo-1601850494422-3cf14624b0b3?w=300&h=400&fit=crop",
    rating: 7.5,
    popularity: 62000,
    year: 2018,
    genre: "Drama"
  },
  {
    id: 7,
    name: "Starlight Academy",
    imageUrl: "https://images.unsplash.com/photo-1613376023733-0a73315d9b06?w=300&h=400&fit=crop",
    rating: 8.7,
    popularity: 98000,
    year: 2021,
    genre: "School"
  },
  {
    id: 8,
    name: "Dark Phoenix Rising",
    imageUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300&h=400&fit=crop",
    rating: 9.0,
    popularity: 115000,
    year: 2022,
    genre: "Action"
  },
  {
    id: 9,
    name: "Time Loop Paradox",
    imageUrl: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300&h=400&fit=crop",
    rating: 8.3,
    popularity: 92000,
    year: 2021,
    genre: "Sci-Fi"
  },
  {
    id: 10,
    name: "Garden of Dreams",
    imageUrl: "https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=300&h=400&fit=crop",
    rating: 7.9,
    popularity: 71000,
    year: 2019,
    genre: "Romance"
  }
];
