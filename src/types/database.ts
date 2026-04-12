export type CampaignType = 'campaign' | 'one_shot';
export type ParticipantStatus = 'pending' | 'accepted' | 'rejected';
export type CampaignStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  type: CampaignType;
  system: string;
  max_players: number;
  dm_id: string;
  status: CampaignStatus;
  cover_url: string | null;
  discord_url: string | null;
  schedule: string | null;
  created_at: string;
  updated_at: string;

  // Joined / computed fields
  dm?: Profile;
  avg_rating?: number;
  review_count?: number;
  player_count?: number;
}

export interface Participant {
  user_id: string;
  campaign_id: string;
  status: ParticipantStatus;
  created_at: string;

  // Joined fields
  profile?: Profile;
  campaign?: Campaign;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  author_id: string;
  campaign_id: string;
  created_at: string;

  // Joined fields
  author?: Profile;
}

// Filters
export interface CampaignFilters {
  search?: string;
  type?: CampaignType | 'all';
  system?: string | 'all';
  sortBy?: 'date' | 'rating';
  status?: CampaignStatus | 'all';
}
