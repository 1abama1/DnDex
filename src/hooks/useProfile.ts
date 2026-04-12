import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Profile } from '@/types/database';

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user, fetchProfile } = useAuth();

  return useMutation({
    mutationFn: async ({
      username,
      bio,
      avatar_url,
    }: {
      username?: string;
      bio?: string | null;
      avatar_url?: string | null;
    }) => {
      if (!user) throw new Error('Must be logged in');

      const updates: Partial<Profile> = {};
      if (username !== undefined) updates.username = username;
      if (bio !== undefined) updates.bio = bio;
      if (avatar_url !== undefined) updates.avatar_url = avatar_url;

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    },
    onSuccess: () => {
      if (user) fetchProfile(user);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
