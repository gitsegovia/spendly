import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

/**
 * Accesos superiores a Perfil y Ajustes, compartidos por las 5 tabs.
 */
export function HeaderActions() {
  const router = useRouter();
  const { session } = useAuth();
  const initials = (session?.user.email ?? '?').slice(0, 2).toUpperCase();

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={styles.circle}
        onPress={() => router.push('/settings')}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Text style={styles.gear}>⚙️</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.circle, styles.avatar]}
        onPress={() => router.push('/profile')}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Text style={styles.avatarText}>{initials}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  circle: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  gear: { fontSize: 16 },
  avatar: { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' },
  avatarText: { fontSize: 12, fontWeight: '700', color: '#4F46E5' },
});
