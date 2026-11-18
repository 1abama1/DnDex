import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './auth-context';
import { queryKeys } from '@/lib/queryKeys';
import { isCampaignId } from '@/lib/domain';
import { refreshParticipants } from '@/lib/cache';
import * as participants from '@/services/participants';
export function useCampaignParticipants(id: string) {
  return useQuery({
    queryKey: queryKeys.participants.campaign(id),
    queryFn: () => participants.getParticipants(id),
    enabled: isCampaignId(id),
  });
}
export function useMyParticipation(id: string, userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.participants.myParticipation(id, userId ?? ''),
    queryFn: () => participants.getMyParticipation(id, userId!),
    enabled: isCampaignId(id) && !!userId,
  });
}
export function useMyParticipations(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.participants.myParticipations(id ?? ''),
    queryFn: () => participants.getMyParticipations(id!),
    enabled: !!id,
  });
}
export function usePendingRequests(ids: string[]) {
  return useQuery({
    queryKey: queryKeys.participants.pending(ids),
    queryFn: () => participants.getPendingRequests(ids),
    enabled: ids.length > 0,
  });
}
export function useJoinCampaign() {
  const client = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({ campaignId }: { campaignId: string }) => {
      if (!user) throw new Error('errors.permission');
      return participants.joinCampaign(campaignId, user.id);
    },
    onSuccess: (_data, vars) => refreshParticipants(client, vars.campaignId),
  });
}
export function useRespondToRequest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (vars: { campaignId: string; userId: string; status: 'accepted' | 'rejected' }) =>
      participants.respondToRequest(vars.campaignId, vars.userId, vars.status),
    onSuccess: (_data, vars) => refreshParticipants(client, vars.campaignId),
  });
}
export function useWithdraw() {
  const client = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (id: string) => {
      if (!user) throw new Error('errors.permission');
      return participants.withdraw(id, user.id);
    },
    onSuccess: (_data, id) => refreshParticipants(client, id),
  });
}
