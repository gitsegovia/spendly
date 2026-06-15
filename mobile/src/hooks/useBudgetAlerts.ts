import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMonthlyStats } from './useMonthlyStats';
import { useBudgets } from './useBudgets';
import { categoryLabel } from '../lib/categoryName';
import i18n from '../lib/i18n';

const CHANNEL_ID = 'budget-alerts';

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Budget alerts',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

async function hasPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

async function fireNotif(title: string, body: string) {
  const trigger = Platform.OS === 'android'
    ? ({
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
        repeats: false,
        channelId: CHANNEL_ID,
      } as any)
    : null;

  await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger });
}

function alertKey(year: number, month: number, categoryId: string, threshold: 80 | 100) {
  return `spendly_budget_alert_${year}_${month}_${categoryId}_${threshold}`;
}

export function useBudgetAlerts() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const { stats } = useMonthlyStats(year, month);
  const { budgets } = useBudgets();
  const channelReady = useRef(false);
  const t = (key: string, opts?: any): string => String(i18n.t(key, opts));

  useEffect(() => {
    if (!channelReady.current) {
      ensureChannel();
      channelReady.current = true;
    }
  }, []);

  useEffect(() => {
    if (!budgets.length || !stats.expensesByCategory.length) return;

    (async () => {
      if (!(await hasPermission())) return;

      for (const budget of budgets) {
        const stat = stats.expensesByCategory.find((e) => e.category_id === budget.category_id);
        if (!stat || stat.total === 0) continue;

        const pct = (stat.total / budget.amount) * 100;
        const label = categoryLabel(stat.category_name, t);

        // 100% — límite superado
        if (pct >= 100) {
          const key = alertKey(year, month, budget.category_id, 100);
          if (!(await AsyncStorage.getItem(key))) {
            await fireNotif(
              String(t('budget.alert_over_title', { category: label })),
              String(t('budget.alert_over_body')),
            );
            await AsyncStorage.setItem(key, '1');
          }
        }

        // 80% — aviso previo (solo si todavía no superó el 100%)
        if (pct >= 80 && pct < 100) {
          const key = alertKey(year, month, budget.category_id, 80);
          if (!(await AsyncStorage.getItem(key))) {
            await fireNotif(
              String(t('budget.alert_80_title', { category: label })),
              String(t('budget.alert_80_body')),
            );
            await AsyncStorage.setItem(key, '1');
          }
        }
      }
    })();
  }, [stats.expensesByCategory, budgets, year, month]);
}
