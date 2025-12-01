import { GoogleGenAI } from "@google/genai";
import { SearchResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const searchMovieInfo = async (query: string): Promise<SearchResult[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Search for movie details for: "${query}". 
      Find up to 3 likely matches.
      For each match, extract the following details:
      - originalTitle: The original title of the movie (e.g., in English or its native language).
      - chineseTitle: The Traditional Chinese (Taiwan) translation of the title.
      - year: Release year.
      - director: Director's name.
      - actors: Main cast (comma separated).
      - plot: A brief plot summary in Traditional Chinese (zh-TW).
      - posterUrl: A direct URL to a high-quality movie poster image file (jpg/png) found on the web. Prefer official posters from reputable sources like IMDb, Wikipedia, or Amazon.
      
      Output the result as a JSON array of objects.
      Wrap the JSON in \`\`\`json code blocks.
      Each object must have keys: originalTitle, chineseTitle, year, director, actors, plot, posterUrl.
      `,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    
    let rawResults: any[] = [];
    
    // Regex to extract JSON block
    const jsonBlock = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonBlock && jsonBlock[1]) {
      rawResults = JSON.parse(jsonBlock[1]);
    } else {
      // Fallback regex for loose markdown
      const looseJson = text.match(/```([\s\S]*?)```/);
      if (looseJson && looseJson[1]) {
        try {
            rawResults = JSON.parse(looseJson[1]);
        } catch (e) {
            console.warn("Failed to parse loose JSON block in searchMovieInfo");
        }
      } else if (text.trim().startsWith('[') && text.trim().endsWith(']')) {
         // Attempt to parse raw text if it looks like JSON
         try {
            rawResults = JSON.parse(text);
         } catch(e) {}
      }
    }

    // Map raw results to SearchResult interface with formatted title
    return rawResults.map((item) => ({
      title: `${item.originalTitle} (${item.chineseTitle})`,
      year: item.year,
      director: item.director,
      actors: item.actors,
      plot: item.plot,
      posterUrl: item.posterUrl
    }));

  } catch (error) {
    console.error("Error fetching movie info:", error);
    return [];
  }
};

export const suggestAlternativePosters = async (movieTitle: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Find 4 distinct, high-quality, vertical poster image URLs for the movie "${movieTitle}".
        Return ONLY a JSON array of strings (URLs). 
        Example: ["https://example.com/poster1.jpg", "https://example.com/poster2.jpg"]
        Wrap in \`\`\`json.
        `,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });
    
    const text = response.text || "";
    
    const jsonBlock = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonBlock && jsonBlock[1]) {
        return JSON.parse(jsonBlock[1]);
    }
    
    const looseJson = text.match(/```([\s\S]*?)```/);
    if (looseJson && looseJson[1]) {
       try {
        return JSON.parse(looseJson[1]);
       } catch (e) {}
    }
     
    if (text.trim().startsWith('[') && text.trim().endsWith(']')) {
        return JSON.parse(text);
    }
    
    return [];
  } catch (e) {
      console.error("Error fetching alternative posters:", e);
      // Fallback to placeholders if search fails
      const styles = ['000000', '10B981', '1a1a1a', '064E3B'];
      return styles.map(bg => 
        `https://placehold.co/400x600/${bg}/fff?text=${encodeURIComponent(movieTitle)}`
      );
  }
};