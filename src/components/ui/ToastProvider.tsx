import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { ToastContext } from '@/hooks/toast-context';
import { Alert } from './Feedback';
import { IconButton } from './Button';
export function ToastProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { t } = useTranslation();
  const show = useCallback((key: string) => {
    if (timer.current) clearTimeout(timer.current);
    setNotice(key);
    timer.current = setTimeout(() => setNotice(null), 7000);
  }, []);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <ToastContext.Provider value={show}>
      {children}
      {notice && (
        <div className="toast">
          <Alert variant="success">{t(notice)}</Alert>
          <IconButton label={t('common.close')} onClick={() => setNotice(null)}>
            <X size={16} />
          </IconButton>
        </div>
      )}
    </ToastContext.Provider>
  );
}
