import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/auth-context';
import { useCampaign, useCampaignDiscord, useDeleteCampaign } from '@/hooks/useCampaigns';
import {
  useCampaignParticipants,
  useJoinCampaign,
  useMyParticipation,
  useWithdraw,
} from '@/hooks/useParticipants';
import { useToast } from '@/hooks/toast-context';
import { isCampaignId } from '@/lib/domain';
import { errorKey } from '@/lib/errors';
import { Button } from '@/components/ui/Button';
import { LinkButton } from '@/components/ui/LinkButton';
import { Alert, ErrorState, LoadingIndicator } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Modal';
import { Markdown } from '@/components/ui/Markdown';
import { CampaignHeader } from '@/components/campaigns/CampaignHeader';
import { CampaignPlayers } from '@/components/campaigns/CampaignPlayers';
import { CampaignReviews } from '@/components/campaigns/CampaignReviews';
import { ParticipationPanel } from '@/components/campaigns/ParticipationPanel';
import { NotFoundPage } from './NotFoundPage';
export function CampaignPage() {
  const id = useParams().id ?? '';
  const navigate = useNavigate();
  const { t } = useTranslation();
  const toast = useToast();
  const { user, loading, openAuth } = useAuth();
  const query = useCampaign(id);
  const participants = useCampaignParticipants(id);
  const own = useMyParticipation(id, user?.id);
  const isDM = !!user && user.id === query.data?.dm_id;
  const discord = useCampaignDiscord(id, isDM || own.data?.status === 'accepted');
  const join = useJoinCampaign();
  const remove = useDeleteCampaign();
  const leave = useWithdraw();
  const [modal, setModal] = useState<'delete' | 'leave' | null>(null);
  const [message, setMessage] = useState<{ success: boolean; key: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  if (!isCampaignId(id)) return <NotFoundPage />;
  if (query.isPending) return <LoadingIndicator />;
  if (query.isError)
    return (
      <div className="page-shell page-content">
        <ErrorState
          error={query.error}
          onRetry={() => {
            void query.refetch();
          }}
        />
      </div>
    );
  const campaign = query.data;
  if (!campaign) return <NotFoundPage />;
  const joinCampaign = async () => {
    if (!user || join.isPending) return;
    setMessage(null);
    try {
      await join.mutateAsync({ campaignId: id });
      setMessage({ success: true, key: 'campaign.applicationSent' });
    } catch (error) {
      setMessage({ success: false, key: errorKey(error) });
    }
  };
  const confirm = async () => {
    setActionError(null);
    try {
      if (modal === 'delete') {
        await remove.mutateAsync(id);
        navigate('/dashboard');
      } else {
        await leave.mutateAsync(id);
        toast('campaign.withdrawn');
      }
      setModal(null);
    } catch (error) {
      setActionError(errorKey(error));
    }
  };
  return (
    <div className="page-shell page-content animate-fade-in">
      <Link
        to="/#catalog"
        className="inline-flex items-center gap-2 text-xs text-text-muted mb-7 hover:text-gold"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        {t('common.backToCatalog')}
      </Link>
      <CampaignHeader campaign={campaign} />
      {isDM && (
        <div className="flex flex-wrap gap-3 mb-7">
          <LinkButton to={`/campaign/${id}/edit`} size="sm" variant="secondary">
            <Pencil size={14} aria-hidden="true" />
            {t('common.actions.edit')}
          </LinkButton>
          <Button
            size="sm"
            variant="danger"
            icon={<Trash2 size={14} />}
            onClick={() => {
              setModal('delete');
              setActionError(null);
            }}
          >
            {t('common.actions.delete')}
          </Button>
        </div>
      )}
      <div className="detail-grid">
        <div className="detail-main">
          <section className="surface">
            <h2>{t('campaign.about')}</h2>
            {campaign.description ? (
              <Markdown>{campaign.description}</Markdown>
            ) : (
              <p className="text-text-muted">{t('campaign.noDescription')}</p>
            )}
          </section>
          {participants.isPending ? (
            <LoadingIndicator />
          ) : participants.isError ? (
            <ErrorState
              error={participants.error}
              onRetry={() => {
                void participants.refetch();
              }}
            />
          ) : (
            <CampaignPlayers
              players={participants.data.filter((p) => p.status === 'accepted')}
              maxPlayers={campaign.max_players}
            />
          )}
          <CampaignReviews
            campaignId={id}
            currentUserId={user?.id}
            canReview={!!user && !isDM && own.data?.status === 'accepted'}
          />
        </div>
        <ParticipationPanel
          campaign={campaign}
          userId={user?.id}
          participation={own.data}
          checking={loading || (!!user && own.isPending)}
          joining={join.isPending}
          privateUrl={discord.data}
          privateError={discord.error}
          participationError={own.error}
          message={message}
          onJoin={joinCampaign}
          onSignIn={() => openAuth(`/campaign/${id}`)}
          onLeave={() => {
            setModal('leave');
            setActionError(null);
          }}
          onRetry={() => {
            void own.refetch();
          }}
        />
      </div>
      <Modal
        isOpen={!!modal}
        title={t(modal === 'delete' ? 'campaign.deleteTitle' : 'campaign.leaveTitle')}
        dismissible={!remove.isPending && !leave.isPending}
        onClose={() => setModal(null)}
      >
        <p className="text-sm text-text-secondary mb-6">
          {t(modal === 'delete' ? 'campaign.deleteWarning' : 'campaign.leaveDescription', {
            title: campaign.title,
          })}
        </p>
        {actionError && (
          <div className="mb-5">
            <Alert>{t(actionError)}</Alert>
          </div>
        )}
        <div className="flex flex-wrap justify-end gap-3">
          <Button
            variant="ghost"
            disabled={remove.isPending || leave.isPending}
            onClick={() => setModal(null)}
          >
            {t('common.actions.cancel')}
          </Button>
          <Button variant="danger" onClick={confirm} loading={remove.isPending || leave.isPending}>
            {t(modal === 'delete' ? 'common.actions.deleteForever' : 'campaign.leave')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
