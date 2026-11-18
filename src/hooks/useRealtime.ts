import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from './auth-context';

export function useRealtime() {
  const client = useQueryClient();
  const { user } = useAuth();
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const connection = supabase;
    if (!connection) return;
    const changed = new Map<string, Set<string>>();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const channel = connection.channel(`dndex:${user?.id ?? 'visitor'}`);
    const flush = () => {
      const allIds = new Set([...changed.values()].flatMap((ids) => [...ids]));
      const matches = (id: unknown) => allIds.has('') || allIds.has(String(id));
      // Invalidate each family once per burst, even when several campaigns change.
      void client.invalidateQueries({
        queryKey: queryKeys.campaigns.all,
        predicate: (query) => query.queryKey[1] !== 'detail' || matches(query.queryKey[2]),
      });
      if (changed.has('campaign_activity')) {
        void client.invalidateQueries({
          queryKey: queryKeys.participants.all,
          predicate: (query) => {
            if (query.queryKey[1] === 'campaign') return matches(query.queryKey[2]);
            if (query.queryKey[1] === 'own') return matches(query.queryKey[3]);
            return true;
          },
        });
      } else if (changed.has('campaigns')) {
        void client.invalidateQueries({ queryKey: ['participants', 'player'] });
      }
      const reviewIds = changed.get('reviews');
      if (reviewIds)
        void client.invalidateQueries({
          queryKey: ['reviews'],
          predicate: (query) => reviewIds.has('') || reviewIds.has(String(query.queryKey[1])),
        });
      if (changed.has('campaigns') || changed.has('campaign_activity'))
        void client.invalidateQueries({
          queryKey: ['private', 'campaign'],
          predicate: (query) => matches(query.queryKey[2]),
        });
      changed.clear();
      timer = undefined;
    };
    // Participant row keys are private; only the aggregate signal is published.
    for (const table of ['campaign_activity', 'campaigns', 'reviews']) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        const row = 'campaign_id' in payload.new ? payload.new : payload.old;
        const id =
          table === 'campaigns'
            ? 'id' in payload.new
              ? String(payload.new.id)
              : 'id' in payload.old
                ? String(payload.old.id)
                : ''
            : 'campaign_id' in row
              ? String(row.campaign_id)
              : '';
        if (!changed.has(table)) changed.set(table, new Set());
        changed.get(table)!.add(id);
        if (!timer) timer = setTimeout(flush, 150);
      });
    }
    let active = true;
    channel.subscribe((status) => {
      if (active)
        setOffline(status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED');
    });
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      void connection.removeChannel(channel);
    };
  }, [client, user?.id]);
  return offline;
}
