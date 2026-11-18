import { describe, expect, it } from 'vitest';
import {
  campaignFormSchema,
  getJoinState,
  loginSchema,
  profileFormSchema,
  readFilters,
  registerSchema,
  reviewSchema,
  safeDiscordUrl,
  safeImageUrl,
  statusMetadata,
  writeFilters,
} from './domain';
import { campaign, formValues, participation } from '@/test/fixtures';
describe('campaign discovery', () => {
  it('preserves spaces while typing a multiword search in the URL', () => {
    expect(readFilters(writeFilters({ search: 'moon ' })).search).toBe('moon ');
    expect(readFilters(writeFilters({ search: 'moon light' })).search).toBe('moon light');
  });
  it('round trips shareable filters and pagination', () => {
    const filters = {
      search: 'Ancient moon',
      system: 'D&D 5e',
      type: 'one_shot',
      status: 'open',
      sortBy: 'rating',
      available: true,
      page: 3,
    } as const;
    expect(readFilters(writeFilters(filters))).toEqual(filters);
  });
  it('normalizes unsupported enum values, invalid pages and defaults', () => {
    expect(readFilters(new URLSearchParams('page=-5&type=bad&status=bad&sort=bad'))).toMatchObject({
      page: 1,
      type: 'all',
      status: 'all',
      sortBy: 'date',
    });
    expect(writeFilters(readFilters(new URLSearchParams())).toString()).toBe('');
    expect(readFilters(new URLSearchParams('page=9999999999')).page).toBe(10000);
  });
});
describe('shared validation and safe links', () => {
  it('trims fields and permits clearing optional information', () =>
    expect(campaignFormSchema.parse({ ...formValues, title: '  Lanterns  ' })).toMatchObject({
      title: 'Lanterns',
      schedule: '',
      discord_url: '',
    }));
  it.each([0, 13, 2.5, Number.NaN])('rejects invalid party size %s', (max_players) =>
    expect(campaignFormSchema.safeParse({ ...formValues, max_players }).success).toBe(false),
  );
  it('rejects short stories and unsupported statuses', () => {
    expect(campaignFormSchema.safeParse({ ...formValues, description: 'tiny' }).success).toBe(
      false,
    );
    expect(campaignFormSchema.safeParse({ ...formValues, status: 'full' }).success).toBe(false);
  });
  it.each([
    'javascript:alert(1)',
    'data:image/svg+xml,bad',
    'http://example.com/a.png',
    'https://user:pass@example.com/a.png',
  ])('rejects unsafe image URL %s', (value) => expect(safeImageUrl(value)).toBeUndefined());
  it('restricts communication URLs to HTTPS Discord hosts', () => {
    expect(safeDiscordUrl('https://discord.gg/party')).toBe('https://discord.gg/party');
    expect(safeDiscordUrl('https://discord.gg.evil.test/party')).toBeUndefined();
    expect(
      campaignFormSchema.safeParse({ ...formValues, discord_url: 'https://evil.test' }).success,
    ).toBe(false);
  });
  it('preserves login compatibility while requiring stronger new passwords', () => {
    expect(loginSchema.safeParse({ email: 'player@example.com', password: 'old123' }).success).toBe(
      true,
    );
    expect(
      registerSchema.safeParse({
        email: 'player@example.com',
        password: 'old123',
        confirmPassword: 'old123',
        username: 'player',
      }).success,
    ).toBe(false);
  });
  it('enforces review and profile boundaries', () => {
    expect(reviewSchema.safeParse({ rating: 6, comment: 'Hello' }).success).toBe(false);
    expect(reviewSchema.safeParse({ rating: 5, comment: '   ' }).success).toBe(false);
    expect(profileFormSchema.safeParse({ username: '   ', bio: '', avatar_url: '' }).success).toBe(
      false,
    );
  });
});
describe('participation presentation', () => {
  it('covers authentication, ownership, closed, full and available states', () => {
    expect(getJoinState(campaign, undefined, null)).toBe('signin');
    expect(getJoinState(campaign, 'dm', null)).toBe('dm');
    expect(getJoinState(campaign, 'player', null)).toBe('available');
    expect(getJoinState({ ...campaign, status: 'completed' }, 'player', null)).toBe('closed');
    expect(getJoinState({ ...campaign, player_count: 4 }, 'player', null)).toBe('full');
  });
  it.each(['pending', 'accepted', 'rejected'] as const)(
    'preserves the actual %s result even after a campaign closes',
    (status) =>
      expect(
        getJoinState({ ...campaign, status: 'completed' }, 'player', { ...participation, status }),
      ).toBe(status),
  );
  it('has distinct labels for all campaign statuses', () =>
    expect(new Set(Object.values(statusMetadata).map((v) => v.key)).size).toBe(4));
});
