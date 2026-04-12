import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type BadgeVariant = 'default' | 'gold' | 'purple' | 'emerald' | 'crimson' | 'outline';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  icon?: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-white/5 text-text-secondary border-white/10',
  gold: 'bg-gold/10 text-gold-light border-gold/25',
  purple: 'bg-purple/10 text-purple-light border-purple/25',
  emerald: 'bg-emerald/10 text-emerald border-emerald/25',
  crimson: 'bg-crimson/10 text-crimson-light border-crimson/25',
  outline: 'bg-transparent text-text-secondary border-border',
};

export function Badge({ children, variant = 'default', className = '', icon }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2.5 py-0.5
        text-xs font-medium rounded-full border
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

// Predefined badge for campaign type
export function TypeBadge({ type }: { type: 'campaign' | 'one_shot' }) {
  const { t } = useTranslation();
  return (
    <Badge variant={type === 'campaign' ? 'purple' : 'gold'}>
      {type === 'campaign' ? `⚔️ ${t('campaign.type.campaign')}` : `🎯 ${t('campaign.type.one_shot')}`}
    </Badge>
  );
}

// Predefined badge for campaign status
export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const config: Record<string, { variant: BadgeVariant; label: string }> = {
    open: { variant: 'emerald', label: `🟢 ${t('campaign.status.open')}` },
    in_progress: { variant: 'gold', label: `🔶 ${t('campaign.status.open')}` }, // Assuming open for now as placeholder
    completed: { variant: 'default', label: `✅ ${t('campaign.status.closed')}` },
    cancelled: { variant: 'crimson', label: `🔴 ${t('campaign.status.closed')}` },
  };
  const c = config[status] ?? config.open;
  return <Badge variant={c.variant}>{c.label}</Badge>;
}
