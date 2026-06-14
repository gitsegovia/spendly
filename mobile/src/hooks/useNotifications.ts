import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import i18n from '../lib/i18n';

const STORAGE_KEY = 'spendly_notifications';
const NOTIF_ID_KEY = 'spendly_notification_id';
const CHANNEL_ID = 'daily-reminder';

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

async function cancelPrevious() {
  const prevId = await AsyncStorage.getItem(NOTIF_ID_KEY);
  if (!prevId) {
    console.log('[Notifications] no previous id to cancel');
    return;
  }
  console.log('[Notifications] cancelling previous id:', prevId);
  try {
    await Promise.race([
      Notifications.cancelScheduledNotificationAsync(prevId),
      new Promise<void>((resolve) => setTimeout(resolve, 3000)),
    ]);
    console.log('[Notifications] cancel done (or timed out, proceeding anyway)');
  } catch (e) {
    console.log('[Notifications] cancel error (ignored):', e);
  }
  await AsyncStorage.removeItem(NOTIF_ID_KEY);
}

async function scheduleDaily(hour: number, minute: number) {
  console.log('[Notifications] scheduleDaily start', { hour, minute });
  await cancelPrevious();
  console.log('[Notifications] scheduling new...');

  const trigger: Notifications.SchedulableNotificationTriggerInput =
    Platform.OS === 'android'
      ? {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          channelId: CHANNEL_ID,
          seconds: 60, // TEST: cambiar a 24 * 60 * 60 antes de producción
          repeats: true,
        }
      : {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        };

  const schedulePromise = Notifications.scheduleNotificationAsync({
    content: {
      title: 'Spendly',
      body: i18n.t('notifications.reminder_body'),
    },
    trigger,
  });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('scheduleNotificationAsync timeout after 8s')), 8000),
  );

  const id = await Promise.race([schedulePromise, timeoutPromise]);
  await AsyncStorage.setItem(NOTIF_ID_KEY, id);
  console.log('[Notifications] scheduled, id:', id);
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

  const persist = useCallback(async (settings: NotificationSettings) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, []);

  const toggle = useCallback(
    async (value: boolean) => {
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
          await cancelPrevious();
          console.log('[Notifications] disabled, previous cancelled');
        }
        setEnabled(value);
        await persist({ enabled: value, hour, minute });
      } catch (e) {
        console.log('[Notifications] toggle error:', JSON.stringify(e), e);
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
      // Android uses TIME_INTERVAL (hour/minute don't affect trigger timing) and a second
      // scheduleNotificationAsync call hangs due to WorkManager state — skip reschedule.
      // iOS uses DAILY trigger which respects hour/minute, so reschedule there.
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
