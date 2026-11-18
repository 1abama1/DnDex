import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useDebounce } from './useDebounce';
afterEach(() => vi.useRealTimers());
it('waits for typing to settle and cancels stale timers', () => {
  vi.useFakeTimers();
  const { result, rerender, unmount } = renderHook(({ search }) => useDebounce(search, 300), {
    initialProps: { search: '' },
  });
  rerender({ search: 'moon' });
  act(() => vi.advanceTimersByTime(200));
  expect(result.current).toBe('');
  rerender({ search: 'moonlight' });
  act(() => vi.advanceTimersByTime(299));
  expect(result.current).toBe('');
  act(() => vi.advanceTimersByTime(1));
  expect(result.current).toBe('moonlight');
  rerender({ search: 'new' });
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
