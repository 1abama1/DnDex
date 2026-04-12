import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryKeys';
import type { Participant, ParticipantStatus } from '@/types/database';

export function useCampaignParticipants(campaignId: string) {
  return useQuery({
    queryKey: queryKeys.participants.campaign(campaignId),
    queryFn: async (): Promise<Participant[]> => {
      const { data, error } = await supabase
        .from('participants')
        .select('*, profile:profiles!participants_user_id_fkey(*)')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data ?? []) as Participant[];
    },
    enabled: !!campaignId,
  });
}

export function useMyParticipation(campaignId: string, userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.participants.myParticipation(campaignId, userId ?? ''),
    queryFn: async (): Promise<Participant | null> => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data as Participant | null;
    },
    enabled: !!campaignId && !!userId,
  });
}

export function useJoinCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ campaignId, userId }: { campaignId: string; userId: string }) => {
      const { data, error } = await supabase
        .from('participants')
        .insert({ user_id: userId, campaign_id: campaignId })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Failed to join campaign. Check if you are already a participant.');
      return data as Participant;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.participants.campaign(vars.campaignId), refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['my-participation', vars.campaignId], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all, refetchType: 'all' });
    },
  });
}

export function useRespondToRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      campaignId,
      userId,
      status,
    }: {
      campaignId: string;
      userId: string;
      status: ParticipantStatus;
    }) => {
      const { data, error } = await supabase
        .from('participants')
        .update({ status })
        .eq('campaign_id', campaignId)
        .eq('user_id', userId)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('No participant found. The record may not exist or RLS prevents access.');
      }
      return data[0] as Participant;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.participants.all, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['my-participation'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['my-participations'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['pending-requests'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['dm-campaigns'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all, refetchType: 'all' });
    },
  });
}

export function useMyParticipations(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.participants.myParticipations(userId ?? ''),
    queryFn: async (): Promise<Participant[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('participants')
        .select('*, campaign:campaigns(*, dm:profiles!dm_id(*))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as Participant[];
    },
    enabled: !!userId,
  });
}

export function usePendingRequests(campaignIds: string[]) {
  return useQuery({
    queryKey: queryKeys.participants.pending(campaignIds),
    queryFn: async (): Promise<Participant[]> => {
      const { data, error } = await supabase
        .from('participants')
        .select('*, profile:profiles!participants_user_id_fkey(*)')
        .in('campaign_id', campaignIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data ?? []) as Participant[];
    },
    enabled: campaignIds.length > 0,
  });
}

export function useParticipantsRealtime(campaignIds: string[] = []) {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (campaignIds.length === 0) return;

    const channel = supabase.channel(`participants-realtime-${Date.now()}`);

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.participants.all, refetchType: 'all' });
          queryClient.invalidateQueries({ queryKey: ['my-participation'], refetchType: 'all' });
          queryClient.invalidateQueries({ queryKey: ['my-participations'], refetchType: 'all' });
          queryClient.invalidateQueries({ queryKey: ['pending-requests'], refetchType: 'all' });
          queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all, refetchType: 'all' });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [campaignIds.join(','), queryClient]);
}
