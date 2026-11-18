import { useTranslation } from 'react-i18next';
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}
export function CampaignCardSkeleton() {
  return (
    <div className="campaign-card" aria-hidden="true">
      <Skeleton className="aspect-video w-full" />
      <div className="p-6 space-y-5">
        <Skeleton className="h-8 w-4/5" />
        <Skeleton className="h-5 w-3/5" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
export function CampaignGridSkeleton({ count = 6 }: { count?: number }) {
  const { t } = useTranslation();
  return (
    <div role="status">
      <span className="sr-only">{t('common.loading')}</span>
      <div className="campaign-grid">
        {Array.from({ length: count }, (_, i) => (
          <CampaignCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
