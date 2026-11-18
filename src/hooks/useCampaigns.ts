import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './auth-context';
import { queryKeys } from '@/lib/queryKeys';
import { isCampaignId, type CampaignFormValues } from '@/lib/domain';
import { refreshCampaign } from '@/lib/cache';
import * as campaigns from '@/services/campaigns';
import type { CampaignFilters } from '@/types/database';
export function useCampaigns(filters: CampaignFilters = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.campaigns.list(filters),
    queryFn: ({ signal }) => campaigns.listCampaigns(filters, signal),
    placeholderData: keepPreviousData,
    enabled,
  });
}
export function useCampaign(id: string) {
  return useQuery({
    queryKey: queryKeys.campaigns.detail(id),
    queryFn: ({ signal }) => campaigns.getCampaign(id, signal),
    enabled: isCampaignId(id),
  });
}
export function useCampaignDiscord(id: string, allowed: boolean) {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.campaigns.private(id, user?.id ?? ''),
    queryFn: () => campaigns.getCampaignDiscord(id),
    enabled: !!user && allowed && isCampaignId(id),
  });
}
export function useCreateCampaign() {
  const client = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (input: CampaignFormValues) => {
      if (!user) throw new Error('errors.permission');
      return campaigns.saveCampaign(input, user.id);
    },
    onSuccess: (data) => refreshCampaign(client, data.id),
  });
}
export function useUpdateCampaign() {
  const client = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({ id, ...input }: CampaignFormValues & { id: string }) => {
      if (!user) throw new Error('errors.permission');
      return campaigns.saveCampaign(input, user.id, id);
    },
    onSuccess: (data) =>
      Promise.all([
        refreshCampaign(client, data.id),
        client.invalidateQueries({ queryKey: ['private', 'campaign', data.id] }),
      ]),
  });
}
export function useDeleteCampaign() {
  const client = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (id: string) => {
      if (!user) throw new Error('errors.permission');
      return campaigns.removeCampaign(id, user.id);
    },
    onSuccess: (_data, id) => {
      client.removeQueries({ queryKey: queryKeys.campaigns.detail(id) });
      client.removeQueries({ queryKey: ['private', 'campaign', id] });
      return Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.campaigns.all }),
        client.invalidateQueries({ queryKey: queryKeys.participants.all }),
      ]);
    },
  });
}
export function useDMCampaigns(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.campaigns.dm(id ?? ''),
    queryFn: () => campaigns.getDMCampaigns(id!),
    enabled: !!id,
  });
}
