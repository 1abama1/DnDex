import { backend } from '@/lib/supabase';
import { profileSchema, profileFormSchema, type ProfileFormValues } from '@/lib/domain';
export async function getProfile(id: string) {
  const { data, error } = await backend().from('profiles').select('*').eq('id', id).single();
  if (error) throw error;
  return profileSchema.parse(data);
}
export async function saveProfile(id: string, input: ProfileFormValues) {
  const values = profileFormSchema.parse(input);
  const { data, error } = await backend()
    .from('profiles')
    .update({ ...values, bio: values.bio || null, avatar_url: values.avatar_url || null })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return profileSchema.parse(data);
}
