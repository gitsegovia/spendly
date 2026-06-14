import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import i18n from '../lib/i18n';

const STORAGE_KEY = 'spendly_notifications';
const CHANNEL_ID = 'daily-reminder';
// Identifier fijo: en Android el WorkManager crea el job aunque el JS Promise no resuelva.
// Usar el mismo identifier garantiza que solo existe un job activo (el nuevo reemplaza al anterior).
const NOTIF_ID = 'spendly-daily-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function setupAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Daily reminder',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

// En Android la Promise puede no resolver (bug Bridge/WorkManager) pero la operación
// nativa SÍ ocurre. Disparar y olvidar — el estado se maneja optimisticamente en JS.
function fireAndForget(promise: Promise<unknown>, label: string) {
  promise
    .then(() => console.log(`[Notifications] ${label} done`))
    .catch((e) => console.log(`[Notifications] ${label} error (native may still work):`, e));
}

function nextOccurrence(hour: number, minute: number): Date {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target;
}

function buildTrigger(hour: number, minute: number): Notifications.SchedulableNotificationTriggerInput {
  if (Platform.OS === 'android') {
    // DATE trigger: dispara en la próxima ocurrencia exacta de la hora configurada.
    // Al ser one-shot, la app reprograma al abrirse (startup effect).
    return {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: nextOccurrence(hour, minute),
    };
  }
  return {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour,
    minute,
  };
}

function scheduleDaily(hour: number, minute: number): Promise<string> {
  console.log('[Notifications] scheduleDaily', { hour, minute });
  return Notifications.scheduleNotificationAsync({
    identifier: NOTIF_ID,
    content: {
      title: 'Spendly',
      body: i18n.t('notifications.reminder_body'),
    },
    trigger: buildTrigger(hour, minute),
  });
}

interface NotificationSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

export function useNotifications() {
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(20);
  const [minute, setMinute] = useState(0);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const toggling = useRef(false);

  useEffect(() => {
    setupAndroidChannel();

    AsyncStorage.getItem(STORAGE_KEY).then(async (raw) => {
      const saved: NotificationSettings = raw
        ? JSON.parse(raw)
        : { enabled: false, hour: 20, minute: 0 };

      setEnabled(saved.enabled);
      setHour(saved.hour);
      setMinute(saved.minute);

      if (Platform.OS === 'android') {
        // Limpia ghost jobs de sesiones previas (fire and forget — el Bridge puede no resolver)
        console.log('[Notifications] startup: clearing ghost jobs');
        fireAndForget(Notifications.cancelAllScheduledNotificationsAsync(), 'startup cancelAll');
        // Pausa para que el SO procese la cancelación antes de reprogramar
        await new Promise((r) => setTimeout(r, 1500));
        if (saved.enabled) {
          console.log('[Notifications] startup: rescheduling');
          fireAndForget(scheduleDaily(saved.hour, saved.minute), 'startup schedule');
        }
      }

      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((n) => {
      console.log(
        '[Notifications] RECEIVED — id:', n.request.identifier,
        '| time:', new Date().toLocaleTimeString(),
      );
    });
    return () => sub.remove();
  }, []);

  const persist = useCallback(async (settings: NotificationSettings) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, []);

  const toggle = useCallback(
    async (value: boolean) => {
      if (toggling.current) {
        console.log('[Notifications] toggle already in progress, skip');
        return;
      }
      toggling.current = true;
      setPermissionDenied(false);

      try {
        if (value) {
          const { status } = await Notifications.requestPermissionsAsync();
          console.log('[Notifications] permission status:', status);
          if (status !== 'granted') {
            setPermissionDenied(true);
            return;
          }
        }

        // Estado optimista: actualizar JS sin esperar al Bridge de Android
        setEnabled(value);
        await persist({ enabled: value, hour, minute });

        if (value) {
          fireAndForget(scheduleDaily(hour, minute), 'toggle schedule');
        } else {
          fireAndForget(
            Notifications.cancelScheduledNotificationAsync(NOTIF_ID),
            'toggle cancel',
          );
        }
      } catch (e) {
        console.log('[Notifications] toggle error:', e);
      } finally {
        toggling.current = false;
      }
    },
    [hour, minute, persist],
  );

  const updateTime = useCallback(
    async (h: number, m: number) => {
      setHour(h);
      setMinute(m);
      await persist({ enabled, hour: h, minute: m });
      console.log('[Notifications] time preference saved:', h, ':', m);
      if (!enabled || Platform.OS === 'android') return;
      fireAndForget(scheduleDaily(h, m), 'updateTime reschedule');
    },
    [enabled, persist],
  );

  return { enabled, hour, minute, loading, permissionDenied, toggle, updateTime };
}
