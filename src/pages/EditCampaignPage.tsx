import { useCampaign } from '@/hooks/useCampaigns';
import { CampaignForm } from '@/components/campaigns/CampaignForm';
import { Pencil } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';

export function EditCampaignPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: campaign, isLoading } = useCampaign(id!);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-text-primary mb-4">{t('campaign.notFound')}</h2>
        <Button variant="outline" onClick={() => navigate('/')}>{t('common.backToCatalog')}</Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-16 animate-fade-in text-left">
      <div className="text-center mb-10">
        <div className="inline-flex p-3 rounded-2xl bg-gold/10 mb-4">
          <Pencil size={28} className="text-gold" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-3">
          {t('campaign.editTitle')}
        </h1>
        <p className="text-white/60 text-lg">
          {campaign.title}
        </p>
      </div>

      <div className="glass-card-static p-8 sm:p-10">
        <CampaignForm campaign={campaign} />
      </div>
    </div>
  );
}
