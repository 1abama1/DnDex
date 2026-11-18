import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './auth-context';
import { queryKeys } from '@/lib/queryKeys';
import { isCampaignId } from '@/lib/domain';
import { refreshCampaign } from '@/lib/cache';
import * as reviews from '@/services/reviews';
export function useCampaignReviews(id: string) {
  return useQuery({
    queryKey: queryKeys.reviews.campaign(id),
    queryFn: () => reviews.getReviews(id),
    enabled: isCampaignId(id),
  });
}
export function useSaveReview() {
  const client = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (input: {
      campaignId: string;
      rating: number;
      comment: string;
      reviewId?: string;
    }) => {
      if (!user) throw new Error('errors.permission');
      return reviews.saveReview(input, user.id);
    },
    onSuccess: (_data, vars) =>
      Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.reviews.campaign(vars.campaignId) }),
        refreshCampaign(client, vars.campaignId),
      ]),
  });
}
export function useDeleteReview() {
  const client = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({ reviewId, campaignId }: { reviewId: string; campaignId: string }) => {
      if (!user) throw new Error('errors.permission');
      return reviews.removeReview(reviewId, campaignId, user.id);
    },
    onSuccess: (_data, vars) =>
      Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.reviews.campaign(vars.campaignId) }),
        refreshCampaign(client, vars.campaignId),
      ]),
  });
}
