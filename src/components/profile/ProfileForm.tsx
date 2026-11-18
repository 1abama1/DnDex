import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/auth-context';
import { useUpdateProfile } from '@/hooks/useProfile';
import { profileFormSchema, type ProfileFormValues } from '@/lib/domain';
import { errorKey } from '@/lib/errors';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Feedback';
import { UnsavedChangesGuard } from '@/components/ui/UnsavedChangesGuard';
import type { Profile } from '@/types/database';
export function ProfileForm({ profile }: { profile: Profile }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const update = useUpdateProfile();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: profile.username,
      bio: profile.bio ?? '',
      avatar_url: profile.avatar_url ?? '',
    },
  });
  const submit = async (values: ProfileFormValues) => {
    setError(null);
    try {
      await update.mutateAsync(values);
      reset(values);
    } catch (err) {
      setError(errorKey(err));
    }
  };
  return (
    <>
      <UnsavedChangesGuard dirty={isDirty && !isSubmitting} />
      <form onSubmit={handleSubmit(submit)} className="space-y-6" noValidate>
        <div className="flex items-center gap-4 mb-8">
          <Avatar username={profile.username} src={profile.avatar_url} size="lg" />
          <div>
            <h2 className="text-3xl">{profile.username}</h2>
            <p className="text-text-muted text-xs mt-2 break-all">{user?.email}</p>
          </div>
        </div>
        <Input
          label={t('auth.username')}
          maxLength={20}
          required
          autoComplete="nickname"
          error={errors.username?.message && t(errors.username.message)}
          {...register('username')}
        />
        <Input
          label={t('profile.avatarUrl')}
          type="url"
          hint={t('campaign.validation.invalidUrl')}
          error={errors.avatar_url?.message && t(errors.avatar_url.message)}
          {...register('avatar_url')}
        />
        <Textarea
          label={t('profile.bio')}
          placeholder={t('profile.bioPlaceholder')}
          maxLength={300}
          error={errors.bio?.message && t(errors.bio.message)}
          {...register('bio')}
        />
        {error && <Alert>{t(error)}</Alert>}
        {update.isSuccess && !isDirty && (
          <Alert variant="success">{t('profile.updateSuccess')}</Alert>
        )}
        <div className="form-actions">
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
            {t('common.actions.save')}
          </Button>
        </div>
      </form>
    </>
  );
}
