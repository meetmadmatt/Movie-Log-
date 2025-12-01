import { SearchResult } from "../types";

// Hardcoded Key provided by user for reliability
const DEFAULT_API_KEY = "4c7701a91cf42adf693c5cd614951311";

const getApiKey = () => {
  // 1. Check environment variable (Build time injection)
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      // @ts-ignore
      return process.env.API_KEY;
    }
  } catch (e) {
    // Ignore reference errors
  }

  // 2. Check Local Storage (Runtime)
  if (typeof window !== 'undefined') {
    const localKey = localStorage.getItem('tmdb_api_key');
    if (localKey) return localKey;
  }

  // 3. Fallback to hardcoded key
  return DEFAULT_API_KEY;
};

const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

// Helper to fetch data
const fetchTMDB = async (endpoint: string, params: Record<string, string> = {}) => {
  const apiKey = getApiKey();
  
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.append("api_key", apiKey);
  url.searchParams.append("language", "zh-TW"); // Force Traditional Chinese
  
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      url.searchParams.append(key, params[key]);
    }
  });

  const res = await fetch(url.toString());
  
  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`TMDB API Error (${res.status}):`, errorBody);
    throw new Error(`TMDB API Error: ${res.status} ${res.statusText}`);
  }
  
  return res.json();
};

export const searchMovieInfo = async (query: string): Promise<SearchResult[]> => {
  if (!query || !query.trim()) return [];

  try {
    // 1. Search for movies
    const searchData = await fetchTMDB("/search/movie", { query: query.trim(), include_adult: "false" });
    
    if (!searchData.results) return [];
    
    const results = searchData.results.slice(0, 4); // Take top 4

    // 2. Fetch details (Director/Cast) for each result in parallel
    const detailedResults = await Promise.all(
      results.map(async (movie: any) => {
        try {
          // Fetch credits (cast/crew)
          const creditsData = await fetchTMDB(`/movie/${movie.id}/credits`);
          
          // Find Director
          const director = creditsData.crew.find((p: any) => p.job === "Director")?.name || "Unknown";
          
          // Find Top 3 Actors
          const actors = creditsData.cast
            .slice(0, 3)
            .map((p: any) => p.name)
            .join(", ");

          // Format Title: "Original Title (Chinese Title)"
          // If they are the same, just show one.
          const displayTitle = movie.original_title === movie.title 
            ? movie.title 
            : `${movie.original_title} (${movie.title})`;

          return {
            title: displayTitle,
            year: movie.release_date ? movie.release_date.split("-")[0] : "N/A",
            director: director,
            actors: actors,
            plot: movie.overview || "暫無劇情簡介",
            posterUrl: movie.poster_path 
              ? `${IMAGE_BASE_URL}${movie.poster_path}` 
              : `https://placehold.co/400x600/1a1a1a/666?text=No+Poster`,
            tmdbId: movie.id // internal use
          };
        } catch (innerError) {
          console.warn(`Failed to fetch details for movie ID ${movie.id}`, innerError);
          return null;
        }
      })
    );

    return detailedResults.filter((m): m is SearchResult => m !== null);

  } catch (error) {
    console.error("TMDB Search Error:", error);
    return [];
  }
};

export const suggestAlternativePosters = async (movieTitle: string): Promise<string[]> => {
  try {
    // 1. Clean up title for search (Remove Chinese parts in parentheses for better matching if needed, or search full)
    // Example: "Interstellar (星際效應)" -> "Interstellar"
    let cleanQuery = movieTitle.split('(')[0].trim();
    if (!cleanQuery) cleanQuery = movieTitle; // Fallback if split results in empty

    // 2. Quick search to get ID
    const searchData = await fetchTMDB("/search/movie", { query: cleanQuery });
    
    if (!searchData.results || searchData.results.length === 0) {
      console.warn("No movie found for poster search:", cleanQuery);
      return [];
    }
    
    const movieId = searchData.results[0].id;

    // 3. Get Images (Posters)
    // include_image_language: 'en,null,zh' to get various posters
    const imagesData = await fetchTMDB(`/movie/${movieId}/images`, { include_image_language: "en,zh,null" });
    
    if (!imagesData.posters) return [];

    // Return top 8 posters
    return imagesData.posters
      .slice(0, 8)
      .map((img: any) => `${IMAGE_BASE_URL}${img.file_path}`);

  } catch (error) {
    console.error("TMDB Poster Error:", error);
    return [];
  }
};