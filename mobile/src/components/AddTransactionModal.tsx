import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Modal, ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Category, TransactionType } from '../types';

interface Item { name: string; amount: string; quantity: string; }

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (
    categoryId: string,
    amount: number,
    date: string,
    notes: string,
    items: { name: string; amount: number; quantity: number }[]
  ) => Promise<void>;
  categories: Category[];
  type: TransactionType;
  currency: string;
}

export function AddTransactionModal({ visible, onClose, onSave, categories, type, currency }: Props) {
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  function reset() {
    setCategoryId(''); setAmount(''); setNotes('');
    setDate(new Date().toISOString().split('T')[0]); setItems([]);
  }

  function addItem() {
    setItems([...items, { name: '', amount: '', quantity: '1' }]);
  }

  function updateItem(index: number, field: keyof Item, value: string) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!categoryId) return Alert.alert('Error', 'Seleccioná una categoría');
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return Alert.alert('Error', 'Ingresá un monto válido');

    const parsedItems = items
      .filter((i) => i.name.trim())
      .map((i) => ({
        name: i.name.trim(),
        amount: parseFloat(i.amount) || 0,
        quantity: parseFloat(i.quantity) || 1,
      }));

    try {
      setLoading(true);
      await onSave(categoryId, parsedAmount, date, notes, parsedItems);
      reset();
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { reset(); onClose(); }}>
            <Text style={styles.cancel}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{type === 'expense' ? 'Nuevo gasto' : 'Nuevo ingreso'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text style={[styles.save, loading && styles.disabled]}>Guardar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
          {/* Monto */}
          <Text style={styles.label}>Monto ({currency})</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#9CA3AF"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />

          {/* Fecha */}
          <Text style={styles.label}>Fecha</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9CA3AF"
            value={date}
            onChangeText={setDate}
          />

          {/* Categoría */}
          <Text style={styles.label}>Categoría</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.catChip, categoryId === c.id && { borderColor: c.color, backgroundColor: c.color + '20' }]}
                onPress={() => setCategoryId(c.id)}
              >
                <View style={[styles.catDot, { backgroundColor: c.color }]} />
                <Text style={[styles.catText, categoryId === c.id && { color: c.color, fontWeight: '600' }]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Notas */}
          <Text style={styles.label}>Notas (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Descripción..."
            placeholderTextColor="#9CA3AF"
            value={notes}
            onChangeText={setNotes}
          />

          {/* Artículos (solo para gastos) */}
          {type === 'expense' && (
            <>
              <View style={styles.itemsHeader}>
                <Text style={styles.label}>Artículos (opcional)</Text>
                <TouchableOpacity onPress={addItem}>
                  <Text style={styles.addItem}>+ Agregar</Text>
                </TouchableOpacity>
              </View>
              {items.map((item, i) => (
                <View key={i} style={styles.itemRow}>
                  <TextInput
                    style={[styles.input, styles.itemName]}
                    placeholder="Artículo"
                    placeholderTextColor="#9CA3AF"
                    value={item.name}
                    onChangeText={(v) => updateItem(i, 'name', v)}
                  />
                  <TextInput
                    style={[styles.input, styles.itemAmount]}
                    placeholder="Monto"
                    placeholderTextColor="#9CA3AF"
                    value={item.amount}
                    onChangeText={(v) => updateItem(i, 'amount', v)}
                    keyboardType="decimal-pad"
                  />
                  <TouchableOpacity onPress={() => removeItem(i)} style={styles.removeItem}>
                    <Text style={styles.removeText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  cancel: { fontSize: 16, color: '#6B7280' },
  title: { fontSize: 17, fontWeight: '600', color: '#111827' },
  save: { fontSize: 16, color: '#4F46E5', fontWeight: '600' },
  disabled: { opacity: 0.4 },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  input: {
    height: 48, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10,
    paddingHorizontal: 14, fontSize: 16, color: '#111827',
  },
  catRow: { flexDirection: 'row', marginBottom: 4 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#E5E7EB', marginRight: 8,
  },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catText: { fontSize: 14, color: '#6B7280' },
  itemsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addItem: { fontSize: 14, color: '#4F46E5', fontWeight: '600' },
  itemRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  itemName: { flex: 1 },
  itemAmount: { width: 100 },
  removeItem: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  removeText: { fontSize: 16, color: '#EF4444' },
});
