import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Brand } from './Brand';
export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="site-footer">
      <div className="page-shell footer-inner">
        <Brand compact />
        <p>
          {t('footer.tagline')}
          <br />
          {t('footer.note')}
        </p>
        <a
          className="footer-link"
          href="https://github.com/1abama1/DnDex"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('footer.source')}
        >
          GitHub <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </div>
    </footer>
  );
}
