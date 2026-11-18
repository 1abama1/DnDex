import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/auth-context';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { ErrorState, LoadingIndicator } from '@/components/ui/Feedback';
export function ProfilePage() {
  const { t } = useTranslation();
  const { profile, profileLoading, profileError, retryProfile } = useAuth();
  if (profileLoading) return <LoadingIndicator />;
  if (profileError || !profile)
    return (
      <div className="page-shell page-content">
        <ErrorState error={profileError} onRetry={retryProfile} />
      </div>
    );
  return (
    <div className="page-shell page-content max-w-3xl animate-fade-in">
      <p className="eyebrow mb-5">{t('home.artLabel')}</p>
      <h1 className="form-title">{t('profile.editTitle')}</h1>
      <p className="form-intro">{t('profile.editDescription')}</p>
      <div className="surface">
        <ProfileForm key={profile.id} profile={profile} />
      </div>
    </div>
  );
}
