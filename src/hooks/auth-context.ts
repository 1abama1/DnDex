import { createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';
export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  profileError: unknown;
  sessionError: unknown;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  authOpen: boolean;
  destination: string | null;
  openAuth: (destination?: string) => void;
  closeAuth: () => void;
  retryProfile: () => void;
}
export const AuthContext = createContext<AuthState | undefined>(undefined);
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is required');
  return value;
}
