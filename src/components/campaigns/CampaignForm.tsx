import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCreateCampaign, useUpdateCampaign } from '@/hooks/useCampaigns';
import { SYSTEMS } from '@/lib/config';
import { Sparkles, Save } from 'lucide-react';
import type { Campaign } from '@/types/database';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';

const schema = z.object({
  title: z.string().min(3, 'campaign.validation.titleMin').max(100, 'campaign.validation.titleMax'),
  description: z.string().min(20, 'campaign.validation.descriptionMin'),
  type: z.enum(['campaign', 'one_shot']),
  system: z.string().min(1, 'campaign.validation.selectSystem'),
  max_players: z.number().int().min(1, 'campaign.validation.minPlayers').max(12, 'campaign.validation.maxPlayers'),
  schedule: z.string().optional(),
  discord_url: z.string().url('campaign.validation.invalidUrl').optional().or(z.literal('')),
  status: z.enum(['open', 'in_progress', 'completed', 'cancelled']).optional(),
});

type FormData = z.infer<typeof schema>;

interface CampaignFormProps {
  campaign?: Campaign;
}

export function CampaignForm({ campaign }: CampaignFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const isEditing = !!campaign;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: campaign
      ? {
          title: campaign.title,
          description: campaign.description,
          type: campaign.type,
          system: campaign.system,
          max_players: campaign.max_players,
          schedule: campaign.schedule ?? '',
          discord_url: campaign.discord_url ?? '',
          status: campaign.status,
        }
      : {
          type: 'campaign',
          system: 'D&D 5e',
          max_players: 4,
        },
  });

  const onSubmit = async (data: Record<string, unknown>) => {
    const typed = data as FormData;
    try {
      if (isEditing && campaign) {
        await updateCampaign.mutateAsync({
          id: campaign.id,
          title: typed.title,
          description: typed.description,
          type: typed.type,
          system: typed.system,
          max_players: typed.max_players,
          discord_url: typed.discord_url || undefined,
          schedule: typed.schedule || undefined,
          status: typed.status,
        });
        navigate(`/campaign/${campaign.id}`);
      } else {
        const created = await createCampaign.mutateAsync({
          title: typed.title,
          description: typed.description,
          type: typed.type,
          system: typed.system,
          max_players: typed.max_players,
          discord_url: typed.discord_url || undefined,
          schedule: typed.schedule || undefined,
        });
        navigate(`/campaign/${created.id}`);
      }
    } catch (err) {
      console.error(`Failed to ${isEditing ? 'update' : 'create'} campaign:`, err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Input
        label={t('campaign.fields.title')}
        placeholder={t('campaign.placeholders.title')}
        error={errors.title?.message ? t(errors.title.message) : undefined}
        {...register('title')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label={t('campaign.fields.gameType')}
          options={[
            { value: 'campaign', label: `⚔️ ${t('campaign.type.campaign')}` },
            { value: 'one_shot', label: `🎯 ${t('campaign.type.one_shot')}` },
          ]}
          error={errors.type?.message ? t(errors.type.message) : undefined}
          {...register('type')}
        />
        <Select
          label={t('campaign.fields.system')}
          options={SYSTEMS.map((s) => ({ value: s, label: s }))}
          error={errors.system?.message ? t(errors.system.message) : undefined}
          {...register('system')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label={t('campaign.fields.maxPlayers')}
          type="number"
          min={1}
          max={12}
          error={errors.max_players?.message ? t(errors.max_players.message) : undefined}
          {...register('max_players', { valueAsNumber: true })}
        />
        <Input
          label={t('campaign.fields.schedule')}
          placeholder={t('campaign.placeholders.schedule')}
          error={errors.schedule?.message ? t(errors.schedule.message) : undefined}
          {...register('schedule')}
        />
      </div>

      <Input
        label={t('campaign.discordServer')}
        placeholder={t('campaign.placeholders.discord')}
        error={errors.discord_url?.message ? t(errors.discord_url.message) : undefined}
        {...register('discord_url')}
      />

      {isEditing && (
        <Select
          label={t('campaign.fields.gameStatus')}
          options={[
            { value: 'open', label: `🟢 ${t('campaign.status.open')}` },
            { value: 'in_progress', label: `🔶 ${t('campaign.status.open')}` }, // Assuming open as placeholder
            { value: 'completed', label: `✅ ${t('campaign.status.closed')}` },
            { value: 'cancelled', label: `🔴 ${t('campaign.status.closed')}` },
          ]}
          error={errors.status?.message ? t(errors.status.message) : undefined}
          {...register('status')}
        />
      )}

      <Textarea
        label={t('campaign.fields.description')}
        placeholder={t('campaign.placeholders.description')}
        className="min-h-[240px]"
        error={errors.description?.message ? t(errors.description.message) : undefined}
        {...register('description')}
      />

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          loading={isSubmitting}
          disabled={isEditing && !isDirty}
          icon={isEditing ? <Save size={16} /> : <Sparkles size={16} />}
          size="lg"
        >
          {isEditing ? t('campaign.updateButton') : t('campaign.createButton')}
        </Button>
        <Button type="button" variant="ghost" size="lg" onClick={() => navigate(-1)}>
          {t('common.actions.cancel')}
        </Button>
      </div>
    </form>
  );
}
