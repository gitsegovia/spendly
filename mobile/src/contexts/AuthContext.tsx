import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';
import { Profile } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  // Evita cargar el perfil dos veces si SIGNED_IN e INITIAL_SESSION
  // disparan para el mismo usuario en la misma sesión.
  const loadedForUser = useRef<string | null>(null);

  // onAuthStateChange SOLO actualiza session.
  // NO llama loadProfile aquí — hacerlo dentro del callback causa deadlock
  // porque el lock interno de Supabase sigue tomado durante SIGNED_IN.
  useEffect(() => {
    console.log('[Auth] useEffect mount — registrando onAuthStateChange');
    console.log('[Auth] supabase URL check:', process.env.EXPO_PUBLIC_SUPABASE_URL?.slice(0, 30) ?? 'NO URL ENCONTRADA');

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] event:', event, '| session:', session ? `SI (${session.user.email})` : 'NO');
      setSession(session);

      if (event === 'SIGNED_OUT') {
        console.log('[Auth] SIGNED_OUT — limpiando estado');
        setProfile(null);
        loadedForUser.current = null;
        setLoading(false);
      } else if (event === 'INITIAL_SESSION' && !session) {
        console.log('[Auth] INITIAL_SESSION sin sesión — redirigiendo a login');
        setLoading(false);
      } else if (event === 'SIGNED_IN' && session && loadedForUser.current !== session.user.id) {
        // Nuevo usuario — mostrar loading mientras loadProfile corre
        setLoading(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // loadProfile corre en un useEffect separado, FUERA del contexto del callback
  // de onAuthStateChange, garantizando que el lock de auth ya fue liberado.
  useEffect(() => {
    if (!session) return;
    if (loadedForUser.current === session.user.id) {
      setLoading(false);
      return;
    }
    loadedForUser.current = session.user.id;
    console.log('[Auth] useEffect session — disparando loadProfile para', session.user.email);
    loadProfile(session.user.id);
  }, [session?.user.id]);

  async function loadProfile(userId: string) {
    console.log('[Auth] loadProfile start — userId:', userId);
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout>;
    try {
      console.log('[Auth] consultando profiles en Supabase...');
      const { data, error } = await Promise.race([
        supabase.from('profiles').select('*').eq('id', userId).single().abortSignal(controller.signal),
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            console.warn('[Auth] loadProfile timeout 6s — abortando request');
            controller.abort();
            reject(new Error('loadProfile timeout 6s'));
          }, 6000);
        }),
      ]).finally(() => clearTimeout(timeoutId));
      console.log('[Auth] profiles respuesta — data:', !!data, '| error:', error?.message ?? 'ninguno');
      if (error) console.error('[Auth] loadProfile error:', error.message);
      if (data) setProfile(data as Profile);
    } catch (e) {
      console.error('[Auth] loadProfile exception/timeout:', e);
    } finally {
      console.log('[Auth] loadProfile finally — setLoading(false)');
      setLoading(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function refreshProfile() {
    if (!session) return;
    await loadProfile(session.user.id);
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
