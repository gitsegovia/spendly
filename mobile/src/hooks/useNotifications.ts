import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import i18n from '../lib/i18n';

const STORAGE_KEY = 'spendly_notifications';
const CHANNEL_ID = 'daily-reminder';
const NOTIF_ID = 'spendly-daily-reminder'; // fixed id → segunda llamada reemplaza la primera

// TEST: cambiar a 24 * 60 * 60 antes de producción
const ANDROID_INTERVAL_SECONDS = 5 * 60;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
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

async function scheduleDaily(hour: number, minute: number) {
  console.log('[Notifications] scheduleDaily start', { hour, minute });

  const trigger: Notifications.SchedulableNotificationTriggerInput =
    Platform.OS === 'android'
      ? {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          channelId: CHANNEL_ID,
          seconds: ANDROID_INTERVAL_SECONDS,
          repeats: true,
        }
      : {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        };

  // Identifier fijo: si ya existe un job con este id, Android lo reemplaza
  // en lugar de crear uno nuevo (que generaba deadlock en WorkManager).
  const id = await Promise.race([
    Notifications.scheduleNotificationAsync({
      identifier: NOTIF_ID,
      content: {
        title: 'Spendly',
        body: i18n.t('notifications.reminder_body'),
      },
      trigger,
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('scheduleNotificationAsync timeout after 8s')), 8000),
    ),
  ]);

  console.log('[Notifications] scheduled, id:', id);
}

async function cancelNotification() {
  console.log('[Notifications] cancelling', NOTIF_ID);
  try {
    await Promise.race([
      Notifications.cancelScheduledNotificationAsync(NOTIF_ID),
      new Promise<void>((resolve) => setTimeout(resolve, 3000)),
    ]);
    console.log('[Notifications] cancel done (or timed out)');
  } catch (e) {
    console.log('[Notifications] cancel error (ignored):', e);
  }
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
  const toggling = useRef(false); // guard contra doble disparo del Switch

  useEffect(() => {
    setupAndroidChannel();
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        const saved: NotificationSettings = JSON.parse(raw);
        setEnabled(saved.enabled ?? false);
        setHour(saved.hour ?? 20);
        setMinute(saved.minute ?? 0);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      console.log(
        '[Notifications] RECEIVED while app open — id:',
        notification.request.identifier,
        '| title:', notification.request.content.title,
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
          await scheduleDaily(hour, minute);
          console.log('[Notifications] scheduled daily at', hour, ':', minute);
        } else {
          await cancelNotification();
          console.log('[Notifications] disabled');
        }
        setEnabled(value);
        await persist({ enabled: value, hour, minute });
      } catch (e) {
        console.log('[Notifications] toggle error:', JSON.stringify(e), e);
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
      try {
        await scheduleDaily(h, m);
        console.log('[Notifications] rescheduled at', h, ':', m);
      } catch (e) {
        console.log('[Notifications] reschedule error:', e);
      }
    },
    [enabled, persist],
  );

  return { enabled, hour, minute, loading, permissionDenied, toggle, updateTime };
}
