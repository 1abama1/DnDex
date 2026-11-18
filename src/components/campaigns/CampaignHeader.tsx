import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, StatusBadge, TypeBadge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import { CampaignCover } from './CampaignCover';
import type { Campaign } from '@/types/database';
export function CampaignHeader({ campaign }: { campaign: Campaign }) {
  const { t, i18n } = useTranslation();
  return (
    <>
      <CampaignCover
        system={campaign.system}
        coverUrl={campaign.cover_url}
        className="detail-cover"
      />
      <header className="detail-heading">
        <p className="eyebrow mb-5">{t('campaign.dossier')}</p>
        <div className="badges">
          <TypeBadge type={campaign.type} />
          <StatusBadge status={campaign.status} />
          <Badge variant="outline">{campaign.system}</Badge>
        </div>
        <h1>{campaign.title}</h1>
        <div className="flex flex-wrap items-center gap-6">
          <div className="detail-dm">
            <Avatar
              src={campaign.dm?.avatar_url}
              username={campaign.dm?.username ?? t('common.unknown')}
            />
            <div>
              <span className="block">{campaign.dm?.username ?? t('common.unknown')}</span>
              <small>
                {t('common.dm')} ·{' '}
                {new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium' }).format(
                  new Date(campaign.created_at),
                )}
              </small>
            </div>
          </div>
          {!!campaign.review_count && (
            <StarRating rating={campaign.avg_rating ?? 0} count={campaign.review_count} showValue />
          )}
        </div>
      </header>
    </>
  );
}
