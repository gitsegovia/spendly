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
    console.log('[Auth] useEffect mount — registrando onAuthStateChange');
    console.log('[Auth] supabase URL check:', process.env.EXPO_PUBLIC_SUPABASE_URL?.slice(0, 30) ?? 'NO URL ENCONTRADA');

    // INITIAL_SESSION se dispara cuando el cliente termina su inicialización interna
    // (incluyendo el token refresh si el token estaba expirado).
    // Evita competir por el lock interno de Supabase que causa el hang con getSession().
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] event:', event, '| session:', session ? `SI (${session.user.email})` : 'NO');

        if (event === 'INITIAL_SESSION') {
          setSession(session);
          if (session) {
            console.log('[Auth] INITIAL_SESSION con sesión — cargando perfil');
            await loadProfile(session.user.id);
          } else {
            console.log('[Auth] INITIAL_SESSION sin sesión — redirigiendo a login');
            setLoading(false);
          }
        } else if (event === 'SIGNED_IN') {
          setSession(session);
          if (session) {
            console.log('[Auth] SIGNED_IN — cargando perfil para', session.user.email);
            await loadProfile(session.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[Auth] SIGNED_OUT — limpiando estado');
          setSession(null);
          setProfile(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('[Auth] TOKEN_REFRESHED — actualizando sesión');
          setSession(session);
        } else {
          console.log('[Auth] evento ignorado:', event);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    console.log('[Auth] loadProfile start — userId:', userId);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      console.warn('[Auth] loadProfile timeout 6s — abortando query de profiles');
      controller.abort();
    }, 6000);
    try {
      console.log('[Auth] consultando profiles en Supabase...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
        .abortSignal(controller.signal);
      console.log('[Auth] profiles respuesta — data:', !!data, '| error:', error?.message ?? 'ninguno');
      if (error) console.error('[Auth] loadProfile error:', error.message);
      if (data) setProfile(data as Profile);
    } catch (e) {
      console.error('[Auth] loadProfile exception/timeout:', e);
    } finally {
      clearTimeout(timer);
      console.log('[Auth] loadProfile finally — setLoading(false)');
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
