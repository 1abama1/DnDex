import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Plus, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/auth-context';
import { useDMCampaigns } from '@/hooks/useCampaigns';
import { usePendingRequests } from '@/hooks/useParticipants';
import { Button, IconButton } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { AuthModal } from '@/components/auth/AuthModal';
import { Brand } from './Brand';
import { Alert } from '@/components/ui/Feedback';
import { errorKey } from '@/lib/errors';
export function Header() {
  const { t, i18n } = useTranslation();
  const { user, profile, loading, openAuth, signOut } = useAuth();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const location = useLocation();
  const menuOpen = openPath === location.key;
  const { data: campaigns } = useDMCampaigns(user?.id);
  const { data: pending } = usePendingRequests(campaigns?.map((c) => c.id) ?? []);
  const toggleLanguage = () => {
    void i18n.changeLanguage(i18n.resolvedLanguage === 'ru' ? 'en' : 'ru');
  };
  const logout = async () => {
    setSigningOut(true);
    setError(null);
    try {
      await signOut();
      setOpenPath(null);
    } catch (err) {
      setError(err);
    } finally {
      setSigningOut(false);
    }
  };
  const create = () => {
    openAuth('/create');
  };
  return (
    <>
      <header className="site-header">
        <div className="page-shell header-inner">
          <Brand />
          <nav className="desktop-nav" aria-label={t('common.menu')}>
            <NavLink to="/" end className="nav-link">
              {t('common.catalog')}
            </NavLink>
            {user && (
              <NavLink to="/dashboard" className="nav-link">
                {t('common.dashboard')}
                {!!pending?.length && (
                  <span className="notification-dot" aria-label={t('dashboard.pending')} />
                )}
              </NavLink>
            )}
          </nav>
          <div className="header-actions">
            <button
              type="button"
              className="language-button"
              onClick={toggleLanguage}
              aria-label={t('common.language')}
            >
              {i18n.resolvedLanguage === 'ru' ? 'RU' : 'EN'} <span aria-hidden="true">⌄</span>
            </button>
            <div className="desktop-auth flex items-center gap-3">
              {loading ? (
                <span className="skeleton w-24 h-10" />
              ) : user ? (
                <>
                  <Link to="/profile" aria-label={t('common.editProfile')}>
                    <Avatar
                      src={profile?.avatar_url}
                      username={profile?.username ?? t('common.unknown')}
                      size="sm"
                    />
                  </Link>
                  <IconButton label={t('common.signOut')} onClick={logout} loading={signingOut}>
                    <LogOut size={17} />
                  </IconButton>
                </>
              ) : (
                <Button variant="ghost" onClick={() => openAuth()}>
                  {t('common.signIn')}
                </Button>
              )}
              {user ? (
                <Link to="/create" className="button button--primary button--sm">
                  <Plus size={14} aria-hidden="true" />
                  {t('common.createGame')}
                </Link>
              ) : (
                <Button size="sm" icon={<Plus size={14} />} onClick={create} disabled={loading}>
                  {t('common.createGame')}
                </Button>
              )}
            </div>
            <IconButton
              className="mobile-toggle"
              label={t('common.menu')}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setOpenPath(menuOpen ? null : location.key)}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </IconButton>
          </div>
        </div>
        {menuOpen && (
          <nav
            id="mobile-navigation"
            className="page-shell mobile-nav"
            aria-label={t('common.menu')}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setOpenPath(null);
            }}
          >
            <Link to="/" onClick={() => setOpenPath(null)}>
              {t('common.catalog')}
            </Link>
            {user && (
              <>
                <Link to="/dashboard">
                  {t('common.dashboard')}
                  {!!pending?.length && <span className="notification-dot" />}
                </Link>
                <Link to="/profile">{t('common.editProfile')}</Link>
                <Link to="/create">{t('common.createGame')}</Link>
              </>
            )}
            {!loading && (
              <Button
                variant="outline"
                loading={signingOut}
                onClick={
                  user
                    ? logout
                    : () => {
                        openAuth();
                      }
                }
              >
                {t(user ? 'common.signOut' : 'common.signIn')}
              </Button>
            )}
            {!user && <Button onClick={create}>{t('common.createGame')}</Button>}
          </nav>
        )}
      </header>
      {error !== null && (
        <div className="page-shell mt-4">
          <Alert>{t(errorKey(error))}</Alert>
        </div>
      )}
      <AuthModal />
    </>
  );
}
