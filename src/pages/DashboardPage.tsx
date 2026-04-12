import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Swords, Users, Check, X, Clock, Plus, ExternalLink, Pencil } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDMCampaigns } from '@/hooks/useCampaigns';
import {
  useMyParticipations,
  usePendingRequests,
  useRespondToRequest,
  useParticipantsRealtime,
} from '@/hooks/useParticipants';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { TypeBadge, StatusBadge, Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTranslation } from 'react-i18next';
import { translations } from '@/translations';

type Tab = 'dm' | 'player';

export function DashboardPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('dm');
  const { user, profile } = useAuth();

  const { data: dmCampaigns } = useDMCampaigns(user?.id);
  const { data: myParticipations } = useMyParticipations(user?.id);

  const campaignIds = dmCampaigns?.map((c) => c.id) ?? [];
  const { data: pendingRequests } = usePendingRequests(campaignIds);
  const respondToRequest = useRespondToRequest();

  useParticipantsRealtime(campaignIds);

  const handleRespond = async (campaignId: string, userId: string, status: 'accepted' | 'rejected') => {
    await respondToRequest.mutateAsync({ campaignId, userId, status });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-16 lg:py-24 animate-fade-in text-left">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-2xl bg-gold/10">
          <LayoutDashboard size={28} className="text-gold" />
        </div>
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-text-primary mb-1">
            {t('dashboard.title')}
          </h1>
          <p className="text-text-muted text-lg">
            {t('dashboard.welcomeBack')} <span className="text-gold font-semibold">{profile?.username}</span>
          </p>
        </div>
      </div>

      <div className="flex rounded-xl bg-bg-tertiary p-1.5 mb-8 max-w-md">
        <button
          onClick={() => setActiveTab('dm')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-lg transition-all cursor-pointer ${
            activeTab === 'dm'
              ? 'bg-bg-card text-gold shadow-md border border-gold/20'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <Swords size={16} /> {t('dashboard.imDM')}
        </button>
        <button
          onClick={() => setActiveTab('player')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-lg transition-all cursor-pointer ${
            activeTab === 'player'
              ? 'bg-bg-card text-gold shadow-md border border-gold/20'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <Users size={16} /> {t('dashboard.imPlayer')}
        </button>
      </div>

      {activeTab === 'dm' && (
        <DMTab
          dmCampaigns={dmCampaigns ?? []}
          pendingRequests={pendingRequests ?? []}
          onRespond={handleRespond}
          isResponding={respondToRequest.isPending}
        />
      )}

      {activeTab === 'player' && (
        <PlayerTab participations={myParticipations ?? []} />
      )}
    </div>
  );
}

function DMTab({
  dmCampaigns,
  pendingRequests,
  onRespond,
  isResponding,
}: {
  dmCampaigns: { id: string; title: string; type: string; status: string; max_players: number; player_count?: number }[];
  pendingRequests: { user_id: string; campaign_id: string; profile?: { avatar_url: string | null; username: string } }[];
  onRespond: (campaignId: string, userId: string, status: 'accepted' | 'rejected') => Promise<void>;
  isResponding: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      {pendingRequests.length > 0 && (
        <div className="glass-card-static p-8">
          <h2 className="text-xl font-extrabold tracking-tight text-text-primary mb-6 flex items-center gap-3">
            <Clock size={20} className="text-gold" />
            {t('dashboard.pendingRequests')}
            <Badge variant="gold" className="ml-2">{pendingRequests.length}</Badge>
          </h2>
          <div className="space-y-4">
            {pendingRequests.map((req) => {
              const campaign = dmCampaigns.find((c) => c.id === req.campaign_id);
              return (
                <div
                  key={`${req.user_id}-${req.campaign_id}`}
                  className="flex items-center justify-between p-4 rounded-xl bg-bg-tertiary border border-border"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={req.profile?.avatar_url}
                      username={req.profile?.username ?? 'Unknown'}
                    />
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        {req.profile?.username ?? 'Unknown'}
                      </div>
                      <div className="text-xs text-text-muted">
                        {t('dashboard.wantsToJoin')} <span className="text-gold">{campaign?.title}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRespond(req.campaign_id, req.user_id, 'accepted')}
                      loading={isResponding}
                      icon={<Check size={14} />}
                    >
                      {t('common.actions.accept')}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => onRespond(req.campaign_id, req.user_id, 'rejected')}
                      loading={isResponding}
                      icon={<X size={14} />}
                    >
                      {t('common.actions.reject')}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="glass-card-static p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-extrabold tracking-tight text-text-primary flex items-center gap-3">
            <Swords size={20} className="text-gold" /> {t('dashboard.myCampaigns')}
          </h2>
          <Link to="/create">
            <Button size="sm" icon={<Plus size={14} />}>{t('dashboard.newGame')}</Button>
          </Link>
        </div>

        {dmCampaigns.length > 0 ? (
          <div className="space-y-4">
            {dmCampaigns.map((campaign) => (
              <Link
                key={campaign.id}
                to={`/campaign/${campaign.id}`}
                className="flex items-center justify-between p-5 rounded-2xl bg-bg-tertiary border border-border hover:border-border-hover hover:bg-bg-card-hover transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-gold/10 group-hover:bg-gold/15 transition-colors">
                    <Swords size={18} className="text-gold" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text-primary group-hover:text-gold transition-colors">
                      {campaign.title}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <TypeBadge type={campaign.type as 'campaign' | 'one_shot'} />
                      <span className="text-xs text-text-muted">
                        {campaign.player_count ?? 0}/{campaign.max_players} {t('common.players')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={campaign.status} />
                  <Link
                    to={`/campaign/${campaign.id}/edit`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg text-text-muted hover:text-gold hover:bg-gold/10 transition-all"
                    title={t('common.actions.edit')}
                  >
                    <Pencil size={14} />
                  </Link>
                  <ExternalLink size={14} className="text-text-muted group-hover:text-text-secondary" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title={t('dashboard.noCampaignsYet')}
            description={t('dashboard.createFirstCampaign')}
            action={
              <Link to="/create">
                <Button size="sm" icon={<Plus size={14} />}>{t('common.createGame')}</Button>
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}

function PlayerTab({
  participations,
}: {
  participations: { user_id: string; campaign_id: string; status: string; campaign?: { title: string; type: string; system: string } }[];
}) {
  const { t } = useTranslation();
  return (
    <div className="glass-card-static p-8">
      <h2 className="text-xl font-extrabold tracking-tight text-text-primary mb-8 flex items-center gap-3">
        <Users size={20} className="text-gold" /> {t('dashboard.myGames')}
      </h2>

      {participations.length > 0 ? (
        <div className="space-y-4">
          {participations.map((p) => (
            <Link
              key={`${p.user_id}-${p.campaign_id}`}
              to={`/campaign/${p.campaign_id}`}
              className="flex items-center justify-between p-5 rounded-2xl bg-bg-tertiary border border-border hover:border-border-hover hover:bg-bg-card-hover transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-purple/10 group-hover:bg-purple/15 transition-colors">
                  <Users size={18} className="text-purple-light" />
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary group-hover:text-gold transition-colors">
                    {p.campaign?.title ?? 'Unknown Campaign'}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {p.campaign && <TypeBadge type={p.campaign.type as 'campaign' | 'one_shot'} />}
                    <span className="text-xs text-text-muted">{p.campaign?.system}</span>
                  </div>
                </div>
              </div>
              <Badge variant={p.status === 'accepted' ? 'emerald' : p.status === 'pending' ? 'gold' : 'crimson'}>
                {t(`campaign.participantStatus.${p.status as keyof typeof translations.en.translation.campaign.participantStatus}`)}
              </Badge>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title={t('dashboard.noGamesYet')}
          description={t('dashboard.browseCatalog')}
          action={
            <Link to="/">
              <Button variant="outline" size="sm">{t('common.browseCampaigns')}</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
