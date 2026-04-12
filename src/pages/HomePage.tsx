import { Link } from 'react-router-dom';
import { CampaignGrid } from '@/components/campaigns/CampaignGrid';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

export function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="w-full flex flex-col items-center pb-24 text-text-primary">
      <div className="w-full max-w-[1200px] mx-auto px-6">

        <section className="w-full pt-20 pb-16 flex flex-col items-center text-center">
          <h1 className="text-[48px] font-extrabold tracking-tight mb-6 leading-[1.2] max-w-[800px]">
            {t('home.heroTitle')}<span className="text-gold">{t('home.heroTitleHighlight')}</span>
          </h1>

          <p className="text-[16px] text-text-secondary mb-8 leading-[1.6] max-w-[600px]">
            {t('home.heroDescription')}
          </p>

          <div className="flex items-center justify-center gap-4 w-full sm:w-auto">
            <a href="#catalog">
              <Button size="lg" className="px-8 py-3 text-[16px] font-bold">
                  {t('common.browseCampaigns')}
              </Button>
            </a>
            {!user && (
              <Link to="/create">
                <Button variant="outline" size="lg" className="px-8 py-3 text-[16px] font-bold bg-transparent border-white/20 text-white hover:bg-white/5">
                  {t('common.hostGame')}
                </Button>
              </Link>
            )}
          </div>
        </section>

        <section id="catalog" className="mt-16 pt-8 border-t border-border text-left">
          <h2 className="text-3xl font-semibold text-text-primary mb-4">
            {t('home.availableCampaigns')}
          </h2>
          <CampaignGrid />
        </section>

      </div>
    </div>
  );
}
