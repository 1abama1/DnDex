import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useDebounce } from '@/hooks/useDebounce';
import { readFilters, writeFilters, campaignStatuses, PAGE_SIZE } from '@/lib/domain';
import { isBackendConfigured } from '@/lib/supabase';
import { SYSTEMS } from '@/lib/config';
import { CampaignCard } from './CampaignCard';
import { CampaignGridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { LinkButton } from '@/components/ui/LinkButton';
import { Input, Select } from '@/components/ui/Input';
import { Alert, ErrorState } from '@/components/ui/Feedback';
import type { CampaignFilters } from '@/types/database';
export function CampaignGrid() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const filters = readFilters(params);
  const search = useDebounce(filters.search, 300);
  const query = useCampaigns(
    { ...filters, search: search?.trim() },
    search === filters.search && isBackendConfigured,
  );
  const update = (changes: Partial<CampaignFilters>, replace = false) =>
    setParams(writeFilters({ ...filters, ...changes, page: changes.page ?? 1 }), {
      replace,
      preventScrollReset: true,
    });
  const active = [
    filters.type !== 'all',
    filters.system !== 'all',
    filters.status !== 'all',
    filters.available,
    !!filters.search,
  ].filter(Boolean).length;
  const reset = () => setParams({}, { preventScrollReset: true });
  const totalPages = Math.max(1, Math.ceil((query.data?.count ?? 0) / PAGE_SIZE));
  const isUpdating = query.isFetching || search !== filters.search;
  return (
    <div className="discovery">
      <div className="discovery-tools">
        <div className="search-field">
          <Search size={18} aria-hidden="true" />
          <Input
            aria-label={t('discovery.searchLabel')}
            type="search"
            maxLength={100}
            placeholder={t('discovery.search')}
            value={filters.search}
            onChange={(e) => update({ search: e.target.value }, true)}
          />
        </div>
        <Button
          variant={showFilters ? 'outline' : 'secondary'}
          icon={<SlidersHorizontal size={15} />}
          aria-expanded={showFilters}
          aria-controls="campaign-filters"
          onClick={() => setShowFilters((v) => !v)}
        >
          {t('discovery.filters')}
          {active > 0 && <span>({active})</span>}
        </Button>
        <div className="sort-field">
          <Select
            aria-label={t('discovery.sort')}
            value={filters.sortBy}
            onChange={(e) => update({ sortBy: e.target.value === 'rating' ? 'rating' : 'date' })}
            options={[
              { value: 'date', label: t('discovery.newest') },
              { value: 'rating', label: t('discovery.rating') },
            ]}
          />
        </div>
      </div>
      {showFilters && (
        <div className="filter-panel animate-fade-in" id="campaign-filters">
          <Select
            label={t('discovery.system')}
            value={filters.system}
            onChange={(e) => update({ system: e.target.value })}
            options={[
              { value: 'all', label: t('discovery.allSystems') },
              ...SYSTEMS.map((s) => ({
                value: s,
                label: s === 'Other' ? t('discovery.other') : s,
              })),
            ]}
          />
          <Select
            label={t('discovery.status')}
            value={filters.status}
            onChange={(e) => {
              const status = campaignStatuses.find((s) => s === e.target.value) ?? 'all';
              update({ status, available: status !== 'open' ? false : filters.available });
            }}
            options={[
              { value: 'all', label: t('discovery.allStatuses') },
              ...campaignStatuses.map((s) => ({ value: s, label: t(`campaign.status.${s}`) })),
            ]}
          />
          <div className="flex items-end">
            <label className="check-label">
              <input
                type="checkbox"
                checked={filters.available}
                onChange={(e) =>
                  update({
                    available: e.target.checked,
                    ...(e.target.checked ? { status: 'open' } : {}),
                  })
                }
              />
              {t('discovery.available')}
            </label>
          </div>
          <div className="filter-footer">
            <span className="text-xs text-text-muted">
              {t('discovery.active', { count: active })}
            </span>
            <Button
              variant="ghost"
              size="sm"
              icon={<X size={14} />}
              onClick={reset}
              disabled={!active}
            >
              {t('discovery.reset')}
            </Button>
          </div>
        </div>
      )}
      <div className="catalog-types" aria-label={t('discovery.type')}>
        {(['all', 'campaign', 'one_shot'] as const).map((type) => (
          <button
            key={type}
            type="button"
            aria-pressed={filters.type === type}
            onClick={() => update({ type })}
          >
            {t(type === 'all' ? 'discovery.all' : `campaign.type.${type}`)}
          </button>
        ))}
        <p className="result-count" role="status" aria-live="polite">
          {isUpdating && isBackendConfigured
            ? t('discovery.updating')
            : query.data && !query.isError
              ? t('discovery.results', { count: query.data.count })
              : ''}
        </p>
      </div>
      {!isBackendConfigured ? (
        <Alert variant="info">{t('errors.configuration')}</Alert>
      ) : query.isError ? (
        <ErrorState
          error={query.error}
          onRetry={() => {
            void query.refetch();
          }}
        />
      ) : query.isPending ? (
        <CampaignGridSkeleton />
      ) : !query.data.campaigns.length ? (
        <EmptyState
          title={t(active ? 'discovery.emptyTitle' : 'discovery.firstTitle')}
          description={t(active ? 'discovery.emptyDescription' : 'discovery.firstDescription')}
          action={
            active ? (
              <Button variant="outline" onClick={reset}>
                {t('discovery.reset')}
              </Button>
            ) : (
              <LinkButton to="/create">{t('common.createGame')}</LinkButton>
            )
          }
        />
      ) : (
        <>
          <div className="campaign-grid" aria-busy={isUpdating}>
            {query.data.campaigns.map((c) => (
              <CampaignCard campaign={c} key={c.id} />
            ))}
          </div>
          {totalPages > 1 && (
            <nav className="pagination" aria-label={t('discovery.pagination')}>
              <Button
                variant="secondary"
                disabled={filters.page === 1 || query.isPlaceholderData}
                onClick={() => update({ page: (filters.page ?? 1) - 1 })}
                icon={<ArrowLeft size={14} />}
              >
                {t('common.previous')}
              </Button>
              <span>{t('common.page', { page: filters.page, total: totalPages })}</span>
              <Button
                variant="secondary"
                disabled={(filters.page ?? 1) >= totalPages || query.isPlaceholderData}
                onClick={() => update({ page: (filters.page ?? 1) + 1 })}
              >
                {t('common.next')}
                <ArrowRight size={14} aria-hidden="true" />
              </Button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
