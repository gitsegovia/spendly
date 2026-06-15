import { View, Text, StyleSheet } from 'react-native';

interface Props {
  icon: string;
  title: string;
  hint?: string;
}

export function EmptyState({ icon, title, hint }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 16, fontWeight: '600', color: '#6B7280', textAlign: 'center' },
  hint: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 6, lineHeight: 18 },
});
