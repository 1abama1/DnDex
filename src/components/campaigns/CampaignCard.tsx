import { Link } from 'react-router-dom';
import { ArrowUpRight, Calendar, Star, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge, TypeBadge } from '@/components/ui/Badge';
import { CampaignCover } from './CampaignCover';
import type { Campaign } from '@/types/database';
export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const { t } = useTranslation();
  const seats = Math.max(0, campaign.max_players - (campaign.player_count ?? 0));
  return (
    <article>
      <Link
        to={`/campaign/${campaign.id}`}
        className="campaign-card"
        aria-label={`${campaign.title} — ${t('common.actions.view')}`}
      >
        <CampaignCover coverUrl={campaign.cover_url} system={campaign.system}>
          <div className="cover-badges">
            <TypeBadge type={campaign.type} />
            <StatusBadge status={campaign.status} />
          </div>
          <span className="cover-system">{campaign.system}</span>
        </CampaignCover>
        <div className="campaign-card-body">
          <h3>{campaign.title}</h3>
          <div className="campaign-card-dm">
            <Avatar
              username={campaign.dm?.username ?? t('common.unknown')}
              src={campaign.dm?.avatar_url}
              size="sm"
            />
            <span>
              <span>{t('common.dm')} · </span>
              {campaign.dm?.username ?? t('common.unknown')}
            </span>
          </div>
          {campaign.schedule && (
            <p className="campaign-card-schedule">
              <Calendar size={13} className="shrink-0" aria-hidden="true" />
              <span className="line-clamp-2">{campaign.schedule}</span>
            </p>
          )}
          <div className="campaign-card-meta">
            <span className="card-rating">
              <Star size={13} fill="currentColor" aria-hidden="true" />
              {(campaign.review_count ?? 0) > 0
                ? `${(campaign.avg_rating ?? 0).toFixed(1)} (${campaign.review_count})`
                : t('common.new')}
            </span>
            <span className="card-seats">
              <Users size={14} aria-hidden="true" />
              {campaign.player_count ?? 0}/{campaign.max_players} {t('common.players')}
            </span>
          </div>
          <div className="card-action">
            <span>
              {campaign.status === 'open'
                ? t(seats ? 'discovery.seats' : 'discovery.noSeats', { count: seats })
                : t('common.actions.view')}
            </span>
            <ArrowUpRight size={17} aria-hidden="true" />
          </div>
        </div>
      </Link>
    </article>
  );
}
