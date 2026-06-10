import { View, Text, StyleSheet } from 'react-native';
export default function Screen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Próximamente — Sprint 2</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  text: { color: '#9CA3AF', fontSize: 14 },
});
