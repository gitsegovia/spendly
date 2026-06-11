import { View, Text, StyleSheet } from 'react-native';

type MessageType = 'error' | 'success' | 'info';

interface Props {
  message: string;
  type?: MessageType;
}

export function AppMessage({ message, type = 'error' }: Props) {
  if (!message) return null;
  return (
    <View style={[styles.container, styles[type]]}>
      <Text style={[styles.text, textStyles[type]]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4 },
  error:   { backgroundColor: '#FEF2F2' },
  success: { backgroundColor: '#F0FDF4' },
  info:    { backgroundColor: '#EFF6FF' },
});

const textStyles = StyleSheet.create({
  error:   { color: '#DC2626', fontSize: 14, fontWeight: '500' },
  success: { color: '#16A34A', fontSize: 14, fontWeight: '500' },
  info:    { color: '#2563EB', fontSize: 14, fontWeight: '500' },
});
