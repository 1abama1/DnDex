import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Pencil, ArrowUpRight, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/auth-context';
import { useDMCampaigns } from '@/hooks/useCampaigns';
import {
  useMyParticipations,
  usePendingRequests,
  useRespondToRequest,
} from '@/hooks/useParticipants';
import { useToast } from '@/hooks/toast-context';
import { errorKey } from '@/lib/errors';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { LinkButton } from '@/components/ui/LinkButton';
import { TypeBadge, StatusBadge, ParticipationBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState, LoadingIndicator, Alert } from '@/components/ui/Feedback';
import { Tabs } from '@/components/ui/Tabs';
import type { Campaign, Participant } from '@/types/database';
type Tab = 'dm' | 'player';
export function DashboardPage() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('dm');
  const [error, setError] = useState<string | null>(null);
  const dm = useDMCampaigns(user?.id);
  const player = useMyParticipations(user?.id);
  const ids = dm.data?.map((c) => c.id) ?? [];
  const pending = usePendingRequests(ids);
  const respond = useRespondToRequest();
  const moderate = async (campaignId: string, userId: string, status: 'accepted' | 'rejected') => {
    if (respond.isPending) return;
    setError(null);
    try {
      await respond.mutateAsync({ campaignId, userId, status });
      toast('dashboard.processed');
    } catch (err) {
      setError(errorKey(err));
    }
  };
  return (
    <div className="page-shell page-content max-w-6xl animate-fade-in">
      <div className="section-topline">
        <div>
          <p className="eyebrow mb-4">{t('home.artLabel')}</p>
          <h1 className="form-title">{t('dashboard.title')}</h1>
          <p className="form-intro mb-0">
            {t('dashboard.welcomeBack')}{' '}
            <span className="text-gold">{profile?.username ?? t('common.unknown')}</span>
          </p>
        </div>
      </div>
      <Tabs<Tab>
        label={t('dashboard.tabs')}
        panelId="dashboard-panel"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'dm', label: t('dashboard.imDM') },
          { value: 'player', label: t('dashboard.imPlayer') },
        ]}
      />
      <div
        role="tabpanel"
        id="dashboard-panel"
        aria-label={t(tab === 'dm' ? 'dashboard.imDM' : 'dashboard.imPlayer')}
        tabIndex={0}
      >
        {tab === 'dm' ? (
          dm.isPending ? (
            <LoadingIndicator />
          ) : dm.isError ? (
            <ErrorState
              error={dm.error}
              onRetry={() => {
                void dm.refetch();
              }}
            />
          ) : (
            <>
              <div className="stats-grid">
                <Stat
                  value={
                    dm.data.filter((c) => c.status === 'open' || c.status === 'in_progress').length
                  }
                  label={t('dashboard.active')}
                />
                <Stat
                  value={
                    ids.length && (pending.isPending || pending.isError)
                      ? '—'
                      : (pending.data?.length ?? 0)
                  }
                  label={t('dashboard.pending')}
                />
                <Stat
                  value={dm.data.reduce((sum, c) => sum + (c.player_count ?? 0), 0)}
                  label={t('dashboard.accepted')}
                />
              </div>
              <section className="surface mb-6">
                <h2 className="text-3xl mb-5">{t('dashboard.pendingRequests')}</h2>
                {error && (
                  <div className="mb-5">
                    <Alert>{t(error)}</Alert>
                  </div>
                )}
                {ids.length && pending.isPending ? (
                  <LoadingIndicator />
                ) : pending.isError ? (
                  <ErrorState
                    error={pending.error}
                    onRetry={() => {
                      void pending.refetch();
                    }}
                  />
                ) : !pending.data?.length ? (
                  <p className="text-xs text-text-muted">{t('dashboard.noPending')}</p>
                ) : (
                  pending.data.map((request) => (
                    <RequestRow
                      key={`${request.campaign_id}-${request.user_id}`}
                      request={request}
                      campaign={dm.data.find((c) => c.id === request.campaign_id)}
                      disabled={respond.isPending}
                      busy={
                        respond.isPending &&
                        respond.variables?.userId === request.user_id &&
                        respond.variables.campaignId === request.campaign_id
                      }
                      onRespond={moderate}
                    />
                  ))
                )}
              </section>
              <section className="surface">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                  <h2 className="text-3xl">{t('dashboard.myCampaigns')}</h2>
                  <LinkButton to="/create" size="sm">
                    <Plus size={15} aria-hidden="true" />
                    {t('dashboard.newGame')}
                  </LinkButton>
                </div>
                {dm.data.length ? (
                  dm.data.map((campaign) => <CampaignRow campaign={campaign} key={campaign.id} />)
                ) : (
                  <EmptyState
                    title={t('dashboard.noCampaignsYet')}
                    description={t('dashboard.createFirstCampaign')}
                    action={
                      <LinkButton to="/create" variant="outline">
                        {t('common.createGame')}
                      </LinkButton>
                    }
                  />
                )}
              </section>
            </>
          )
        ) : player.isPending ? (
          <LoadingIndicator />
        ) : player.isError ? (
          <ErrorState
            error={player.error}
            onRetry={() => {
              void player.refetch();
            }}
          />
        ) : (
          <section className="surface">
            <h2 className="text-3xl mb-4">{t('dashboard.myGames')}</h2>
            {player.data.length ? (
              player.data.map((p) => <PlayerRow key={p.campaign_id} participation={p} />)
            ) : (
              <EmptyState
                title={t('dashboard.noGamesYet')}
                description={t('dashboard.browseCatalog')}
                action={
                  <LinkButton to="/#catalog" variant="outline">
                    {t('common.browseCampaigns')}
                  </LinkButton>
                }
              />
            )}
          </section>
        )}
      </div>
    </div>
  );
}
function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
function RequestRow({
  request,
  campaign,
  disabled,
  busy,
  onRespond,
}: {
  request: Participant;
  campaign?: Campaign;
  disabled: boolean;
  busy: boolean;
  onRespond: (campaignId: string, userId: string, status: 'accepted' | 'rejected') => Promise<void>;
}) {
  const { t } = useTranslation();
  const full =
    !campaign || campaign.status !== 'open' || (campaign.player_count ?? 0) >= campaign.max_players;
  return (
    <article className="dashboard-row">
      <div className="request-identity">
        <Avatar
          username={request.profile?.username ?? t('common.unknown')}
          src={request.profile?.avatar_url}
        />
        <div>
          <strong className="text-sm">{request.profile?.username ?? t('common.unknown')}</strong>
          <p>
            {t('dashboard.wantsToJoin')}{' '}
            <Link to={`/campaign/${request.campaign_id}`}>{campaign?.title}</Link>
          </p>
        </div>
      </div>
      <div className="row-actions">
        <Button
          size="sm"
          variant="outline"
          disabled={disabled || full}
          loading={busy}
          icon={<Check size={14} />}
          onClick={() => {
            void onRespond(request.campaign_id, request.user_id, 'accepted');
          }}
        >
          {t('common.actions.accept')}
        </Button>
        <Button
          size="sm"
          variant="danger"
          disabled={disabled}
          loading={busy}
          icon={<X size={14} />}
          onClick={() => {
            void onRespond(request.campaign_id, request.user_id, 'rejected');
          }}
        >
          {t('common.actions.reject')}
        </Button>
      </div>
    </article>
  );
}
function CampaignRow({ campaign }: { campaign: Campaign }) {
  const { t } = useTranslation();
  return (
    <article className="dashboard-row">
      <div>
        <h3>
          <Link to={`/campaign/${campaign.id}`} className="hover:text-gold">
            {campaign.title}
          </Link>
        </h3>
        <div className="row-meta">
          <TypeBadge type={campaign.type} />
          <span>
            {campaign.player_count ?? 0}/{campaign.max_players} {t('common.players')}
          </span>
          <span>{campaign.system}</span>
        </div>
      </div>
      <div className="row-actions">
        <StatusBadge status={campaign.status} />
        <Link
          to={`/campaign/${campaign.id}/edit`}
          className="button button--ghost button--sm"
          aria-label={`${t('common.actions.edit')} ${campaign.title}`}
        >
          <Pencil size={16} aria-hidden="true" />
        </Link>
        <Link
          to={`/campaign/${campaign.id}`}
          className="button button--ghost button--sm"
          aria-label={`${t('common.actions.view')} ${campaign.title}`}
        >
          <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
function PlayerRow({ participation: p }: { participation: Participant }) {
  const { t } = useTranslation();
  return (
    <article className="dashboard-row">
      <div>
        <h3>
          <Link to={`/campaign/${p.campaign_id}`} className="hover:text-gold">
            {p.campaign?.title ?? t('campaign.notFound')}
          </Link>
        </h3>
        <div className="row-meta">
          {p.campaign && (
            <>
              <TypeBadge type={p.campaign.type} />
              <span>{p.campaign.system}</span>
            </>
          )}
        </div>
      </div>
      <div className="row-actions">
        <ParticipationBadge status={p.status} />
        <Link
          to={`/campaign/${p.campaign_id}`}
          className="button button--ghost button--sm"
          aria-label={t('common.actions.view')}
        >
          <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
