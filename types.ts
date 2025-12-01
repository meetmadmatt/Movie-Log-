export interface Rating {
  user: string;
  score: number;
}

export interface Movie {
  id: string;
  title: string;
  year: string;
  director: string;
  actors: string;
  plot: string;
  posterUrl: string;
  ratings: Rating[]; // Changed from single rating number
  dateWatched: string;
  addedBy: string;
}

export interface QueueItem {
  id: string;
  title: string;
  year: string;
  posterUrl: string;
  addedBy: string;
  upvotes: number;
  downvotes: number;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface SearchResult {
  title: string;
  year: string;
  director: string;
  actors: string;
  plot: string;
  posterUrl: string;
}