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
  sync: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType>({
  syncStatus: 'idle',
  lastSyncedAt: null,
  sync: async () => {},
});

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const isSyncing = useRef(false);
  const wasOffline = useRef(false);
  const hadSession = useRef(false);

  const sync = async (reason?: string) => {
    if (isSyncing.current || !session) return;
    isSyncing.current = true;
    setSyncStatus('syncing');
    console.log('[DB] Sync start' + (reason ? ` (${reason})` : ''));
    try {
      await syncWithSupabase();
      setLastSyncedAt(Date.now());
      setSyncStatus('idle');
      console.log('[DB] Sync complete');
    } catch (e) {
      console.error('[DB] Sync error:', e);
      setSyncStatus('error');
    } finally {
      isSyncing.current = false;
    }
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
      if (next === 'active' && session) {
        sync('foreground');
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [session]);

  // Re-sync when network reconnects (catches offline → online transition)
  useEffect(() => {
    if (!session) return;
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = state.isConnected && state.isInternetReachable !== false;
      if (isOnline && wasOffline.current) {
        console.log('[DB] Network restored — syncing pending changes');
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
