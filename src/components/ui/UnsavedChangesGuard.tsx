import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { Button } from './Button';
export function UnsavedChangesGuard({ dirty }: { dirty: boolean }) {
  const { t } = useTranslation();
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
  );
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
  return (
    <Modal
      isOpen={blocker.state === 'blocked'}
      onClose={() => blocker.reset?.()}
      title={t('campaign.unsaved')}
    >
      <div className="flex flex-wrap gap-3 justify-end">
        <Button variant="outline" onClick={() => blocker.reset?.()}>
          {t('common.actions.cancel')}
        </Button>
        <Button onClick={() => blocker.proceed?.()}>{t('common.leavePage')}</Button>
      </div>
    </Modal>
  );
}
