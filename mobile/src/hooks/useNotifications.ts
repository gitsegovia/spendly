import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import i18n from '../lib/i18n';

const STORAGE_KEY = 'spendly_notifications';
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
      sound: 'default',
    });
  }
}

async function scheduleDaily(hour: number, minute: number) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Spendly',
      body: i18n.t('notifications.reminder_body'),
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
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
      if (value) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          setPermissionDenied(true);
          return;
        }
        await scheduleDaily(hour, minute);
      } else {
        await Notifications.cancelAllScheduledNotificationsAsync();
      }
      setEnabled(value);
      await persist({ enabled: value, hour, minute });
    },
    [hour, minute, persist],
  );

  const updateTime = useCallback(
    async (h: number, m: number) => {
      setHour(h);
      setMinute(m);
      if (enabled) await scheduleDaily(h, m);
      await persist({ enabled, hour: h, minute: m });
    },
    [enabled, persist],
  );

  return { enabled, hour, minute, loading, permissionDenied, toggle, updateTime };
}
