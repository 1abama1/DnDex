import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { statusMetadata } from '@/lib/domain';
import type { CampaignStatus, CampaignType, ParticipantStatus } from '@/types/database';
type BadgeVariant = 'default' | 'gold' | 'purple' | 'emerald' | 'crimson' | 'outline';
export function Badge({
  children,
  variant = 'default',
  className = '',
  icon,
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <span className={`badge badge--${variant} ${className}`}>
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}
export function TypeBadge({ type }: { type: CampaignType }) {
  const { t } = useTranslation();
  return (
    <Badge variant={type === 'campaign' ? 'purple' : 'gold'}>{t(`campaign.type.${type}`)}</Badge>
  );
}
export function StatusBadge({ status }: { status: CampaignStatus }) {
  const { t } = useTranslation();
  const meta = statusMetadata[status];
  return (
    <Badge variant={meta.variant}>
      <span className="status-dot" aria-hidden="true" />
      {t(meta.key)}
    </Badge>
  );
}
export function ParticipationBadge({ status }: { status: ParticipantStatus }) {
  const { t } = useTranslation();
  return (
    <Badge variant={status === 'accepted' ? 'emerald' : status === 'pending' ? 'gold' : 'crimson'}>
      {t(`campaign.participantStatus.${status}`)}
    </Badge>
  );
}
