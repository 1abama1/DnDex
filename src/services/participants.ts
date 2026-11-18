import { backend } from '@/lib/supabase';
import { participantSchema } from '@/lib/domain';
import { campaignColumns } from './campaigns';
export async function getParticipants(campaignId: string) {
  const { data, error } = await backend()
    .from('participants')
    .select('*,profile:profiles!participants_user_id_fkey(*)')
    .eq('campaign_id', campaignId)
    .order('created_at');
  if (error) throw error;
  return participantSchema.array().parse(data ?? []);
}
export async function getMyParticipation(campaignId: string, userId: string) {
  const { data, error } = await backend()
    .from('participants')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ? participantSchema.parse(data) : null;
}
export async function getMyParticipations(userId: string) {
  const { data, error } = await backend()
    .from('participants')
    .select(`*,campaign:campaigns(${campaignColumns},dm:profiles!dm_id(*))`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return participantSchema.array().parse(data ?? []);
}
export async function getPendingRequests(ids: string[]) {
  if (!ids.length) return [];
  const { data, error } = await backend()
    .from('participants')
    .select('*,profile:profiles!participants_user_id_fkey(*)')
    .in('campaign_id', ids)
    .eq('status', 'pending')
    .order('created_at');
  if (error) throw error;
  return participantSchema.array().parse(data ?? []);
}
export async function joinCampaign(campaignId: string, userId: string) {
  const { data, error } = await backend()
    .from('participants')
    .insert({ campaign_id: campaignId, user_id: userId, status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return participantSchema.parse(data);
}
export async function respondToRequest(
  campaignId: string,
  userId: string,
  status: 'accepted' | 'rejected',
) {
  const { data, error } = await backend()
    .from('participants')
    .update({ status })
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .select()
    .single();
  if (error) throw error;
  return participantSchema.parse(data);
}
export async function withdraw(campaignId: string, userId: string) {
  const { error } = await backend()
    .from('participants')
    .delete()
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)
    .select('user_id')
    .single();
  if (error) throw error;
}
