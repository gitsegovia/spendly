import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';
import { supabase } from '../lib/supabase/client';
import { useAuth } from './AuthContext';
import i18n from '../lib/i18n';

const NOTIF_ID = 'spendly-daily-reminder';
const CHANNEL_ID = 'daily-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function fireAndForget(p: Promise<unknown>, label: string) {
  p.then(() => console.log(`[Notifications] ${label} done`))
   .catch((e) => console.log(`[Notifications] ${label} error (native may still work):`, e));
}

async function setupAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Daily reminder',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

function buildTrigger(hour: number, minute: number): Notifications.DailyTriggerInput {
  return {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
    hour,
    minute,
  } as Notifications.DailyTriggerInput;
}

async function isScheduledOnDevice(): Promise<boolean> {
  try {
    const all = await Promise.race([
      Notifications.getAllScheduledNotificationsAsync(),
      new Promise<Notifications.NotificationRequest[]>((resolve) =>
        setTimeout(() => { console.log('[Notifications] getAllScheduled timeout'); resolve([]); }, 4000),
      ),
    ]);
    console.log('[Notifications] scheduled on device:', all.map((n) => n.identifier));
    return all.some((n) => n.identifier === NOTIF_ID);
  } catch (e) {
    console.log('[Notifications] getAllScheduled error:', e);
    return false;
  }
}

interface NotificationsContextType {
  scheduled: boolean;
  hour: number;
  minute: number;
  loading: boolean;
  permissionDenied: boolean;
  schedule: (h: number, m: number) => Promise<void>;
  cancel: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType>({
  scheduled: false,
  hour: 20,
  minute: 0,
  loading: true,
  permissionDenied: false,
  schedule: async () => {},
  cancel: async () => {},
});

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { profile, session } = useAuth();
  const [scheduled, setScheduled] = useState(false);
  const [hour, setHour] = useState(20);
  const [minute, setMinute] = useState(0);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const synced = useRef(false);

  async function syncWithDevice(enabled: boolean, h: number, m: number) {
    console.log('[Notifications] syncWithDevice — enabled:', enabled, 'h:', h, 'm:', m);
    try {
      // Limpia ghost jobs (fire-and-forget) + pausa para que el SO procese
      console.log('[Notifications] clearing all ghost jobs');
      fireAndForget(Notifications.cancelAllScheduledNotificationsAsync(), 'startup clearAll');
      await new Promise((r) => setTimeout(r, 1500));

      setHour(h);
      setMinute(m);

      if (!enabled) {
        setScheduled(false);
        return;
      }

      // Después del clearAll nuestro job ya no existe — siempre reprogramar
      const onDevice = await isScheduledOnDevice();
      if (!onDevice) {
        console.log('[Notifications] NOT on device — rescheduling');
        fireAndForget(
          Notifications.scheduleNotificationAsync({
            identifier: NOTIF_ID,
            content: { title: 'Spendly', body: i18n.t('notifications.reminder_body') },
            trigger: buildTrigger(h, m),
          }),
          'startup reschedule',
        );
      } else {
        console.log('[Notifications] already on device, ok');
      }
      setScheduled(true);
    } catch (e) {
      console.log('[Notifications] syncWithDevice error:', e);
    } finally {
      setLoading(false);
    }
  }

  // Corre una sola vez cuando el perfil está disponible
  useEffect(() => {
    if (!profile || synced.current) return;
    synced.current = true;
    setupAndroidChannel();
    syncWithDevice(
      profile.notification_enabled ?? false,
      profile.notification_hour ?? 20,
      profile.notification_minute ?? 0,
    );
  }, [profile?.id]);

  // Re-verifica al volver al foreground (el user abre la app de fondo)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || !profile?.notification_enabled) return;
      isScheduledOnDevice().then((on) => {
        if (!on) {
          console.log('[Notifications] foreground: not on device, rescheduling');
          fireAndForget(
            Notifications.scheduleNotificationAsync({
              identifier: NOTIF_ID,
              content: { title: 'Spendly', body: i18n.t('notifications.reminder_body') },
              trigger: buildTrigger(hour, minute),
            }),
            'foreground reschedule',
          );
        }
      });
    });
    return () => sub.remove();
  }, [profile?.notification_enabled, hour, minute]);

  // Log cuando llega una notificación con la app abierta
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((n) => {
      console.log(
        '[Notifications] RECEIVED — id:', n.request.identifier,
        '| time:', new Date().toLocaleTimeString(),
      );
    });
    return () => sub.remove();
  }, []);

  const schedule = useCallback(async (h: number, m: number) => {
    setPermissionDenied(false);
    const { status } = await Notifications.requestPermissionsAsync();
    console.log('[Notifications] permission status:', status);
    if (status !== 'granted') {
      setPermissionDenied(true);
      throw new Error('permission_denied');
    }

    // Programa en el dispositivo (fire-and-forget — Bridge puede no resolver en Android)
    fireAndForget(
      Notifications.scheduleNotificationAsync({
        identifier: NOTIF_ID,
        content: { title: 'Spendly', body: i18n.t('notifications.reminder_body') },
        trigger: buildTrigger(h, m),
      }),
      'schedule',
    );

    // Guarda en Supabase
    if (session?.user.id) {
      const { error } = await supabase.from('profiles').update({
        notification_enabled: true,
        notification_hour: h,
        notification_minute: m,
      }).eq('id', session.user.id);
      if (error) console.log('[Notifications] supabase update error:', error.message);
    }

    setScheduled(true);
    setHour(h);
    setMinute(m);
    console.log('[Notifications] scheduled at', h, ':', m);
  }, [session?.user.id]);

  const cancel = useCallback(async () => {
    fireAndForget(
      Notifications.cancelScheduledNotificationAsync(NOTIF_ID),
      'cancel',
    );

    if (session?.user.id) {
      const { error } = await supabase.from('profiles').update({
        notification_enabled: false,
      }).eq('id', session.user.id);
      if (error) console.log('[Notifications] supabase cancel error:', error.message);
    }

    setScheduled(false);
    console.log('[Notifications] cancelled');
  }, [session?.user.id]);

  return (
    <NotificationsContext.Provider value={{ scheduled, hour, minute, loading, permissionDenied, schedule, cancel }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotificationsContext = () => useContext(NotificationsContext);
