import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Compass } from 'lucide-react';
import { useAuth } from '@/hooks/auth-context';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { Alert } from '@/components/ui/Feedback';
import { loginSchema, registerSchema } from '@/lib/domain';
import { errorKey } from '@/lib/errors';
import { isBackendConfigured } from '@/lib/supabase';
type Mode = 'login' | 'register';
export function AuthModal() {
  const { t } = useTranslation();
  const { signIn, signUp, authOpen, closeAuth, destination } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [error, setError] = useState<string | null>(null);
  const [verification, setVerification] = useState(false);
  const login = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) });
  const register = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
  });
  const busy = login.formState.isSubmitting || register.formState.isSubmitting;
  const finish = () => {
    closeAuth();
    login.reset();
    register.reset();
    if (destination?.startsWith('/') && !destination.startsWith('//')) navigate(destination);
  };
  const submitLogin = async (data: z.infer<typeof loginSchema>) => {
    setError(null);
    try {
      await signIn(data.email, data.password);
      finish();
    } catch (err) {
      setError(errorKey(err));
    }
  };
  const submitRegister = async (data: z.infer<typeof registerSchema>) => {
    setError(null);
    try {
      const signedIn = await signUp(data.email, data.password, data.username);
      if (signedIn) finish();
      else {
        setVerification(true);
        setMode('login');
        register.reset();
      }
    } catch (err) {
      setError(errorKey(err));
    }
  };
  return (
    <Modal
      isOpen={authOpen}
      onClose={closeAuth}
      title={t(mode === 'login' ? 'auth.welcomeBack' : 'auth.joinQuest')}
      maxWidth="max-w-md"
      dismissible={!busy}
    >
      <Compass size={32} className="auth-crest" aria-hidden="true" />
      <p className="auth-description">
        {t(mode === 'login' ? 'auth.signInToContinue' : 'auth.createAccountToStart')}
      </p>
      <Tabs<Mode>
        label={t('auth.required')}
        panelId="auth-panel"
        tabs={[
          { value: 'login', label: t('common.signIn') },
          { value: 'register', label: t('common.signUp') },
        ]}
        value={mode}
        onChange={(value) => {
          if (!busy) {
            setMode(value);
            setError(null);
          }
        }}
      />
      {!isBackendConfigured && (
        <div className="mb-4">
          <Alert variant="info">{t('errors.configuration')}</Alert>
        </div>
      )}
      {error && (
        <div className="mb-4">
          <Alert>{t(error)}</Alert>
        </div>
      )}
      {verification && (
        <div className="mb-4">
          <Alert variant="success">{t('auth.verify')}</Alert>
        </div>
      )}
      <div
        id="auth-panel"
        role="tabpanel"
        aria-label={t(mode === 'login' ? 'common.signIn' : 'common.signUp')}
      >
        {mode === 'login' ? (
          <form onSubmit={login.handleSubmit(submitLogin)} className="space-y-4" noValidate>
            <Input
              label={t('auth.email')}
              type="email"
              autoComplete="email"
              required
              error={
                login.formState.errors.email?.message && t(login.formState.errors.email.message)
              }
              {...login.register('email')}
            />
            <Input
              label={t('auth.password')}
              type="password"
              autoComplete="current-password"
              required
              error={
                login.formState.errors.password?.message &&
                t(login.formState.errors.password.message)
              }
              {...login.register('password')}
            />
            <Button type="submit" className="w-full" loading={busy} disabled={!isBackendConfigured}>
              {t('common.signIn')}
            </Button>
          </form>
        ) : (
          <form onSubmit={register.handleSubmit(submitRegister)} className="space-y-4" noValidate>
            <Input
              label={t('auth.username')}
              autoComplete="nickname"
              required
              maxLength={20}
              error={
                register.formState.errors.username?.message &&
                t(register.formState.errors.username.message)
              }
              {...register.register('username')}
            />
            <Input
              label={t('auth.email')}
              type="email"
              autoComplete="email"
              required
              error={
                register.formState.errors.email?.message &&
                t(register.formState.errors.email.message)
              }
              {...register.register('email')}
            />
            <Input
              label={t('auth.password')}
              type="password"
              autoComplete="new-password"
              required
              error={
                register.formState.errors.password?.message &&
                t(register.formState.errors.password.message)
              }
              {...register.register('password')}
            />
            <Input
              label={t('auth.confirmPassword')}
              type="password"
              autoComplete="new-password"
              required
              error={
                register.formState.errors.confirmPassword?.message &&
                t(register.formState.errors.confirmPassword.message)
              }
              {...register.register('confirmPassword')}
            />
            <Button type="submit" className="w-full" loading={busy} disabled={!isBackendConfigured}>
              {t('auth.createAccount')}
            </Button>
          </form>
        )}
      </div>
    </Modal>
  );
}
