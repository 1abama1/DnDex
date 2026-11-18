import { backend } from '@/lib/supabase';
import {
  campaignFormSchema,
  campaignSchema,
  PAGE_SIZE,
  type CampaignFormValues,
} from '@/lib/domain';
import type { CampaignFilters } from '@/types/database';
export const campaignColumns =
  'id,title,description,type,system,max_players,dm_id,status,cover_url,schedule,created_at,updated_at';
const publicProjection = `${campaignColumns},avg_rating,review_count,player_count,dm:profiles!dm_id(*)`;
export async function listCampaigns(filters: CampaignFilters, signal?: AbortSignal) {
  let query = backend().from('campaigns_with_stats').select(publicProjection, { count: 'exact' });
  if (filters.search?.trim())
    query = query.ilike('title', `%${filters.search.trim().replace(/[\\%_]/g, '\\$&')}%`);
  if (filters.type && filters.type !== 'all') query = query.eq('type', filters.type);
  if (filters.system && filters.system !== 'all') query = query.eq('system', filters.system);
  if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
  if (filters.available) query = query.eq('status', 'open').gt('available_seats', 0);
  query = query
    .order(filters.sortBy === 'rating' ? 'avg_rating' : 'created_at', { ascending: false })
    .order('id');
  const start = ((filters.page ?? 1) - 1) * PAGE_SIZE;
  query = query.range(start, start + PAGE_SIZE - 1);
  if (signal) query = query.abortSignal(signal);
  const { data, error, count } = await query;
  if (error) throw error;
  return { campaigns: campaignSchema.array().parse(data ?? []), count: count ?? 0 };
}
export async function getCampaign(id: string, signal?: AbortSignal) {
  let query = backend().from('campaigns_with_stats').select(publicProjection).eq('id', id);
  if (signal) query = query.abortSignal(signal);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data ? campaignSchema.parse(data) : null;
}
export async function getDMCampaigns(userId: string) {
  const { data, error } = await backend()
    .from('campaigns_with_stats')
    .select(publicProjection)
    .eq('dm_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return campaignSchema.array().parse(data ?? []);
}
export async function getCampaignDiscord(id: string): Promise<string | null> {
  const { data, error } = await backend().rpc('get_campaign_discord', { target_campaign: id });
  if (error) throw error;
  return typeof data === 'string' ? data : null;
}
export async function saveCampaign(input: CampaignFormValues, userId: string, id?: string) {
  const values = campaignFormSchema.parse(input);
  const payload = {
    ...values,
    schedule: values.schedule || null,
    cover_url: values.cover_url || null,
    discord_url: values.discord_url || null,
  };
  const query = id
    ? backend().from('campaigns').update(payload).eq('id', id).eq('dm_id', userId)
    : backend()
        .from('campaigns')
        .insert({ ...payload, dm_id: userId, status: 'open' });
  const { data, error } = await query.select(campaignColumns).single();
  if (error) throw error;
  return campaignSchema.parse(data);
}
export async function removeCampaign(id: string, userId: string) {
  const { data, error } = await backend()
    .from('campaigns')
    .delete()
    .eq('id', id)
    .eq('dm_id', userId)
    .select('id')
    .single();
  if (error) throw error;
  if (!data) throw new Error('errors.permission');
}
