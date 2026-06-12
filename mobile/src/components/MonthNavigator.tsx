import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

interface Props {
  year: number;
  month: number; // 1-12
  onPrev: () => void;
  onNext: () => void;
  lang?: string;
  isAtFreeLimit?: boolean;
  onUpgradePress?: () => void;
}

export function MonthNavigator({ year, month, onPrev, onNext, lang = 'es', isAtFreeLimit, onUpgradePress }: Props) {
  const months = lang === 'en' ? MONTHS_EN : MONTHS_ES;
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  function handlePrev() {
    if (isAtFreeLimit) {
      onUpgradePress?.();
    } else {
      onPrev();
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePrev} style={styles.arrow}>
        {isAtFreeLimit ? (
          <Text style={styles.lockIcon}>🔒</Text>
        ) : (
          <Text style={styles.arrowText}>‹</Text>
        )}
      </TouchableOpacity>
      <Text style={styles.label}>
        {months[month - 1]} {year}
      </Text>
      <TouchableOpacity onPress={onNext} style={styles.arrow} disabled={isCurrentMonth}>
        <Text style={[styles.arrowText, isCurrentMonth && styles.disabled]}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 16,
  },
  arrow: { padding: 8 },
  arrowText: { fontSize: 28, color: '#4F46E5', fontWeight: '300' },
  lockIcon: { fontSize: 20 },
  disabled: { color: '#D1D5DB' },
  label: { fontSize: 17, fontWeight: '600', color: '#111827', minWidth: 160, textAlign: 'center' },
});
