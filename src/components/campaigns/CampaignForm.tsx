import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Feather } from 'lucide-react';
import { useCreateCampaign, useUpdateCampaign } from '@/hooks/useCampaigns';
import { useToast } from '@/hooks/toast-context';
import { campaignFormSchema, campaignStatuses, type CampaignFormValues } from '@/lib/domain';
import { errorKey } from '@/lib/errors';
import { SYSTEMS } from '@/lib/config';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { Tabs } from '@/components/ui/Tabs';
import { Markdown } from '@/components/ui/Markdown';
import { UnsavedChangesGuard } from '@/components/ui/UnsavedChangesGuard';
import type { Campaign } from '@/types/database';
export function CampaignForm({
  campaign,
  discordUrl,
}: {
  campaign?: Campaign;
  discordUrl?: string | null;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const create = useCreateCampaign();
  const update = useUpdateCampaign();
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      title: campaign?.title ?? '',
      description: campaign?.description ?? '',
      type: campaign?.type ?? 'campaign',
      system: campaign?.system ?? 'D&D 5e',
      max_players: campaign?.max_players ?? 4,
      schedule: campaign?.schedule ?? '',
      cover_url: campaign?.cover_url ?? '',
      discord_url: discordUrl ?? '',
      status: campaign?.status ?? 'open',
    },
  });
  const description = useWatch({ control, name: 'description' });
  const title = useWatch({ control, name: 'title' });
  const submit = async (values: CampaignFormValues) => {
    setError(null);
    try {
      const result = campaign
        ? await update.mutateAsync({ ...values, id: campaign.id })
        : await create.mutateAsync(values);
      reset(values);
      toast(campaign ? 'feedback.updated' : 'feedback.created');
      navigate(`/campaign/${result.id}`);
    } catch (err) {
      setError(errorKey(err));
    }
  };
  const systems: { value: string; label: string }[] = SYSTEMS.map((s) => ({
    value: s,
    label: s === 'Other' ? t('discovery.other') : s,
  }));
  if (campaign && !SYSTEMS.some((s) => s === campaign.system))
    systems.unshift({ value: campaign.system, label: campaign.system });
  const statuses = campaignStatuses.filter(
    (s) =>
      !campaign ||
      !['completed', 'cancelled'].includes(campaign.status) ||
      s === campaign.status ||
      s === 'open',
  );
  return (
    <>
      <UnsavedChangesGuard
        dirty={isDirty && !isSubmitting && !create.isSuccess && !update.isSuccess}
      />
      <form onSubmit={handleSubmit(submit, () => setMode('write'))} noValidate>
        <fieldset className="form-section" disabled={isSubmitting}>
          <legend>{t('campaign.sections.basics')}</legend>
          <div className="form-section-content">
            <Input
              label={t('campaign.fields.title')}
              placeholder={t('campaign.placeholders.title')}
              required
              maxLength={100}
              error={errors.title?.message && t(errors.title.message)}
              {...register('title')}
            />
            <p className="character-count">
              {t('campaign.characters', { count: title.length, max: 100 })}
            </p>
            <Input
              label={t('campaign.fields.cover')}
              type="url"
              hint={t('campaign.coverHint')}
              error={errors.cover_url?.message && t(errors.cover_url.message)}
              {...register('cover_url')}
            />
          </div>
        </fieldset>
        <fieldset className="form-section" disabled={isSubmitting}>
          <legend>{t('campaign.sections.settings')}</legend>
          <div className="form-section-content">
            <div className="form-row">
              <Select
                label={t('campaign.fields.gameType')}
                options={[
                  { value: 'campaign', label: t('campaign.type.campaign') },
                  { value: 'one_shot', label: t('campaign.type.one_shot') },
                ]}
                error={errors.type?.message && t(errors.type.message)}
                {...register('type')}
              />
              <Select
                label={t('campaign.fields.system')}
                options={systems}
                error={errors.system?.message && t(errors.system.message)}
                {...register('system')}
              />
            </div>
            <div className="form-row">
              <Input
                label={t('campaign.fields.maxPlayers')}
                type="number"
                min={1}
                max={12}
                required
                error={errors.max_players?.message && t(errors.max_players.message)}
                {...register('max_players', { valueAsNumber: true })}
              />
              {campaign && (
                <Select
                  label={t('campaign.fields.gameStatus')}
                  options={statuses.map((s) => ({ value: s, label: t(`campaign.status.${s}`) }))}
                  error={errors.status?.message && t(errors.status.message)}
                  {...register('status')}
                />
              )}
            </div>
          </div>
        </fieldset>
        <fieldset className="form-section" disabled={isSubmitting}>
          <legend>{t('campaign.sections.communication')}</legend>
          <div className="form-section-content">
            <Input
              label={t('campaign.fields.schedule')}
              placeholder={t('campaign.placeholders.schedule')}
              maxLength={200}
              error={errors.schedule?.message && t(errors.schedule.message)}
              {...register('schedule')}
            />
            <Input
              label={t('campaign.discordServer')}
              type="url"
              placeholder={t('campaign.placeholders.discord')}
              hint={t('campaign.privateField')}
              error={errors.discord_url?.message && t(errors.discord_url.message)}
              {...register('discord_url')}
            />
          </div>
        </fieldset>
        <fieldset className="form-section" disabled={isSubmitting}>
          <legend>{t('campaign.sections.story')}</legend>
          <Tabs<'write' | 'preview'>
            label={t('campaign.fields.description')}
            panelId="description-panel"
            value={mode}
            onChange={setMode}
            tabs={[
              { value: 'write', label: t('campaign.write') },
              { value: 'preview', label: t('campaign.preview') },
            ]}
          />
          <div id="description-panel" role="tabpanel" aria-label={t(`campaign.${mode}`)}>
            {mode === 'write' ? (
              <Textarea
                label={t('campaign.fields.description')}
                hint={t('campaign.markdownHint')}
                placeholder={t('campaign.placeholders.description')}
                className="min-h-64"
                maxLength={20000}
                required
                error={errors.description?.message && t(errors.description.message)}
                {...register('description')}
              />
            ) : (
              <div className="surface min-h-64">
                <Markdown>{description || t('campaign.previewEmpty')}</Markdown>
              </div>
            )}
          </div>
          <p className="character-count">
            {t('campaign.characters', { count: description.length, max: 20000 })}
          </p>
        </fieldset>
        {error && (
          <div className="mb-6">
            <Alert>{t(error)}</Alert>
          </div>
        )}
        <div className="form-actions">
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={!!campaign && !isDirty}
            icon={<Feather size={16} />}
            size="lg"
          >
            {t(campaign ? 'campaign.updateButton' : 'campaign.createButton')}
          </Button>
          <Button
            variant="ghost"
            disabled={isSubmitting}
            onClick={() => navigate(campaign ? `/campaign/${campaign.id}` : '/')}
            size="lg"
          >
            {t('common.actions.cancel')}
          </Button>
        </div>
      </form>
    </>
  );
}
