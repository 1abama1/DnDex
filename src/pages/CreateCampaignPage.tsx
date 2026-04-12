import { CampaignForm } from '@/components/campaigns/CampaignForm';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';

export function CreateCampaignPage() {
  const { t } = useTranslation();
  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-16 animate-fade-in text-left">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex p-3 rounded-2xl bg-gold/10 mb-5">
          <Sparkles size={28} className="text-gold" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-3">
          {t('campaign.createTitle')}
        </h1>
        <p className="text-white/60 text-lg">
          {t('campaign.createDescription')}
        </p>
      </div>

      <div className="glass-card-static p-8">
        <CampaignForm />
      </div>
    </div>
  );
}
