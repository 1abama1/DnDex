import { z } from 'zod';
import type {
  Campaign,
  CampaignFilters,
  CampaignStatus,
  Participant,
  Profile,
  Review,
} from '@/types/database';

export const campaignStatuses = ['open', 'in_progress', 'completed', 'cancelled'] as const;
export const campaignTypes = ['campaign', 'one_shot'] as const;
export const statusMetadata = {
  open: { variant: 'emerald', key: 'campaign.status.open' },
  in_progress: { variant: 'gold', key: 'campaign.status.in_progress' },
  completed: { variant: 'default', key: 'campaign.status.completed' },
  cancelled: { variant: 'crimson', key: 'campaign.status.cancelled' },
} as const satisfies Record<CampaignStatus, { variant: string; key: string }>;
export function safeImageUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined;
  } catch {
    return undefined;
  }
}
export function safeDiscordUrl(value: string | null | undefined): string | undefined {
  const safe = safeImageUrl(value);
  if (!safe) return undefined;
  return ['discord.gg', 'discord.com'].includes(new URL(safe).hostname) ? safe : undefined;
}
const imageUrl = z
  .string()
  .trim()
  .max(2048, 'campaign.validation.urlMax')
  .refine((v) => !v || !!safeImageUrl(v), 'campaign.validation.invalidUrl');
const discordUrl = z
  .string()
  .trim()
  .max(2048, 'campaign.validation.urlMax')
  .refine((v) => !v || !!safeDiscordUrl(v), 'campaign.validation.discordUrl');
export const campaignFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'campaign.validation.titleMin')
    .max(100, 'campaign.validation.titleMax'),
  description: z
    .string()
    .trim()
    .min(20, 'campaign.validation.descriptionMin')
    .max(20000, 'campaign.validation.descriptionMax'),
  type: z.enum(campaignTypes),
  system: z
    .string()
    .trim()
    .min(1, 'campaign.validation.selectSystem')
    .max(80, 'campaign.validation.systemMax'),
  max_players: z
    .number({ error: 'campaign.validation.minPlayers' })
    .int('campaign.validation.integerPlayers')
    .min(1, 'campaign.validation.minPlayers')
    .max(12, 'campaign.validation.maxPlayers'),
  schedule: z.string().trim().max(200, 'campaign.validation.scheduleMax'),
  cover_url: imageUrl,
  discord_url: discordUrl,
  status: z.enum(campaignStatuses),
});
export type CampaignFormValues = z.infer<typeof campaignFormSchema>;
export const profileFormSchema = z.object({
  username: z.string().trim().min(3, 'auth.usernameMin').max(20, 'auth.usernameMax'),
  bio: z.string().trim().max(300, 'campaign.validation.bioMax'),
  avatar_url: imageUrl,
});
export type ProfileFormValues = z.infer<typeof profileFormSchema>;
export const loginSchema = z.object({
  email: z.string().trim().email('auth.invalidEmail'),
  password: z.string().min(1, 'auth.passwordRequired'),
});
export const registerSchema = loginSchema
  .extend({
    password: z.string().min(8, 'auth.passwordMin'),
    username: profileFormSchema.shape.username,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'auth.passwordsDoNotMatch',
    path: ['confirmPassword'],
  });
export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z
    .string()
    .trim()
    .min(1, 'campaign.validation.reviewRequired')
    .max(2000, 'campaign.validation.reviewMax'),
});
export const profileSchema: z.ZodType<Profile> = z.object({
  id: z.string(),
  username: z.string(),
  avatar_url: z.string().nullable(),
  bio: z.string().nullable(),
  created_at: z.string(),
});
export const campaignSchema: z.ZodType<Campaign> = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.enum(campaignTypes),
  system: z.string(),
  max_players: z.number().int(),
  dm_id: z.string(),
  status: z.enum(campaignStatuses),
  cover_url: z.string().nullable(),
  discord_url: z.string().nullable().optional().default(null),
  schedule: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  dm: profileSchema
    .nullable()
    .optional()
    .transform((v) => v ?? undefined),
  avg_rating: z.coerce.number().optional(),
  review_count: z.coerce.number().optional(),
  player_count: z.coerce.number().optional(),
});
export const participantSchema: z.ZodType<Participant> = z.object({
  user_id: z.string(),
  campaign_id: z.string(),
  status: z.enum(['pending', 'accepted', 'rejected']),
  created_at: z.string(),
  profile: profileSchema
    .nullable()
    .optional()
    .transform((v) => v ?? undefined),
  campaign: campaignSchema
    .nullable()
    .optional()
    .transform((v) => v ?? undefined),
});
export const reviewRowSchema: z.ZodType<Review> = z.object({
  id: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string(),
  author_id: z.string(),
  campaign_id: z.string(),
  created_at: z.string(),
  author: profileSchema
    .nullable()
    .optional()
    .transform((v) => v ?? undefined),
});
export const PAGE_SIZE = 12;
export const isCampaignId = (id: string) => z.uuid().safeParse(id).success;
export function readFilters(params: URLSearchParams): CampaignFilters {
  const type = z.enum(campaignTypes).safeParse(params.get('type'));
  const status = z.enum(campaignStatuses).safeParse(params.get('status'));
  return {
    search: (params.get('q') ?? '').slice(0, 100),
    type: type.success ? type.data : 'all',
    status: status.success ? status.data : 'all',
    system: params.get('system')?.slice(0, 80) || 'all',
    sortBy: params.get('sort') === 'rating' ? 'rating' : 'date',
    available: params.get('seats') === '1',
    page: Math.max(1, Math.min(10000, Number.parseInt(params.get('page') ?? '1', 10) || 1)),
  };
}
export function writeFilters(filters: CampaignFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search) params.set('q', filters.search);
  if (filters.type && filters.type !== 'all') params.set('type', filters.type);
  if (filters.system && filters.system !== 'all') params.set('system', filters.system);
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.sortBy === 'rating') params.set('sort', 'rating');
  if (filters.available) params.set('seats', '1');
  if ((filters.page ?? 1) > 1) params.set('page', String(filters.page));
  return params;
}
export type JoinState =
  'signin' | 'dm' | 'accepted' | 'pending' | 'rejected' | 'closed' | 'full' | 'available';
export function getJoinState(
  campaign: Campaign,
  userId: string | undefined,
  participation: Participant | null | undefined,
): JoinState {
  if (userId === campaign.dm_id) return 'dm';
  if (participation) return participation.status;
  if (campaign.status !== 'open') return 'closed';
  if ((campaign.player_count ?? 0) >= campaign.max_players) return 'full';
  return userId ? 'available' : 'signin';
}
