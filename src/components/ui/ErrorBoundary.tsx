import { Component, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
export function ErrorFallback() {
  const { t } = useTranslation();
  return (
    <div className="page-shell py-24 text-center">
      <h1 className="text-3xl mb-4">{t('errors.crash')}</h1>
      <p className="text-text-secondary mb-6">{t('errors.generic')}</p>
      <Button onClick={() => window.location.reload()}>{t('common.reload')}</Button>
    </div>
  );
}
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <ErrorFallback /> : this.props.children;
  }
}
