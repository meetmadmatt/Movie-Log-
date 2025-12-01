import React from 'react';
import { Movie } from '../types';
import StarRating from './StarRating';

interface MovieCardProps {
  movie: Movie;
  onClick: (movie: Movie) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  // Calculate Average Rating
  const averageRating = React.useMemo(() => {
    if (!movie.ratings || movie.ratings.length === 0) return 0;
    const sum = movie.ratings.reduce((acc, curr) => acc + curr.score, 0);
    return sum / movie.ratings.length;
  }, [movie.ratings]);

  return (
    <div 
      onClick={() => onClick(movie)}
      className="group relative glass-card rounded-xl overflow-hidden cursor-pointer hover:border-brand-accent/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:-translate-y-1 flex flex-col h-full"
    >
      {/* Poster Image - Vertical Aspect Ratio 2:3 */}
      <div className="relative w-full aspect-[2/3] overflow-hidden">
        <img 
          src={movie.posterUrl} 
          alt={movie.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
      </div>

      {/* Details Body */}
      <div className="p-3 flex flex-col flex-grow bg-gradient-to-b from-transparent to-black/20">
        <h3 className="text-white font-bold text-base leading-tight line-clamp-3 mb-1 group-hover:text-brand-accent transition-colors whitespace-pre-wrap">
          {movie.title}
        </h3>
        
        <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
           <span>{movie.year}</span>
           <span className="truncate max-w-[60%] text-right">{movie.director}</span>
        </div>

        <div className="mt-auto pt-2 border-t border-white/5 flex justify-between items-center">
             {/* Rating Section (Average) */}
             <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
               <StarRating rating={averageRating} readOnly size="sm" />
               <span className="text-[10px] text-gray-500 ml-1">({movie.ratings.length})</span>
             </div>
             
             {/* Date Section */}
             <span className="text-[10px] text-brand-muted font-mono">
               {new Date(movie.dateWatched).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })}
             </span>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;