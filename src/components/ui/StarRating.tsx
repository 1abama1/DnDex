import { useId } from 'react';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
interface Props {
  rating: number;
  maxStars?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (value: number) => void;
  showValue?: boolean;
  count?: number;
}
export function StarRating({
  rating,
  maxStars = 5,
  size = 16,
  interactive = false,
  onChange,
  showValue,
  count,
}: Props) {
  const { t } = useTranslation();
  const id = useId();
  const stars = Array.from({ length: maxStars }, (_, i) => i + 1);
  if (interactive)
    return (
      <fieldset className="star-picker">
        <legend className="sr-only">{t('campaign.rating')}</legend>
        {stars.map((value) => (
          <label key={value} className="star-choice">
            <input
              type="radio"
              name={id}
              value={value}
              checked={rating === value}
              onChange={() => onChange?.(value)}
              className="sr-only"
            />
            <span className="sr-only">{t('campaign.starLabel', { count: value })}</span>
            <Star
              size={size}
              aria-hidden="true"
              className={rating >= value ? 'star-filled' : 'star-empty'}
            />
          </label>
        ))}
      </fieldset>
    );
  return (
    <span
      className="rating"
      aria-label={t('campaign.ratingLabel', { rating: rating.toFixed(1), count: maxStars })}
    >
      <span className="flex" aria-hidden="true">
        {stars.map((value) => (
          <Star
            key={value}
            size={size}
            className={rating >= value - 0.5 ? 'star-filled' : 'star-empty'}
          />
        ))}
      </span>
      {showValue && <span>{rating.toFixed(1)}</span>}
      {count !== undefined && <span className="text-text-muted">({count})</span>}
    </span>
  );
}
