import { Tabs, usePathname } from 'expo-router';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.65 }]}>{emoji}</Text>
  );
}

function CenterTabButton({ onPress }: any) {
  const pathname = usePathname();
  const focused = pathname === '/' || pathname === '/index';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.centerWrap}
    >
      <View style={[styles.centerCircle, focused && styles.centerCircleFocused]}>
        <Text style={[styles.centerIcon, { opacity: focused ? 1 : 0.65 }]}>🏠</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="expenses"
        options={{
          title: t('tabs.expenses'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="💸" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="income"
        options={{
          title: t('tabs.income'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="💰" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: '',
          tabBarButton: (props) => <CenterTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: t('tabs.stats'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 12,
  },
  tabItem: {
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  tabIcon: {
    fontSize: 22,
  },

  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    top: -10,
  },
  centerCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    borderWidth: 2.5,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 6,
  },
  centerCircleFocused: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOpacity: 0.2,
    elevation: 8,
  },
  centerIcon: {
    fontSize: 26,
  },
});
