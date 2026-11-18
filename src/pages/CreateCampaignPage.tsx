import { useTranslation } from 'react-i18next';
import { CampaignForm } from '@/components/campaigns/CampaignForm';
export function CreateCampaignPage() {
  const { t } = useTranslation();
  return (
    <div className="page-shell page-content max-w-4xl animate-fade-in">
      <p className="eyebrow mb-5">{t('home.dmEyebrow')}</p>
      <h1 className="form-title">{t('campaign.createTitle')}</h1>
      <p className="form-intro">{t('campaign.createDescription')}</p>
      <div className="surface">
        <CampaignForm />
      </div>
    </div>
  );
}
