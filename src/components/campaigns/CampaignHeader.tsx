import { Users, Calendar, Globe, Clock, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TypeBadge, StatusBadge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import { Avatar } from '@/components/ui/Avatar';
import type { Campaign, Participant } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface CampaignHeaderProps {
  campaign: Campaign;
  acceptedPlayers: Participant[];
  myParticipation: Participant | null;
  isDM: boolean;
  isFull: boolean;
  isLoggedIn: boolean;
  isJoining: boolean;
  onJoin: () => void;
}

export function CampaignHeader({
  campaign,
  acceptedPlayers,
  myParticipation,
  isDM,
  isFull,
  isLoggedIn,
  isJoining,
  onJoin,
}: CampaignHeaderProps) {
  const { t, i18n } = useTranslation();
  const renderJoinButton = () => {
    if (!isLoggedIn) {
      return <Button variant="outline" disabled>{t('campaign.signInToJoin')}</Button>;
    }
    if (isDM) return null;
    if (myParticipation?.status === 'accepted') {
      return <Button variant="secondary" disabled icon={<Users size={16} />}>{t('campaign.youAreIn')}</Button>;
    }
    if (myParticipation?.status === 'pending') {
      return <Button variant="secondary" disabled icon={<Clock size={16} />}>{t('campaign.requestPending')}</Button>;
    }
    if (isFull) {
      return <Button variant="secondary" disabled>{t('campaign.partyFull')}</Button>;
    }
    return (
      <Button onClick={onJoin} loading={isJoining} icon={<UserPlus size={16} />}>
        {t('campaign.joinCampaign')}
      </Button>
    );
  };

  return (
    <div className="glass-card-static p-6 sm:p-8 mb-6">
      <div className="flex flex-wrap items-start gap-3 mb-4">
        <TypeBadge type={campaign.type} />
        <StatusBadge status={campaign.status} />
        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-bg-tertiary text-text-secondary border border-border">
          {campaign.system}
        </span>
      </div>

      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text-primary mb-6">
        {campaign.title}
      </h1>

      <div className="flex flex-wrap items-center gap-6 text-sm text-text-secondary mb-6">
        {campaign.dm && (
          <div className="flex items-center gap-2">
            <Avatar src={campaign.dm.avatar_url} username={campaign.dm.username} size="md" />
            <div>
              <div className="text-text-primary font-medium">DM: {campaign.dm.username}</div>
              <div className="text-xs text-text-muted">
                {t('campaign.createdPrefix')} {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true, locale: i18n.language === 'ru' ? ru : undefined })}
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Users size={16} />
          {acceptedPlayers.length}/{campaign.max_players} {t('common.players')}
        </div>

        {campaign.avg_rating !== undefined && campaign.avg_rating > 0 && (
          <StarRating rating={campaign.avg_rating} showValue count={campaign.review_count} />
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-sm mb-6">
        {campaign.schedule && (
          <div className="flex items-center gap-2 text-text-secondary">
            <Calendar size={16} className="text-gold" />
            {campaign.schedule}
          </div>
        )}
        {campaign.discord_url && myParticipation?.status === 'accepted' && (
          <a
            href={campaign.discord_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-purple-light hover:text-purple transition-colors"
          >
            <Globe size={16} />
            {t('campaign.discordServer')}
          </a>
        )}
      </div>

      <div className="flex items-center gap-3">
        {renderJoinButton()}
      </div>
    </div>
  );
}
