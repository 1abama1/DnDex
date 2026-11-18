import { useTranslation } from 'react-i18next';
import { LinkButton } from '@/components/ui/LinkButton';
export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="page-shell page-content text-center">
      <p className="text-gold mb-4">404</p>
      <h1 className="form-title mx-auto">{t('campaign.notFound')}</h1>
      <LinkButton to="/" variant="outline">
        {t('common.backToCatalog')}
      </LinkButton>
    </div>
  );
}
