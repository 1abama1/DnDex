import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showValue?: boolean;
  count?: number;
}

export function StarRating({
  rating,
  maxStars = 5,
  size = 16,
  interactive = false,
  onChange,
  showValue = false,
  count,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxStars }, (_, i) => {
          const starValue = i + 1;
          const filled = displayRating >= starValue;
          const halfFilled = !filled && displayRating >= starValue - 0.5;

          return (
            <button
              key={i}
              type="button"
              disabled={!interactive}
              className={`
                transition-all duration-150 shrink-0
                ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
                disabled:cursor-default
              `}
              onClick={() => interactive && onChange?.(starValue)}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(0)}
            >
              <Star
                size={size}
                className={`
                  transition-colors duration-150
                  ${filled
                    ? 'fill-gold text-gold'
                    : halfFilled
                    ? 'fill-gold/50 text-gold'
                    : 'fill-none text-text-muted/40'
                  }
                `}
              />
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm text-text-secondary font-medium">
          {rating.toFixed(1)}
        </span>
      )}
      {count !== undefined && (
        <span className="text-xs text-text-muted">
          ({count})
        </span>
      )}
    </div>
  );
}
