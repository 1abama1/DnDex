import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCampaign, useCampaignDiscord } from '@/hooks/useCampaigns';
import { useAuth } from '@/hooks/auth-context';
import { isCampaignId } from '@/lib/domain';
import { CampaignForm } from '@/components/campaigns/CampaignForm';
import { Alert, ErrorState, LoadingIndicator } from '@/components/ui/Feedback';
import { LinkButton } from '@/components/ui/LinkButton';
import { NotFoundPage } from './NotFoundPage';
export function EditCampaignPage() {
  const id = useParams().id ?? '';
  const { t } = useTranslation();
  const { user } = useAuth();
  const query = useCampaign(id);
  const owned = !!user && user.id === query.data?.dm_id;
  const discord = useCampaignDiscord(id, owned);
  if (!isCampaignId(id)) return <NotFoundPage />;
  if (query.isPending) return <LoadingIndicator />;
  if (query.isError)
    return (
      <div className="page-shell page-content">
        <ErrorState
          error={query.error}
          onRetry={() => {
            void query.refetch();
          }}
        />
      </div>
    );
  if (!query.data) return <NotFoundPage />;
  if (!owned)
    return (
      <div className="page-shell page-content">
        <Alert>{t('errors.unauthorized')}</Alert>
        <LinkButton to={`/campaign/${id}`} variant="outline" className="mt-6">
          {t('common.back')}
        </LinkButton>
      </div>
    );
  if (discord.isPending) return <LoadingIndicator />;
  if (discord.isError)
    return (
      <div className="page-shell page-content">
        <ErrorState
          error={discord.error}
          onRetry={() => {
            void discord.refetch();
          }}
        />
      </div>
    );
  return (
    <div className="page-shell page-content max-w-4xl animate-fade-in">
      <p className="eyebrow mb-5">{t('campaign.dossier')}</p>
      <h1 className="form-title">{t('campaign.editTitle')}</h1>
      <p className="form-intro">{query.data.title}</p>
      <div className="surface">
        <CampaignForm campaign={query.data} discordUrl={discord.data} />
      </div>
    </div>
  );
}
