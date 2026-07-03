import { Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  onPress: () => void;
  /** Color de acento de la vista (gastos, ingresos, ahorro) */
  color: string;
}

/**
 * Botón flotante circular para agregar transacciones.
 * Va abajo a la derecha, por encima del tab bar (el screen no se extiende debajo de él).
 */
export function AddFab({ onPress, color }: Props) {
  return (
    <TouchableOpacity
      style={[styles.fab, { backgroundColor: color, shadowColor: color }]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel="+"
    >
      <Text style={styles.plus}>＋</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  plus: { color: '#fff', fontSize: 28, fontWeight: '600', marginTop: -2 },
});
