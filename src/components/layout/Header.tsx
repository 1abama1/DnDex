import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Dice5, Menu, X, Plus, LayoutDashboard, LogOut, LogIn, User, Languages } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDMCampaigns } from '@/hooks/useCampaigns';
import { usePendingRequests, useParticipantsRealtime } from '@/hooks/useParticipants';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { AuthModal } from '@/components/auth/AuthModal';
import { useTranslation } from 'react-i18next';

export function Header() {
  const { t, i18n } = useTranslation();
  const { user, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // Notification logic
  const { data: dmCampaigns } = useDMCampaigns(user?.id);
  const campaignIds = dmCampaigns?.map((c) => c.id) ?? [];
  const { data: pendingRequests } = usePendingRequests(campaignIds);
  const hasNotifications = (pendingRequests?.length ?? 0) > 0;

  // Subscribe to realtime updates globally
  useParticipantsRealtime(campaignIds);

  const handleAuth = () => {
    if (user) {
      signOut();
    } else {
      setAuthOpen(true);
    }
  };
  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'ru' ? 'en' : 'ru');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2.5 text-text-primary hover:text-gold transition-colors group"
            >
              <div className="p-1.5 rounded-lg bg-gold/10 group-hover:bg-gold/20 transition-colors">
                <Dice5 size={22} className="text-gold" />
              </div>
              <span className="text-xl font-extrabold tracking-tight">
                DnDex
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/')
                  ? 'text-gold bg-gold/10'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                  }`}
              >
                {t('common.catalog')}
              </Link>
              {user && (
                <>
                  <Link
                    to="/dashboard"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all relative group ${isActive('/dashboard')
                      ? 'text-gold bg-gold/10'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                      }`}
                  >
                    {t('common.dashboard')}
                    {hasNotifications && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-crimson rounded-full border border-bg-primary" />
                    )}
                  </Link>
                  <Button
                    size="sm"
                    onClick={() => navigate('/create')}
                    icon={<Plus size={16} />}
                  >
                    {t('common.createGame')}
                  </Button>
                </>
              )}
            </nav>

            {/* Auth / Profile */}
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={toggleLanguage}
                className="px-3 py-2 rounded-lg text-xs font-bold text-text-muted hover:text-gold hover:bg-gold/10 transition-all cursor-pointer uppercase"
                title="Switch Language"
              >
                <div className="flex items-center gap-1.5">
                  <Languages size={14} />
                  {i18n.language === 'ru' ? 'RU' : 'EN'}
                </div>
              </button>

              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <Avatar src={profile?.avatar_url} username={profile?.username ?? user.email ?? 'User'} size="sm" />
                    <span className="text-sm font-medium text-text-primary">{profile?.username ?? user.email?.split('@')[0] ?? 'Player'}</span>
                  </Link>
                  <button
                    onClick={handleAuth}
                    className="p-2 rounded-lg text-text-muted hover:text-crimson-light hover:bg-crimson/10 transition-all cursor-pointer"
                    title={t('common.signOut')}
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={handleAuth} icon={<LogIn size={16} />} className="border-white/10 hover:bg-white/5">
                  {t('common.signIn')}
                </Button>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-border bg-bg-secondary/95 backdrop-blur-xl animate-fade-in">
            <div className="px-4 py-4 space-y-2">
              <Link
                to="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all"
              >
                <Dice5 size={18} /> {t('common.catalog')}
              </Link>
              {user && (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <LayoutDashboard size={18} /> {t('common.dashboard')}
                    </div>
                    {hasNotifications && (
                      <span className="w-2 h-2 bg-crimson rounded-full" />
                    )}
                  </Link>
                  <Link
                    to="/create"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-gold hover:bg-gold/10 transition-all border border-gold/20"
                  >
                    <Plus size={18} /> {t('common.createGame')}
                  </Link>
                </>
              )}
              <div className="pt-2 border-t border-border">
                {user && (
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all"
                  >
                    <User size={18} /> {t('common.editProfile')}
                  </Link>
                )}
                <button
                  onClick={() => {
                    toggleLanguage();
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all cursor-pointer"
                >
                  <Languages size={18} /> {i18n.language === 'ru' ? 'English' : 'Русский'}
                </button>
                <button
                  onClick={() => {
                    handleAuth();
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all cursor-pointer"
                >
                  {user ? (
                    <>
                      <LogOut size={18} /> {t('common.signOut')}
                    </>
                  ) : (
                    <>
                      <LogIn size={18} /> {t('common.signIn')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
