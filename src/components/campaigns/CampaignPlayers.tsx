import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/Avatar';
import type { Participant } from '@/types/database';
export function CampaignPlayers({
  players,
  maxPlayers,
}: {
  players: Participant[];
  maxPlayers: number;
}) {
  const { t } = useTranslation();
  return (
    <section className="surface">
      <h2>
        {t('campaign.players')}{' '}
        <span className="text-text-muted text-xl">
          {players.length}/{maxPlayers}
        </span>
      </h2>
      {players.length ? (
        <div className="players-list">
          {players.map((p) => (
            <div className="player-chip" key={p.user_id}>
              <Avatar
                src={p.profile?.avatar_url}
                username={p.profile?.username ?? t('common.unknown')}
                size="sm"
              />
              {p.profile?.username ?? t('common.unknown')}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-text-muted text-sm">{t('campaign.noPlayersYet')}</p>
      )}
    </section>
  );
}
