import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
export function refreshCampaign(client: QueryClient, campaignId: string) {
  return Promise.all([
    client.invalidateQueries({ queryKey: queryKeys.campaigns.lists }),
    client.invalidateQueries({ queryKey: queryKeys.campaigns.detail(campaignId) }),
    client.invalidateQueries({ queryKey: ['campaigns', 'dm'] }),
  ]);
}
export function refreshParticipants(client: QueryClient, campaignId: string) {
  return Promise.all([
    refreshCampaign(client, campaignId),
    client.invalidateQueries({ queryKey: queryKeys.participants.campaign(campaignId) }),
    client.invalidateQueries({
      queryKey: ['participants', 'own'],
      predicate: (q) => q.queryKey[3] === campaignId,
    }),
    client.invalidateQueries({ queryKey: ['participants', 'player'] }),
    client.invalidateQueries({ queryKey: ['participants', 'pending'] }),
    client.invalidateQueries({ queryKey: ['private', 'campaign', campaignId] }),
  ]);
}
