import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { Dice5 } from 'lucide-react';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';

const loginSchema = z.object({
  email: z.string().email('auth.invalidEmail'),
  password: z.string().min(6, 'auth.passwordMin'),
});

const registerSchema = loginSchema.extend({
  username: z.string().min(3, 'auth.usernameMin').max(20, 'auth.usernameMax'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'auth.passwordsDoNotMatch',
  path: ['confirmPassword'],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);
  const { signIn, signUp } = useAuth();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const handleLogin = async (data: LoginForm) => {
    setError(null);
    const result = await signIn(data.email, data.password);
    if (result.error) {
      setError(result.error.message);
    } else {
      onClose();
      loginForm.reset();
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    setError(null);
    const result = await signUp(data.email, data.password, data.username);
    if (result.error) {
      setError(result.error.message);
    } else {
      onClose();
      registerForm.reset();
      setMode('login');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex p-3 rounded-2xl bg-gold/10 mb-4">
          <Dice5 size={32} className="text-gold" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white leading-tight">
          {mode === 'login' ? t('auth.welcomeBack') : t('auth.joinQuest')}
        </h2>
        <p className="text-sm text-text-muted mt-1">
          {mode === 'login'
            ? t('auth.signInToContinue')
            : t('auth.createAccountToStart')}
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-lg bg-bg-tertiary p-1 mb-6">
        <button
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${
            mode === 'login'
              ? 'bg-bg-card text-text-primary shadow-sm'
              : 'text-text-muted hover:text-text-secondary'
          }`}
          onClick={() => { setMode('login'); setError(null); }}
        >
          {t('common.signIn')}
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${
            mode === 'register'
              ? 'bg-bg-card text-text-primary shadow-sm'
              : 'text-text-muted hover:text-text-secondary'
          }`}
          onClick={() => { setMode('register'); setError(null); }}
        >
          {t('common.signUp')}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-crimson/10 border border-crimson/30 text-crimson-light text-sm">
          {error}
        </div>
      )}

      {/* Login Form */}
      {mode === 'login' && (
        <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
          <Input
            label={t('auth.email')}
            type="email"
            placeholder="adventurer@dndex.com"
            error={loginForm.formState.errors.email?.message ? t(loginForm.formState.errors.email.message) : undefined}
            {...loginForm.register('email')}
          />
          <Input
            label={t('auth.password')}
            type="password"
            placeholder="••••••••"
            error={loginForm.formState.errors.password?.message ? t(loginForm.formState.errors.password.message) : undefined}
            {...loginForm.register('password')}
          />
          <Button
            type="submit"
            className="w-full"
            loading={loginForm.formState.isSubmitting}
          >
            {t('common.signIn')}
          </Button>
        </form>
      )}

      {/* Register Form */}
      {mode === 'register' && (
        <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
          <Input
            label={t('auth.username')}
            placeholder="Archmage_Vex"
            error={registerForm.formState.errors.username?.message ? t(registerForm.formState.errors.username.message) : undefined}
            {...registerForm.register('username')}
          />
          <Input
            label={t('auth.email')}
            type="email"
            placeholder="adventurer@dndex.com"
            error={registerForm.formState.errors.email?.message ? t(registerForm.formState.errors.email.message) : undefined}
            {...registerForm.register('email')}
          />
          <Input
            label={t('auth.password')}
            type="password"
            placeholder="••••••••"
            error={registerForm.formState.errors.password?.message ? t(registerForm.formState.errors.password.message) : undefined}
            {...registerForm.register('password')}
          />
          <Input
            label={t('auth.confirmPassword')}
            type="password"
            placeholder="••••••••"
            error={registerForm.formState.errors.confirmPassword?.message ? t(registerForm.formState.errors.confirmPassword.message) : undefined}
            {...registerForm.register('confirmPassword')}
          />
          <Button
            type="submit"
            className="w-full"
            loading={registerForm.formState.isSubmitting}
          >
            {t('auth.createAccount')}
          </Button>
        </form>
      )}
    </Modal>
  );
}
