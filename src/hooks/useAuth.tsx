import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { backend, supabase } from '@/lib/supabase';
import { getProfile } from '@/services/profiles';
import { queryKeys } from '@/lib/queryKeys';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!!supabase);
  const [sessionError, setSessionError] = useState<unknown>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [destination, setDestination] = useState<string | null>(null);
  const identity = useRef<string | null>(null);
  const user = session?.user ?? null;
  const profileQuery = useQuery({
    queryKey: queryKeys.profile(user?.id ?? ''),
    queryFn: () => getProfile(user!.id),
    enabled: !!user,
  });
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    let receivedEvent = false;
    const applySession = (next: Session | null) => {
      if (!active) return;
      if (identity.current !== (next?.user.id ?? null)) {
        // Private rows and permission-dependent reads cannot survive an account change.
        client.clear();
        identity.current = next?.user.id ?? null;
      }
      setSession(next);
      setSessionError(null);
      setLoading(false);
    };
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      receivedEvent = true;
      applySession(next); // Never perform another Supabase call inside the auth callback.
    });
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active || receivedEvent) return;
        if (error) {
          setSessionError(error);
          setLoading(false);
        } else applySession(data.session);
      })
      .catch((error) => {
        if (active) {
          setSessionError(error);
          setLoading(false);
        }
      });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [client]);
  const signIn = async (email: string, password: string) => {
    const { error } = await backend().auth.signInWithPassword({ email, password });
    if (error) throw error;
  };
  const signUp = async (email: string, password: string, username: string) => {
    const { data, error } = await backend().auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) throw error;
    return !!data.session;
  };
  const signOut = async () => {
    const { error } = await backend().auth.signOut();
    if (error) throw error;
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile: profileQuery.data ?? null,
        loading,
        sessionError,
        profileLoading: !!user && profileQuery.isPending,
        profileError: profileQuery.error,
        signIn,
        signUp,
        signOut,
        authOpen,
        destination,
        openAuth: (path) => {
          setDestination(path ?? null);
          setAuthOpen(true);
        },
        closeAuth: () => setAuthOpen(false),
        retryProfile: () => {
          void profileQuery.refetch();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
