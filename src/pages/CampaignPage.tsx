import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Swords, Trash2, Pencil } from 'lucide-react';
import { useCampaign, useDeleteCampaign } from '@/hooks/useCampaigns';
import {
  useCampaignParticipants,
  useMyParticipation,
  useJoinCampaign,
  useParticipantsRealtime,
} from '@/hooks/useParticipants';
import { useCampaignReviews, useSubmitReview, useUpdateReview, useDeleteReview } from '@/hooks/useReviews';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { CampaignHeader } from '@/components/campaigns/CampaignHeader';
import { CampaignPlayers } from '@/components/campaigns/CampaignPlayers';
import { CampaignReviews } from '@/components/campaigns/CampaignReviews';

export function CampaignPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: campaign, isLoading } = useCampaign(id!);
  const { data: participants } = useCampaignParticipants(id!);
  const { data: reviews } = useCampaignReviews(id!);
  const { data: myParticipation } = useMyParticipation(id!, user?.id);
  const joinCampaign = useJoinCampaign();
  const deleteCampaign = useDeleteCampaign();
  const submitReview = useSubmitReview();
  const updateReview = useUpdateReview();
  const deleteReview = useDeleteReview();

  useParticipantsRealtime(id ? [id] : []);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [joinMessage, setJoinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-text-primary mb-4">{t('campaign.notFound')}</h2>
        <Button variant="outline" onClick={() => navigate('/')}>{t('common.backToCatalog')}</Button>
      </div>
    );
  }

  const isDM = user?.id === campaign.dm_id;
  const acceptedPlayers = participants?.filter((p) => p.status === 'accepted') ?? [];
  const isFull = acceptedPlayers.length >= campaign.max_players;

  const handleJoin = async () => {
    if (!user) return;
    setJoinMessage(null);
    try {
      await joinCampaign.mutateAsync({ campaignId: campaign.id, userId: user.id });
      setJoinMessage({ type: 'success', text: t('campaign.applicationSent') });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('campaign.joinDefaultError');
      setJoinMessage({ type: 'error', text: t('campaign.couldNotJoin', { message }) });
    }
  };

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!user) return;
    await submitReview.mutateAsync({
      campaignId: campaign.id,
      authorId: user.id,
      rating,
      comment,
    });
  };

  const handleUpdateReview = async (reviewId: string, rating: number, comment: string) => {
    await updateReview.mutateAsync({ reviewId, campaignId: campaign.id, rating, comment });
  };

  const handleDeleteReview = async (reviewId: string) => {
    await deleteReview.mutateAsync({ reviewId, campaignId: campaign.id });
  };

  const handleDelete = async () => {
    await deleteCampaign.mutateAsync(campaign.id);
    navigate('/');
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-20 animate-fade-in text-left">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-text-muted hover:text-text-primary mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft size={18} /> {t('common.back')}
      </button>

      <CampaignHeader
        campaign={campaign}
        acceptedPlayers={acceptedPlayers}
        myParticipation={myParticipation ?? null}
        isDM={isDM}
        isFull={isFull}
        isLoggedIn={!!user}
        isJoining={joinCampaign.isPending}
        onJoin={handleJoin}
      />

      {joinMessage && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${
          joinMessage.type === 'success'
            ? 'bg-emerald/10 border border-emerald/30 text-emerald'
            : 'bg-crimson/10 border border-crimson/30 text-crimson-light'
        }`}>
          {joinMessage.text}
        </div>
      )}

      {isDM && (
        <div className="mb-6 flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/campaign/${campaign.id}/edit`)}
            icon={<Pencil size={16} />}
          >
            {t('common.actions.edit')}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteModalOpen(true)}
            icon={<Trash2 size={16} />}
          >
            {t('common.actions.delete')}
          </Button>
        </div>
      )}

      <div className="glass-card-static p-8 mb-6">
        <h2 className="text-2xl font-extrabold tracking-tight text-text-primary mb-6 flex items-center gap-3">
          <Swords size={24} className="text-gold" /> {t('campaign.about')}
        </h2>
        <div className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {campaign.description}
          </ReactMarkdown>
        </div>
      </div>

      <CampaignPlayers players={acceptedPlayers} maxPlayers={campaign.max_players} />

      <CampaignReviews
        reviews={reviews}
        currentUserId={user?.id}
        canReview={!!user && !isDM}
        onSubmitReview={handleSubmitReview}
        onUpdateReview={handleUpdateReview}
        onDeleteReview={handleDeleteReview}
        isSubmitting={submitReview.isPending || updateReview.isPending || deleteReview.isPending}
      />

      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title={t('campaign.deleteTitle')}>
        <p className="text-text-secondary mb-6">
          {t('campaign.deleteWarning', { title: campaign.title })}
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>{t('common.actions.cancel')}</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleteCampaign.isPending}>
            {t('common.actions.deleteForever')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
