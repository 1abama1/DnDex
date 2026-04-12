import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryKeys';
import type { Review } from '@/types/database';

export function useCampaignReviews(campaignId: string) {
  return useQuery({
    queryKey: queryKeys.reviews.campaign(campaignId),
    queryFn: async (): Promise<Review[]> => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, author:profiles!author_id(*)')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as Review[];
    },
    enabled: !!campaignId,
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      campaignId,
      authorId,
      rating,
      comment,
    }: {
      campaignId: string;
      authorId: string;
      rating: number;
      comment: string;
    }) => {
      const { data, error } = await supabase
        .from('reviews')
        .insert({ campaign_id: campaignId, author_id: authorId, rating, comment })
        .select('*, author:profiles!author_id(*)')
        .single();
      if (error) throw error;
      return data as Review;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.campaign(vars.campaignId), refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['campaign', vars.campaignId], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all, refetchType: 'all' });
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reviewId,
      campaignId,
      rating,
      comment,
    }: {
      reviewId: string;
      campaignId: string;
      rating: number;
      comment: string;
    }) => {
      const { data, error } = await supabase
        .from('reviews')
        .update({ rating, comment })
        .eq('id', reviewId)
        .select('*, author:profiles!author_id(*)')
        .single();
      if (error) throw error;
      return data as Review;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.campaign(vars.campaignId), refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['campaign', vars.campaignId], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all, refetchType: 'all' });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reviewId,
      campaignId,
    }: {
      reviewId: string;
      campaignId: string;
    }) => {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.campaign(vars.campaignId), refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['campaign', vars.campaignId], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all, refetchType: 'all' });
    },
  });
}
