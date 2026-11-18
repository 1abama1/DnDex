import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/auth-context';
import { Button } from '@/components/ui/Button';
import { LoadingIndicator } from '@/components/ui/Feedback';
export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading, openAuth } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  if (loading) return <LoadingIndicator />;
  if (!user)
    return (
      <div className="page-shell page-content">
        <div className="surface max-w-xl mx-auto text-center">
          <h1 className="form-title">{t('auth.required')}</h1>
          <p className="form-intro">{t('auth.requiredDescription')}</p>
          <Button onClick={() => openAuth(location.pathname + location.search)}>
            {t('common.signIn')}
          </Button>
        </div>
      </div>
    );
  return children;
}
