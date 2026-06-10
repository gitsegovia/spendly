import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#9CA3AF',
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.dashboard') }} />
      <Tabs.Screen name="expenses" options={{ title: t('tabs.expenses') }} />
      <Tabs.Screen name="income" options={{ title: t('tabs.income') }} />
      <Tabs.Screen name="stats" options={{ title: t('tabs.stats') }} />
      <Tabs.Screen name="settings" options={{ title: t('tabs.settings') }} />
    </Tabs>
  );
}
