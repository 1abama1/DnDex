import type { CampaignFilters } from '@/types/database';

export const queryKeys = {
  campaigns: {
    all: ['campaigns'] as const,
    list: (filters: CampaignFilters) => ['campaigns', filters] as const,
    detail: (id: string) => ['campaign', id] as const,
    dm: (dmId: string) => ['dm-campaigns', dmId] as const,
  },
  participants: {
    all: ['participants'] as const,
    campaign: (campaignId: string) => ['participants', campaignId] as const,
    myParticipation: (campaignId: string, userId: string) => ['my-participation', campaignId, userId] as const,
    myParticipations: (userId: string) => ['my-participations', userId] as const,
    pending: (campaignIds: string[]) => ['pending-requests', campaignIds] as const,
  },
  reviews: {
    campaign: (campaignId: string) => ['reviews', campaignId] as const,
  },
} as const;
