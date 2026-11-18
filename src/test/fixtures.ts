import type { Campaign, Participant } from '@/types/database';
import type { CampaignFormValues } from '@/lib/domain';
export const campaign: Campaign = {
  id: 'a0000000-0000-4000-8000-000000000001',
  title: 'The Lanterns of Ashenvale',
  description: 'An adventure beyond the last lantern in an ancient forest.',
  type: 'campaign',
  system: 'D&D 5e',
  max_players: 4,
  dm_id: 'dm',
  status: 'open',
  cover_url: null,
  discord_url: null,
  schedule: 'Saturdays 19:00 UTC+6',
  created_at: '2026-11-17T00:00:00Z',
  updated_at: '2026-11-17T00:00:00Z',
  player_count: 2,
  review_count: 0,
  avg_rating: 0,
};
export const participation: Participant = {
  user_id: 'player',
  campaign_id: campaign.id,
  status: 'pending',
  created_at: campaign.created_at,
};
export const formValues: CampaignFormValues = {
  title: campaign.title,
  description: campaign.description,
  type: 'campaign',
  system: campaign.system,
  max_players: 4,
  schedule: '',
  cover_url: '',
  discord_url: '',
  status: 'open',
};
