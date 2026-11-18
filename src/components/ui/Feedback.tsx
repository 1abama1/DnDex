import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, LoaderCircle, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { errorKey } from '@/lib/errors';
import { isBackendConfigured } from '@/lib/supabase';
import { Button } from './Button';
export function Alert({
  children,
  variant = 'error',
}: {
  children: ReactNode;
  variant?: 'error' | 'success' | 'info';
}) {
  return (
    <div role={variant === 'error' ? 'alert' : 'status'} className={`alert alert--${variant}`}>
      {variant === 'success' ? (
        <CheckCircle2 size={18} aria-hidden="true" />
      ) : (
        <AlertCircle size={18} aria-hidden="true" />
      )}
      <div>{children}</div>
    </div>
  );
}
export function ErrorState({ error, onRetry }: { error?: unknown; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="error-state">
      <Alert>{t(!isBackendConfigured ? 'errors.configuration' : errorKey(error))}</Alert>
      {onRetry && isBackendConfigured && (
        <Button variant="outline" onClick={onRetry} icon={<RotateCcw size={16} />}>
          {t('common.retry')}
        </Button>
      )}
    </div>
  );
}
export function LoadingIndicator() {
  const { t } = useTranslation();
  return (
    <div className="loading-indicator" role="status">
      <LoaderCircle className="animate-spin" size={24} aria-hidden="true" />
      <span>{t('common.loading')}</span>
    </div>
  );
}
