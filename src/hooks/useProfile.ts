import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './auth-context';
import { saveProfile } from '@/services/profiles';
import { queryKeys } from '@/lib/queryKeys';
import type { ProfileFormValues } from '@/lib/domain';
export function useUpdateProfile() {
  const client = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (values: ProfileFormValues) => {
      if (!user) throw new Error('errors.permission');
      return saveProfile(user.id, values);
    },
    onSuccess: (data) => {
      client.setQueryData(queryKeys.profile(data.id), data);
      return Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.campaigns.all }),
        client.invalidateQueries({ queryKey: queryKeys.participants.all }),
        client.invalidateQueries({ queryKey: ['reviews'] }),
      ]);
    },
  });
}
