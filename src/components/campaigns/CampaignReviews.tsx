import { useState, type FormEvent } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCampaignReviews, useDeleteReview, useSaveReview } from '@/hooks/useReviews';
import { useToast } from '@/hooks/toast-context';
import { reviewSchema } from '@/lib/domain';
import { errorKey } from '@/lib/errors';
import { Avatar } from '@/components/ui/Avatar';
import { Button, IconButton } from '@/components/ui/Button';
import { StarRating } from '@/components/ui/StarRating';
import { Textarea } from '@/components/ui/Input';
import { Alert, ErrorState, LoadingIndicator } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Modal';
import type { Review } from '@/types/database';
function ReviewForm({
  initial,
  onSave,
  onCancel,
  busy,
}: {
  initial?: Review;
  onSave: (rating: number, comment: string) => Promise<void>;
  onCancel?: () => void;
  busy: boolean;
}) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(initial?.rating ?? 5);
  const [comment, setComment] = useState(initial?.comment ?? '');
  const [error, setError] = useState<string | null>(null);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const parsed = reviewSchema.safeParse({ rating, comment });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setError(null);
    try {
      await onSave(parsed.data.rating, parsed.data.comment);
      setComment('');
    } catch (err) {
      setError(errorKey(err));
    }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <StarRating interactive rating={rating} onChange={setRating} size={22} />
      <Textarea
        label={t('campaign.writeReview')}
        placeholder={t('campaign.reviewPlaceholder')}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={2000}
        required
        disabled={busy}
      />
      {error && <Alert>{t(error)}</Alert>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="sm" loading={busy}>
          {t(initial ? 'campaign.updateReview' : 'campaign.submitReview')}
        </Button>
        {onCancel && (
          <Button variant="ghost" size="sm" disabled={busy} onClick={onCancel}>
            {t('common.actions.cancel')}
          </Button>
        )}
      </div>
    </form>
  );
}
export function CampaignReviews({
  campaignId,
  currentUserId,
  canReview,
}: {
  campaignId: string;
  currentUserId?: string;
  canReview: boolean;
}) {
  const { t, i18n } = useTranslation();
  const query = useCampaignReviews(campaignId);
  const save = useSaveReview();
  const remove = useDeleteReview();
  const toast = useToast();
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reviews = query.data ?? [];
  const own = reviews.find((r) => r.author_id === currentUserId);
  const busy = save.isPending || remove.isPending;
  const persist = async (rating: number, comment: string, reviewId?: string) => {
    await save.mutateAsync({ campaignId, rating, comment, reviewId });
    setEditing(null);
    toast('feedback.reviewSaved');
  };
  const deleteReview = async () => {
    if (!deleting || busy) return;
    setError(null);
    try {
      await remove.mutateAsync({ reviewId: deleting, campaignId });
      setDeleting(null);
      toast('feedback.reviewDeleted');
    } catch (err) {
      setError(errorKey(err));
    }
  };
  if (query.isPending) return <LoadingIndicator />;
  if (query.isError)
    return (
      <section className="surface">
        <h2>{t('campaign.reviews')}</h2>
        <ErrorState
          error={query.error}
          onRetry={() => {
            void query.refetch();
          }}
        />
      </section>
    );
  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;
  return (
    <section className="surface">
      <h2>
        {t('campaign.reviews')} <span className="text-text-muted text-xl">({reviews.length})</span>
      </h2>
      {reviews.length > 0 && (
        <div className="review-distribution">
          <div>
            <span className="review-average">{average.toFixed(1)}</span>
            <div>
              <StarRating rating={average} size={12} />
            </div>
          </div>
          <div className="distribution-bars">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = reviews.filter((r) => r.rating === rating).length;
              return (
                <div
                  className="distribution-row"
                  key={rating}
                  aria-label={t('campaign.distribution', { rating, count })}
                >
                  <span>{rating}</span>
                  <div className="distribution-track" aria-hidden="true">
                    <span style={{ width: `${(count / reviews.length) * 100}%` }} />
                  </div>
                  <span>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {canReview && !own && (
        <ReviewForm onSave={(rating, comment) => persist(rating, comment)} busy={busy} />
      )}
      {!canReview && !own && (
        <p className="text-xs text-text-muted mb-5">{t('campaign.reviewEligibility')}</p>
      )}
      {!reviews.length && (
        <p className="text-sm text-text-muted py-5">{t('campaign.beFirstToReview')}</p>
      )}
      {reviews.map((review) => (
        <article className="review-card" key={review.id}>
          {editing === review.id ? (
            <ReviewForm
              key={review.id}
              initial={review}
              onSave={(rating, comment) => persist(rating, comment, review.id)}
              onCancel={() => setEditing(null)}
              busy={busy}
            />
          ) : (
            <>
              <div className="review-heading">
                <Avatar
                  username={review.author?.username ?? t('common.unknown')}
                  src={review.author?.avatar_url}
                  size="sm"
                />
                <div className="text-xs">
                  <strong>{review.author?.username ?? t('common.unknown')}</strong>
                  <time className="block" dateTime={review.created_at}>
                    {new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium' }).format(
                      new Date(review.created_at),
                    )}
                  </time>
                </div>
                <div className="ml-auto flex items-center flex-wrap gap-1">
                  <StarRating rating={review.rating} size={12} />
                  {review.author_id === currentUserId && (
                    <>
                      <IconButton
                        label={t('common.actions.edit')}
                        disabled={busy}
                        onClick={() => setEditing(review.id)}
                      >
                        <Pencil size={14} />
                      </IconButton>
                      <IconButton
                        label={t('campaign.deleteReview')}
                        disabled={busy}
                        onClick={() => {
                          setDeleting(review.id);
                          setError(null);
                        }}
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    </>
                  )}
                </div>
              </div>
              <p>{review.comment}</p>
            </>
          )}
        </article>
      ))}
      <Modal
        isOpen={!!deleting}
        title={t('campaign.deleteReviewConfirm')}
        onClose={() => setDeleting(null)}
        dismissible={!busy}
      >
        {error && (
          <div className="mb-5">
            <Alert>{t(error)}</Alert>
          </div>
        )}
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" disabled={busy} onClick={() => setDeleting(null)}>
            {t('common.actions.cancel')}
          </Button>
          <Button variant="danger" loading={busy} onClick={deleteReview}>
            {t('campaign.yesDelete')}
          </Button>
        </div>
      </Modal>
    </section>
  );
}
