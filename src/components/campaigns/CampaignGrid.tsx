import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { useCampaigns } from '@/hooks/useCampaigns';
import { CampaignCard } from './CampaignCard';
import { CampaignGridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { SYSTEMS } from '@/lib/config';
import type { CampaignFilters } from '@/types/database';

export function CampaignGrid() {
  const [filters, setFilters] = useState<CampaignFilters>({
    sortBy: 'date',
    type: 'all',
    system: 'all',
  });
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const debouncedFilters = useMemo(
    () => ({ ...filters, search: searchInput || undefined }),
    [filters, searchInput]
  );

  const { data: campaigns, isLoading } = useCampaigns(debouncedFilters);

  return (
    <div className="mt-4 space-y-10">
      <div className="w-full">
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full h-[44px] bg-bg-tertiary rounded-[10px] pl-[44px] pr-[16px] text-text-primary placeholder:text-text-muted border-none focus:outline-none focus:ring-1 focus:ring-gold/30 transition-all font-medium"
            />
          </div>
          <Button
            variant={showFilters ? 'outline' : 'secondary'}
            onClick={() => setShowFilters(!showFilters)}
            icon={<SlidersHorizontal size={16} />}
            className="h-[44px] px-4 rounded-[10px] whitespace-nowrap bg-bg-tertiary border-none text-text-primary hover:bg-white/10"
          >
            <span>Filters</span>
          </Button>
        </div>

        {showFilters && (
          <div className="glass-card-static p-4 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  Type
                </label>
                <div className="flex gap-1.5">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'campaign', label: 'Campaign' },
                    { value: 'one_shot', label: 'One-Shot' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFilters((f) => ({ ...f, type: opt.value as CampaignFilters['type'] }))}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                        filters.type === opt.value
                          ? 'bg-gold/15 text-gold border border-gold/30'
                          : 'bg-bg-tertiary text-text-muted hover:text-text-secondary border border-transparent'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  Game System
                </label>
                <select
                  value={filters.system || 'all'}
                  onChange={(e) => setFilters((f) => ({ ...f, system: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-bg-tertiary border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-gold/50 transition-all cursor-pointer appearance-none"
                >
                  <option value="all">All Systems</option>
                  {SYSTEMS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  Sort By
                </label>
                <div className="flex gap-1.5">
                  {[
                    { value: 'date', label: 'Newest' },
                    { value: 'rating', label: 'Rating' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFilters((f) => ({ ...f, sortBy: opt.value as 'date' | 'rating' }))}
                      className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                        filters.sortBy === opt.value
                          ? 'bg-gold/15 text-gold border border-gold/30'
                          : 'bg-bg-tertiary text-text-muted hover:text-text-secondary border border-transparent'
                      }`}
                    >
                      <ArrowUpDown size={12} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <CampaignGridSkeleton />
      ) : !campaigns || campaigns.length === 0 ? (
        <EmptyState
          title="No campaigns yet"
          description="Be the first to start an adventure"
          action={
            <Link to="/create">
              <Button className="mt-2">Create Campaign</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
