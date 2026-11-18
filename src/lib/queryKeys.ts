import type { CampaignFilters } from '@/types/database';
export const queryKeys = {
  campaigns: {
    all: ['campaigns'] as const,
    lists: ['campaigns', 'list'] as const,
    list: (filters: CampaignFilters) => ['campaigns', 'list', filters] as const,
    detail: (id: string) => ['campaigns', 'detail', id] as const,
    dm: (id: string) => ['campaigns', 'dm', id] as const,
    private: (id: string, userId: string) => ['private', 'campaign', id, userId] as const,
  },
  participants: {
    all: ['participants'] as const,
    campaign: (id: string) => ['participants', 'campaign', id] as const,
    myParticipation: (id: string, userId: string) => ['participants', 'own', userId, id] as const,
    myParticipations: (id: string) => ['participants', 'player', id] as const,
    pending: (ids: string[]) => ['participants', 'pending', [...ids].sort()] as const,
  },
  reviews: { campaign: (id: string) => ['reviews', id] as const },
  profile: (id: string) => ['profile', id] as const,
};
