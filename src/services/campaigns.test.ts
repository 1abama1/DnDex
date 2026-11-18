import { beforeEach, describe, expect, it, vi } from 'vitest';
import { campaign, formValues } from '@/test/fixtures';
const mock = vi.hoisted(() => {
  const result: { data: unknown; error: unknown; count?: number } = {
    data: [],
    error: null,
    count: 0,
  };
  const chain: Record<string, unknown> = {};
  for (const name of [
    'select',
    'eq',
    'gt',
    'order',
    'range',
    'ilike',
    'abortSignal',
    'insert',
    'update',
    'delete',
    'single',
    'maybeSingle',
  ])
    chain[name] = vi.fn(() => chain);
  chain.then = (resolve: (value: typeof result) => void) => Promise.resolve(resolve(result));
  return { result, chain, from: vi.fn(() => chain) };
});
vi.mock('@/lib/supabase', () => ({ backend: () => ({ from: mock.from }) }));
import { getCampaign, listCampaigns, removeCampaign, saveCampaign } from './campaigns';
beforeEach(() => {
  vi.clearAllMocks();
  mock.result.data = [];
  mock.result.error = null;
  mock.result.count = 0;
});
describe('campaign service boundary', () => {
  it('queries literal search, all filters, bounded pages and stable sort without private fields', async () => {
    await listCampaigns({
      search: 'moon_100%',
      type: 'one_shot',
      system: 'D&D 5e',
      status: 'open',
      available: true,
      sortBy: 'rating',
      page: 2,
    });
    expect(mock.chain.select).toHaveBeenCalledWith(expect.not.stringContaining('discord_url'), {
      count: 'exact',
    });
    expect(mock.chain.range).toHaveBeenCalledWith(12, 23);
    expect(mock.chain.ilike).toHaveBeenCalledWith('title', '%moon\\_100\\%%');
    expect(mock.chain.eq).toHaveBeenCalledWith('type', 'one_shot');
    expect(mock.chain.gt).toHaveBeenCalledWith('available_seats', 0);
    expect(mock.chain.order).toHaveBeenCalledWith('avg_rating', { ascending: false });
  });
  it('distinguishes missing data, failed requests and malformed responses', async () => {
    mock.result.data = null;
    expect(await getCampaign(campaign.id)).toBeNull();
    const error = { code: '42501', message: 'forbidden' };
    mock.result.error = error;
    await expect(getCampaign(campaign.id)).rejects.toBe(error);
    mock.result.error = null;
    mock.result.data = { id: 'bad' };
    await expect(getCampaign(campaign.id)).rejects.toThrow();
  });
  it('validates writes, clears empty optional values, and scopes updates to the owner', async () => {
    mock.result.data = campaign;
    await saveCampaign(formValues, 'owner', campaign.id);
    expect(mock.chain.eq).toHaveBeenCalledWith('dm_id', 'owner');
    expect(mock.chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ discord_url: null, schedule: null, cover_url: null }),
    );
    expect(mock.chain.select).toHaveBeenCalledWith(expect.not.stringContaining('discord_url'));
    await expect(saveCampaign({ ...formValues, title: '' }, 'owner')).rejects.toThrow();
  });
  it('never reports an unauthorized or missing deletion as success', async () => {
    mock.result.data = null;
    await expect(removeCampaign(campaign.id, 'owner')).rejects.toThrow('errors.permission');
  });
});
