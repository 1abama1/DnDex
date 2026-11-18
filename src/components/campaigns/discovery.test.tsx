import { act, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { campaign } from '@/test/fixtures';
vi.mock('@/lib/supabase', () => ({ isBackendConfigured: true }));
vi.mock('@/services/campaigns', () => ({ listCampaigns: vi.fn() }));
import { listCampaigns } from '@/services/campaigns';
import { CampaignGrid } from './CampaignGrid';
const clients: QueryClient[] = [];
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <CampaignGrid />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}
beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  clients.forEach((client) => client.clear());
  clients.length = 0;
  vi.useRealTimers();
});
it('shows a genuine empty result with a working creation link', async () => {
  vi.mocked(listCampaigns).mockResolvedValue({ campaigns: [], count: 0 });
  mount();
  expect(await screen.findByRole('heading', { name: 'The quest board is quiet' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'Create an adventure' })).toHaveAttribute(
    'href',
    '/create',
  );
});
it('distinguishes a failed query from empty results and recovers through retry', async () => {
  vi.mocked(listCampaigns).mockRejectedValueOnce(new Error('network unavailable'));
  mount();
  expect(await screen.findByRole('alert')).toHaveTextContent('The connection was interrupted');
  expect(screen.queryByText('The quest board is quiet')).not.toBeInTheDocument();
  vi.mocked(listCampaigns).mockResolvedValueOnce({ campaigns: [campaign], count: 1 });
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(
    await screen.findByRole('link', { name: `${campaign.title} — View adventure` }),
  ).toBeVisible();
});
it('makes only one new request after a multiword search settles', async () => {
  vi.mocked(listCampaigns).mockResolvedValue({ campaigns: [], count: 0 });
  mount();
  await screen.findByRole('heading', { name: 'The quest board is quiet' });
  vi.useFakeTimers();
  const input = screen.getByRole('searchbox', { name: 'Search campaign titles' });
  fireEvent.change(input, { target: { value: 'moon ' } });
  await act(async () => {
    vi.advanceTimersByTime(200);
  });
  fireEvent.change(input, { target: { value: 'moon light' } });
  await act(async () => {
    vi.advanceTimersByTime(299);
  });
  expect(listCampaigns).toHaveBeenCalledTimes(1);
  await act(async () => {
    vi.advanceTimersByTime(1);
  });
  expect(listCampaigns).toHaveBeenCalledTimes(2);
  expect(input).toHaveValue('moon light');
  expect(vi.mocked(listCampaigns).mock.calls[1][0]).toMatchObject({
    search: 'moon light',
    page: 1,
  });
});
