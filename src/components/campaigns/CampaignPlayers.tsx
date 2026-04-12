import { Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/Avatar';
import type { Participant } from '@/types/database';

interface CampaignPlayersProps {
  players: Participant[];
  maxPlayers: number;
}

export function CampaignPlayers({ players, maxPlayers }: CampaignPlayersProps) {
  const { t } = useTranslation();
  return (
    <div className="glass-card-static p-8 mb-6">
      <h2 className="text-xl font-extrabold tracking-tight text-text-primary mb-6 flex items-center gap-3">
        <Users size={24} className="text-gold" /> {t('campaign.players')} ({players.length}/{maxPlayers})
      </h2>
      {players.length > 0 ? (
        <div className="flex flex-wrap gap-4">
          {players.map((p) => (
            <div key={p.user_id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-tertiary border border-border">
              <Avatar
                src={p.profile?.avatar_url}
                username={p.profile?.username ?? 'Unknown'}
                size="sm"
              />
              <span className="text-sm text-text-primary">{p.profile?.username ?? 'Unknown'}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-text-muted text-sm">{t('campaign.noPlayersYet')}</p>
      )}
    </div>
  );
}
