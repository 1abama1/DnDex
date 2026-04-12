export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-bg-tertiary rounded-lg animate-shimmer ${className}`}
    />
  );
}

export function CampaignCardSkeleton() {
  return (
    <div className="glass-card-static p-0 overflow-hidden">
      <Skeleton className="w-full h-44 rounded-none rounded-t-lg" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

export function CampaignGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }, (_, i) => (
        <CampaignCardSkeleton key={i} />
      ))}
    </div>
  );
}
