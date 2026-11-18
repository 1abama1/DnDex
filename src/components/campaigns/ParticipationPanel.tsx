import { Calendar, Shield, Users, ArrowUpRight, Check, Clock, Feather } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { LinkButton } from '@/components/ui/LinkButton';
import { Alert, ErrorState } from '@/components/ui/Feedback';
import { getJoinState, safeDiscordUrl } from '@/lib/domain';
import type { Campaign, Participant } from '@/types/database';
interface Props {
  campaign: Campaign;
  participation?: Participant | null;
  userId?: string;
  checking: boolean;
  joining: boolean;
  privateUrl?: string | null;
  participationError?: unknown;
  privateError?: unknown;
  message?: { success: boolean; key: string } | null;
  onJoin: () => void;
  onSignIn: () => void;
  onLeave: () => void;
  onRetry: () => void;
}
export function ParticipationPanel({
  campaign,
  participation,
  userId,
  checking,
  joining,
  privateUrl,
  participationError,
  privateError,
  message,
  onJoin,
  onSignIn,
  onLeave,
  onRetry,
}: Props) {
  const { t } = useTranslation();
  const state = getJoinState(campaign, userId, participation);
  const count = campaign.player_count ?? 0;
  const url = safeDiscordUrl(privateUrl);
  const labels = {
    accepted: 'campaign.youAreIn',
    pending: 'campaign.requestPending',
    rejected: 'campaign.requestRejected',
    closed: 'campaign.closed',
    full: 'campaign.partyFull',
    dm: 'campaign.dmNote',
  };
  return (
    <aside className="surface participation-card">
      <h2>{t('campaign.availability')}</h2>
      <div className="flex justify-between text-xs">
        <span className="text-text-secondary">
          {t('campaign.capacity', { current: count, max: campaign.max_players })}
        </span>
        <Users size={15} className="text-gold shrink-0" aria-hidden="true" />
      </div>
      <div
        className="capacity-bar"
        role="meter"
        aria-label={t('campaign.players')}
        aria-valuenow={count}
        aria-valuemin={0}
        aria-valuemax={campaign.max_players}
      >
        <span style={{ width: `${Math.min(100, (count / campaign.max_players) * 100)}%` }} />
      </div>
      <dl>
        <div className="detail-fact">
          <Shield size={17} aria-hidden="true" />
          <div>
            <dt>{t('discovery.system')}</dt>
            <dd>{campaign.system}</dd>
          </div>
        </div>
        <div className="detail-fact">
          <Calendar size={17} aria-hidden="true" />
          <div>
            <dt>{t('campaign.fields.schedule')}</dt>
            <dd>{campaign.schedule || t('campaign.scheduleUnset')}</dd>
          </div>
        </div>
      </dl>
      <div className="participation-action">
        {participationError ? (
          <ErrorState error={participationError} onRetry={onRetry} />
        ) : checking ? (
          <Button loading disabled>
            {t('common.loading')}
          </Button>
        ) : state === 'available' ? (
          <Button onClick={onJoin} loading={joining}>
            {t('campaign.joinCampaign')}
            <ArrowUpRight size={16} aria-hidden="true" />
          </Button>
        ) : state === 'signin' ? (
          <Button onClick={onSignIn}>{t('campaign.signInToJoin')}</Button>
        ) : (
          <Alert variant={state === 'accepted' ? 'success' : 'info'}>
            <span className="flex items-start gap-2">
              {state === 'accepted' ? (
                <Check size={16} />
              ) : state === 'pending' ? (
                <Clock size={16} />
              ) : null}
              {t(labels[state])}
            </span>
          </Alert>
        )}
        {message && <Alert variant={message.success ? 'success' : 'error'}>{t(message.key)}</Alert>}
        {(state === 'accepted' || state === 'dm') &&
          (privateError ? (
            <ErrorState error={privateError} />
          ) : (
            url && (
              <a
                className="button button--outline button--md"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('campaign.discordServer')}
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
            )
          ))}
        {state === 'dm' && (
          <LinkButton variant="outline" to={`/campaign/${campaign.id}/edit`}>
            <Feather size={15} aria-hidden="true" />
            {t('campaign.manage')}
          </LinkButton>
        )}
        {(state === 'pending' || state === 'accepted') && (
          <Button variant="ghost" onClick={onLeave}>
            {t(state === 'pending' ? 'campaign.withdraw' : 'campaign.leave')}
          </Button>
        )}
        <p className="participation-note">{t('campaign.privateHint')}</p>
      </div>
    </aside>
  );
}
