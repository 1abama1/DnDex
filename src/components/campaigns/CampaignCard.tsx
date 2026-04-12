import { Link } from 'react-router-dom';
import { Users, Star } from 'lucide-react';
import { TypeBadge, StatusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { useTranslation } from 'react-i18next';
import { SYSTEM_COLORS } from '@/lib/config';
import type { Campaign } from '@/types/database';

interface CampaignCardProps {
  campaign: Campaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const { t } = useTranslation();
  const gradient = SYSTEM_COLORS[campaign.system] || 'from-slate-600 to-gray-500';

  return (
    <Link
      to={`/campaign/${campaign.id}`}
      className="block bg-bg-card rounded-[16px] overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)] group flex flex-col h-full border border-border"
    >
      <div className={`h-24 w-full bg-gradient-to-r ${gradient} opacity-80 group-hover:opacity-100 transition-opacity flex justify-end p-3`}>
        <StatusBadge status={campaign.status} />
      </div>

      <div className="p-[20px] flex flex-col flex-1">
        <div className="flex justify-between items-start mb-3">
          <TypeBadge type={campaign.type} />
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            {campaign.system}
          </span>
        </div>

        <h3 className="text-xl font-extrabold text-text-primary mb-4 line-clamp-2 leading-tight">
          {campaign.title}
        </h3>

        {campaign.dm && (
          <div className="flex items-center gap-2 mb-4">
            <Avatar src={campaign.dm.avatar_url} username={campaign.dm.username} size="sm" />
            <span className="text-sm font-medium text-text-secondary">
              DM: <span className="text-text-primary/90">{campaign.dm.username}</span>
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm font-bold mt-auto pt-4 border-t border-border mb-4">
          <div className="flex items-center gap-1.5 text-gold">
            <Star size={16} fill="currentColor" />
            <span>{campaign.avg_rating ? campaign.avg_rating.toFixed(1) : 'New'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-text-secondary">
            <Users size={16} />
            <span>{campaign.player_count ?? 0} / {campaign.max_players}</span>
          </div>
        </div>

        <div className="w-full py-2.5 rounded-lg bg-bg-tertiary border border-border text-center font-bold text-sm text-text-primary group-hover:bg-gold group-hover:text-bg-primary group-hover:border-gold transition-colors">
          {t('common.actions.view')}
        </div>
      </div>
    </Link>
  );
}
