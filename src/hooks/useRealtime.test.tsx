import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { queryKeys } from '@/lib/queryKeys';
const mock = vi.hoisted(() => {
  type Payload = { new: Record<string, unknown>; old: Record<string, unknown> };
  const handlers = new Map<string, (payload: Payload) => void>();
  const channel = {
    on: vi.fn((_event: string, filter: { table: string }, handler: (payload: Payload) => void) => {
      handlers.set(filter.table, handler);
      return channel;
    }),
    subscribe: vi.fn(),
  };
  return { handlers, channel, create: vi.fn(() => channel), remove: vi.fn() };
});
vi.mock('@/lib/supabase', () => ({
  supabase: { channel: mock.create, removeChannel: mock.remove },
}));
vi.mock('./auth-context', () => ({ useAuth: () => ({ user: { id: 'player' } }) }));
import { useRealtime } from './useRealtime';
afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  mock.handlers.clear();
});
it('owns one channel, batches events and removes the subscription and pending timer', () => {
  vi.useFakeTimers();
  const client = new QueryClient();
  const key = queryKeys.participants.campaign('a');
  client.setQueryData(key, []);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { rerender, unmount } = renderHook(() => useRealtime(), { wrapper });
  rerender();
  expect(mock.create).toHaveBeenCalledTimes(1);
  expect(mock.channel.on).toHaveBeenCalledTimes(3);
  act(() => {
    mock.handlers.get('campaign_activity')!({ new: { campaign_id: 'a' }, old: {} });
    mock.handlers.get('campaign_activity')!({ new: { campaign_id: 'a' }, old: {} });
  });
  expect(client.getQueryState(key)?.isInvalidated).toBe(false);
  act(() => vi.advanceTimersByTime(150));
  expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  act(() => mock.handlers.get('campaign_activity')!({ new: { campaign_id: 'a' }, old: {} }));
  unmount();
  expect(mock.remove).toHaveBeenCalledWith(mock.channel);
  client.clear();
  expect(vi.getTimerCount()).toBe(0);
});
it('refreshes reviews when a delete payload has only the review primary key', () => {
  vi.useFakeTimers();
  const client = new QueryClient();
  const key = queryKeys.reviews.campaign('a');
  client.setQueryData(key, []);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { unmount } = renderHook(() => useRealtime(), { wrapper });
  act(() => {
    mock.handlers.get('reviews')!({ new: {}, old: { id: 'review-id' } });
    vi.advanceTimersByTime(150);
  });
  expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  unmount();
  client.clear();
});
