import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';
import type { Campaign, CampaignFilters } from '@/types/database';

async function fetchCampaigns(filters: CampaignFilters): Promise<Campaign[]> {
  let query = supabase
    .from('campaigns_with_stats')
    .select('*, dm:profiles!dm_id(*)');

  if (filters.search) {
    query = query.ilike('title', `%${filters.search}%`);
  }
  if (filters.type && filters.type !== 'all') {
    query = query.eq('type', filters.type);
  }
  if (filters.system && filters.system !== 'all') {
    query = query.eq('system', filters.system);
  }
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters.sortBy === 'rating') {
    query = query.order('avg_rating', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Campaign[];
}

export function useCampaigns(filters: CampaignFilters = {}) {
  return useQuery({
    queryKey: queryKeys.campaigns.list(filters),
    queryFn: () => fetchCampaigns(filters),
    staleTime: 30_000,
  });
}

async function fetchCampaign(id: string): Promise<Campaign | null> {
  const { data, error } = await supabase
    .from('campaigns_with_stats')
    .select('*, dm:profiles!dm_id(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Campaign;
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: queryKeys.campaigns.detail(id),
    queryFn: () => fetchCampaign(id),
    enabled: !!id,
  });
}

interface CreateCampaignInput {
  title: string;
  description: string;
  type: 'campaign' | 'one_shot';
  system: string;
  max_players: number;
  discord_url?: string;
  schedule?: string;
  cover_url?: string;
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateCampaignInput) => {
      if (!user) throw new Error('Must be logged in to create a campaign');

      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          ...input,
          dm_id: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Campaign> & { id: string }) => {
      const { data, error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Campaign;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.detail(vars.id) });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('campaigns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
    },
  });
}

export function useDMCampaigns(dmId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.campaigns.dm(dmId ?? ''),
    queryFn: async () => {
      if (!dmId) return [];
      const { data, error } = await supabase
        .from('campaigns_with_stats')
        .select('*, dm:profiles!dm_id(*)')
        .eq('dm_id', dmId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Campaign[];
    },
    enabled: !!dmId,
  });
}
