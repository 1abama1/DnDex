import { useNavigate } from 'react-router-dom';
import { ArrowRight, Compass, Users, Swords, Feather, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/auth-context';
import { CampaignGrid } from '@/components/campaigns/CampaignGrid';
import { AdventureArt } from '@/components/campaigns/CampaignCover';
import { Button } from '@/components/ui/Button';
import { buttonStyles } from '@/components/ui/button-styles';
export function HomePage() {
  const { t } = useTranslation();
  const { user, openAuth, loading } = useAuth();
  const navigate = useNavigate();
  const create = () => (user ? navigate('/create') : openAuth('/create'));
  const steps = [
    { icon: Compass, title: 'step1Title', text: 'step1Description' },
    { icon: Users, title: 'step2Title', text: 'step2Description' },
    { icon: Swords, title: 'step3Title', text: 'step3Description' },
  ];
  return (
    <div className="page-shell">
      <section className="hero">
        <div className="hero-copy animate-fade-in">
          <p className="eyebrow">{t('home.eyebrow')}</p>
          <h1 className="hero-title">
            {t('home.heroTitle')}
            <em>{t('home.heroTitleHighlight')}</em>
          </h1>
          <p className="hero-description">{t('home.heroDescription')}</p>
          <div className="hero-actions">
            <a className={buttonStyles('primary', 'lg')} href="#catalog">
              {t('common.browseCampaigns')}
              <ArrowRight size={16} aria-hidden="true" />
            </a>
            <Button
              variant="outline"
              size="lg"
              icon={<Feather size={15} />}
              onClick={create}
              disabled={loading}
            >
              {t('home.create')}
            </Button>
          </div>
        </div>
        <div className="hero-art" role="img" aria-label={t('home.artwork')}>
          <AdventureArt hero />
          <span className="hero-mark" aria-hidden="true">
            ✧
          </span>
          <p className="hero-art-caption">
            <span>{t('home.artLabel')}</span>
            {t('home.artCaption')}
          </p>
        </div>
      </section>
      <div className="hero-rule">
        {steps.map((step, i) => (
          <div className="hero-rule-item" key={step.title}>
            <step.icon aria-hidden="true" />
            <span aria-hidden="true">0{i + 1}</span>
            <span>{t(`home.${step.title}`)}</span>
          </div>
        ))}
      </div>
      <section id="catalog" className="catalog-section" aria-labelledby="catalog-title">
        <div className="section-topline">
          <div>
            <p className="eyebrow">{t('home.catalogEyebrow')}</p>
            <h2 className="section-heading" id="catalog-title">
              {t('home.availableCampaigns')}
            </h2>
            <p className="section-description">{t('home.catalogDescription')}</p>
          </div>
        </div>
        <CampaignGrid />
      </section>
      <section className="how-section" aria-labelledby="how-title">
        <p className="eyebrow">{t('home.howEyebrow')}</p>
        <h2 id="how-title" className="section-heading">
          {t('home.howTitle')}
        </h2>
        <div className="how-grid">
          {steps.map((step, i) => (
            <article className="how-step" key={step.title}>
              <div className="step-number" aria-hidden="true">
                0{i + 1}
                <step.icon />
              </div>
              <h3>{t(`home.${step.title}`)}</h3>
              <p>{t(`home.${step.text}`)}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="dm-callout">
        <div>
          <p className="eyebrow">{t('home.dmEyebrow')}</p>
          <h2>{t('home.dmTitle')}</h2>
          <p>{t('home.dmDescription')}</p>
        </div>
        <Button
          variant="outline"
          size="lg"
          icon={<Sparkles size={16} />}
          onClick={create}
          disabled={loading}
        >
          {t('common.hostGame')}
        </Button>
      </section>
    </div>
  );
}
