import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from './Header';
import { Footer } from './Footer';
import { useRealtime } from '@/hooks/useRealtime';
import { useAuth } from '@/hooks/auth-context';
import { Alert, LoadingIndicator } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
export function Layout() {
  const { t, i18n } = useTranslation();
  const { pathname, hash } = useLocation();
  const { sessionError } = useAuth();
  const livePaused = useRealtime();
  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? 'en';
  }, [i18n.resolvedLanguage]);
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);
  return (
    <div className="min-h-screen flex flex-col">
      <a className="skip-link" href="#main">
        {t('common.skip')}
      </a>
      <Header />
      {livePaused && (
        <div className="page-shell mt-4">
          <Alert variant="info">
            {t('feedback.livePaused')}{' '}
            <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
              {t('common.reload')}
            </Button>
          </Alert>
        </div>
      )}
      {!!sessionError && (
        <div className="page-shell mt-4">
          <Alert>{t('errors.session')}</Alert>
        </div>
      )}
      <main id="main" className="flex-1 w-full" tabIndex={-1}>
        <Suspense fallback={<LoadingIndicator />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
