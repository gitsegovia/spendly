import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';
import { Profile } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[Auth] iniciando getSession...');
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('[Auth] getSession ok — session:', session ? 'SI' : 'NO', error ? 'error:' + error.message : '');
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setLoading(false);
    }).catch((e) => {
      console.error('[Auth] getSession catch:', e);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('[Auth] onAuthStateChange event — session:', session ? 'SI' : 'NO');
        setSession(session);
        if (session) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    console.log('[Auth] loadProfile llamado para:', userId.slice(0, 8) + '...');
    try {
      // Timeout manual de 5s para no colgar el spinner
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000));
      const query = supabase.from('profiles').select('*').eq('id', userId).single();
      const result = await Promise.race([query, timeout]);

      if (result && 'data' in result) {
        const { data, error } = result as { data: Profile | null; error: any };
        if (error) console.error('[Auth] loadProfile error:', error.message);
        if (data) { console.log('[Auth] profile cargado OK'); setProfile(data); }
        else console.warn('[Auth] profile no encontrado para user:', userId.slice(0, 8));
      } else {
        console.warn('[Auth] loadProfile timeout — continuando sin profile');
      }
    } catch (e) {
      console.error('[Auth] loadProfile exception:', e);
    } finally {
      console.log('[Auth] setLoading(false)');
      setLoading(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
