import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { database } from '../lib/watermelondb/database';
import { syncWithSupabase } from '../lib/watermelondb/sync';
import { useAuth } from './AuthContext';

type SyncStatus = 'idle' | 'syncing' | 'error';

interface DatabaseContextType {
  syncStatus: SyncStatus;
  lastSyncedAt: number | null;
  sync: (reason?: string) => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType>({
  syncStatus: 'idle',
  lastSyncedAt: null,
  sync: async () => {},
});

// No re-sincronizar si el último sync fue hace menos de 30s (excepto login/manual)
const THROTTLE_MS = 30_000;
// Reintentos: 2s → 5s → 10s
const RETRY_DELAYS = [2_000, 5_000, 10_000];

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const isSyncing = useRef(false);
  const wasOffline = useRef(false);
  const hadSession = useRef(false);
  // Ref para leer lastSyncedAt sin cerrar sobre state desactualizado
  const lastSyncedAtRef = useRef<number | null>(null);

  const sync = async (reason?: string) => {
    if (isSyncing.current || !session) return;

    const forced = reason === 'login' || reason === 'manual';
    if (!forced && lastSyncedAtRef.current && Date.now() - lastSyncedAtRef.current < THROTTLE_MS) {
      console.log(`[DB] Sync throttled (${reason})`);
      return;
    }

    isSyncing.current = true;
    setSyncStatus('syncing');
    console.log(`[DB] Sync start (${reason ?? 'unknown'})`);

    let lastError: unknown;
    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
      try {
        await syncWithSupabase();
        const now = Date.now();
        lastSyncedAtRef.current = now;
        setLastSyncedAt(now);
        setSyncStatus('idle');
        console.log(`[DB] Sync complete (attempt ${attempt + 1})`);
        isSyncing.current = false;
        return;
      } catch (e) {
        lastError = e;
        if (attempt < RETRY_DELAYS.length) {
          const delay = RETRY_DELAYS[attempt];
          console.warn(`[DB] Sync error, retry in ${delay}ms (attempt ${attempt + 1})`, e);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    console.error('[DB] Sync failed after all retries:', lastError);
    setSyncStatus('error');
    isSyncing.current = false;
  };

  // Sync on login / clear on logout
  useEffect(() => {
    if (session) {
      hadSession.current = true;
      sync('login');
    } else if (hadSession.current) {
      hadSession.current = false;
      console.log('[DB] Logout detectado — limpiando base de datos local');
      database.write(() => database.unsafeResetDatabase()).catch(e => console.error('[DB] Reset error:', e));
    }
  }, [session?.user?.id]);

  // Re-sync when app comes to foreground
  useEffect(() => {
    const handleAppState = (next: AppStateStatus) => {
      if (next === 'active' && session) sync('foreground');
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [session]);

  // Re-sync when network reconnects
  useEffect(() => {
    if (!session) return;
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = state.isConnected && state.isInternetReachable !== false;
      if (isOnline && wasOffline.current) {
        console.log('[DB] Network restored — syncing');
        sync('network-restored');
      }
      wasOffline.current = !isOnline;
    });
    return () => unsubscribe();
  }, [session]);

  return (
    <DatabaseContext.Provider value={{ syncStatus, lastSyncedAt, sync }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export const useDatabase = () => useContext(DatabaseContext);
