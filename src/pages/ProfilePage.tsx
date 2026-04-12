import { User } from 'lucide-react';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { useTranslation } from 'react-i18next';

export function ProfilePage() {
  const { t } = useTranslation();
  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-16 animate-fade-in text-left">
      <div className="text-center mb-10">
        <div className="inline-flex p-3 rounded-2xl bg-gold/10 mb-4">
          <User size={28} className="text-gold" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-3">
          {t('profile.editTitle')}
        </h1>
        <p className="text-white/60 text-lg">
          {t('profile.editDescription')}
        </p>
      </div>

      <div className="glass-card-static p-8 sm:p-10">
        <ProfileForm />
      </div>
    </div>
  );
}
