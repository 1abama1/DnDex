import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useUpdateProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';

const schema = z.object({
  username: z.string().min(3, 'auth.usernameMin').max(20, 'auth.usernameMax'),
  bio: z.string().max(300, 'campaign.validation.bioMax').optional(), // Adding bioMax to translations as well
  avatar_url: z.string().url('campaign.validation.invalidUrl').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

export function ProfileForm() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const updateProfile = useUpdateProfile();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      username: profile?.username ?? '',
      bio: profile?.bio ?? '',
      avatar_url: profile?.avatar_url ?? '',
    },
  });

  const onSubmit = async (data: Record<string, unknown>) => {
    const typed = data as FormData;
    await updateProfile.mutateAsync({
      username: typed.username,
      bio: typed.bio || null,
      avatar_url: typed.avatar_url || null,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Avatar
          src={profile?.avatar_url}
          username={profile?.username ?? user?.email ?? 'User'}
          size="lg"
        />
        <div>
          <div className="text-lg font-bold text-text-primary">{profile?.username}</div>
          <div className="text-sm text-text-muted">{user?.email}</div>
        </div>
      </div>

      <Input
        label={t('auth.username')}
        placeholder="Archmage_Vex"
        error={errors.username?.message ? t(errors.username.message) : undefined}
        {...register('username')}
      />

      <Input
        label={t('profile.avatarUrl')}
        placeholder="https://example.com/avatar.png"
        error={errors.avatar_url?.message ? t(errors.avatar_url.message) : undefined}
        {...register('avatar_url')}
      />

      <Textarea
        label={t('profile.bio')}
        placeholder={t('profile.bioPlaceholder')}
        className="min-h-[100px]"
        error={errors.bio?.message ? t(errors.bio.message) : undefined}
        {...register('bio')}
      />

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          loading={isSubmitting}
          disabled={!isDirty}
          icon={<User size={16} />}
          size="lg"
        >
          {t('common.actions.save')}
        </Button>
      </div>
    </form>
  );
}
