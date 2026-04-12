import { useState } from 'react';
import { Pencil, Trash2, X, Check } from 'lucide-react';
import { StarRating } from '@/components/ui/StarRating';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import type { Review } from '@/types/database';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface CampaignReviewsProps {
  reviews: Review[] | undefined;
  currentUserId: string | undefined;
  canReview: boolean;
  onSubmitReview: (rating: number, comment: string) => Promise<void>;
  onUpdateReview: (reviewId: string, rating: number, comment: string) => Promise<void>;
  onDeleteReview: (reviewId: string) => Promise<void>;
  isSubmitting: boolean;
}

export function CampaignReviews({
  reviews,
  currentUserId,
  canReview,
  onSubmitReview,
  onUpdateReview,
  onDeleteReview,
  isSubmitting,
}: CampaignReviewsProps) {
  const { t, i18n } = useTranslation();
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!reviewComment.trim()) return;
    await onSubmitReview(reviewRating, reviewComment);
    setReviewComment('');
    setReviewRating(5);
  };

  const startEdit = (review: Review) => {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditRating(5);
    setEditComment('');
  };

  const saveEdit = async () => {
    if (!editingId || !editComment.trim()) return;
    await onUpdateReview(editingId, editRating, editComment);
    setEditingId(null);
  };

  const confirmDelete = async (reviewId: string) => {
    await onDeleteReview(reviewId);
    setDeletingId(null);
  };

  const existingReview = reviews?.find((r) => r.author_id === currentUserId);
  const canSubmitNew = canReview && !existingReview;

  return (
    <div className="glass-card-static p-8">
      <h2 className="text-xl font-extrabold tracking-tight text-text-primary mb-8 flex items-center gap-3">
        {t('campaign.reviews')}
      </h2>

      {canSubmitNew && (
        <div className="mb-8 p-4 rounded-xl bg-bg-tertiary border border-border">
          <h3 className="text-sm font-medium text-text-primary mb-3">{t('campaign.submitReview')}</h3>
          <div className="mb-3">
            <StarRating rating={reviewRating} interactive onChange={setReviewRating} size={24} />
          </div>
          <textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder={t('campaign.reviewPlaceholder')}
            className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold/50 transition-all resize-y min-h-[80px] mb-3"
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={!reviewComment.trim()}
          >
            {t('campaign.submitReview')}
          </Button>
        </div>
      )}

      {reviews && reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => {
            const isOwner = review.author_id === currentUserId;
            const isEditing = editingId === review.id;
            const isDeleting = deletingId === review.id;

            return (
              <div key={review.id} className="p-4 rounded-xl bg-bg-tertiary/50 border border-border/50">
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <StarRating rating={editRating} interactive onChange={setEditRating} size={24} />
                    </div>
                    <textarea
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold/50 transition-all resize-y min-h-[80px]"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEdit} loading={isSubmitting} icon={<Check size={14} />}>
                        {t('common.actions.save')}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEdit} icon={<X size={14} />}>
                        {t('common.actions.cancel')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar
                        src={review.author?.avatar_url}
                        username={review.author?.username ?? 'Anonymous'}
                        size="sm"
                      />
                      <div>
                        <div className="text-sm font-medium text-text-primary">
                          {review.author?.username ?? 'Anonymous'}
                        </div>
                        <div className="text-xs text-text-muted">
                          {format(new Date(review.created_at), 'MMM d, yyyy', { locale: i18n.language === 'ru' ? ru : undefined })}
                        </div>
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        <StarRating rating={review.rating} size={14} />
                        {isOwner && !isDeleting && (
                          <div className="flex gap-1 ml-2">
                            <button
                              onClick={() => startEdit(review)}
                              className="p-1 rounded text-text-muted hover:text-gold hover:bg-gold/10 transition-all cursor-pointer"
                              title={t('common.actions.edit')}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setDeletingId(review.id)}
                              className="p-1 rounded text-text-muted hover:text-crimson-light hover:bg-crimson/10 transition-all cursor-pointer"
                              title={t('common.actions.delete')}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">{review.comment}</p>

                    {isDeleting && (
                      <div className="mt-3 flex items-center gap-3 p-3 rounded-lg bg-crimson/5 border border-crimson/20">
                        <span className="text-sm text-text-secondary">{t('campaign.deleteReviewConfirm')}</span>
                        <Button size="sm" variant="danger" onClick={() => confirmDelete(review.id)} loading={isSubmitting}>
                          {t('campaign.yesDelete')}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeletingId(null)}>
                          {t('common.actions.cancel')}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-text-muted text-sm text-center py-4">{t('campaign.beFirstToReview')}</p>
      )}
    </div>
  );
}
