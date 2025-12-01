import React, { useState } from 'react';

interface StarRatingProps {
  rating: number;
  onRate?: (rating: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const StarRating: React.FC<StarRatingProps> = ({ rating, onRate, readOnly = false, size = 'md' }) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const displayRating = hoverRating !== null ? hoverRating : rating;

  const handleMouseMove = (e: React.MouseEvent<HTMLSpanElement>, index: number) => {
    if (readOnly) return;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - left) / width;
    setHoverRating(percent > 0.5 ? index : index - 0.5);
  };

  const handleClick = () => {
    if (readOnly || !onRate || hoverRating === null) return;
    onRate(hoverRating);
  };

  const handleMouseLeave = () => {
    setHoverRating(null);
  };

  const starClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-5 h-5';

  return (
    <div className="flex items-center" onMouseLeave={handleMouseLeave}>
      {[1, 2, 3, 4, 5].map((index) => {
        const isFull = displayRating >= index;
        const isHalf = displayRating >= index - 0.5 && displayRating < index;

        return (
          <span
            key={index}
            className={`cursor-${readOnly ? 'default' : 'pointer'} relative ${starClass} mr-1`}
            onMouseMove={(e) => handleMouseMove(e, index)}
            onClick={handleClick}
          >
            {/* Empty Star Background */}
            <svg
              className={`absolute top-0 left-0 w-full h-full text-gray-600`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z" />
            </svg>
            
            {/* Full/Half Star Foreground */}
            <svg
              className={`absolute top-0 left-0 w-full h-full text-brand-accent transition-all duration-150 ${isFull ? 'opacity-100' : isHalf ? 'opacity-100' : 'opacity-0'}`}
              style={{ clipPath: isHalf ? 'inset(0 50% 0 0)' : 'none' }}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z" />
            </svg>
          </span>
        );
      })}
      {!readOnly && <span className="ml-2 text-sm text-brand-muted">{displayRating.toFixed(1)}</span>}
    </div>
  );
};

export default StarRating;
