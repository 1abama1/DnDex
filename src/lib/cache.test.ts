import { QueryClient } from '@tanstack/react-query';
import { expect, it } from 'vitest';
import { queryKeys } from './queryKeys';
import { refreshParticipants } from './cache';
it('refreshes detail, DM, player and moderation data after a participation mutation', async () => {
  const client = new QueryClient();
  const keys = [
    queryKeys.campaigns.list({}),
    queryKeys.campaigns.detail('a'),
    queryKeys.campaigns.dm('dm'),
    queryKeys.participants.campaign('a'),
    queryKeys.participants.myParticipation('a', 'player'),
    queryKeys.participants.myParticipations('player'),
    queryKeys.participants.pending(['a']),
    queryKeys.campaigns.private('a', 'player'),
  ];
  keys.forEach((key) => client.setQueryData(key, {}));
  const other = queryKeys.campaigns.detail('unrelated');
  client.setQueryData(other, {});
  await refreshParticipants(client, 'a');
  keys.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
  expect(client.getQueryState(other)?.isInvalidated).toBe(false);
  client.clear();
});
