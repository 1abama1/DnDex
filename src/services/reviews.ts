import { backend } from '@/lib/supabase';
import { reviewRowSchema, reviewSchema } from '@/lib/domain';
export async function getReviews(id: string) {
  const { data, error } = await backend()
    .from('reviews')
    .select('*,author:profiles!author_id(*)')
    .eq('campaign_id', id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return reviewRowSchema.array().parse(data ?? []);
}
export async function saveReview(
  input: { campaignId: string; rating: number; comment: string; reviewId?: string },
  authorId: string,
) {
  const values = reviewSchema.parse(input);
  const query = input.reviewId
    ? backend()
        .from('reviews')
        .update(values)
        .eq('id', input.reviewId)
        .eq('campaign_id', input.campaignId)
        .eq('author_id', authorId)
    : backend()
        .from('reviews')
        .insert({ ...values, campaign_id: input.campaignId, author_id: authorId });
  const { data, error } = await query.select('*,author:profiles!author_id(*)').single();
  if (error) throw error;
  return reviewRowSchema.parse(data);
}
export async function removeReview(reviewId: string, campaignId: string, authorId: string) {
  const { error } = await backend()
    .from('reviews')
    .delete()
    .eq('id', reviewId)
    .eq('campaign_id', campaignId)
    .eq('author_id', authorId)
    .select('id')
    .single();
  if (error) throw error;
}
