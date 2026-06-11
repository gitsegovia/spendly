import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Modal, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Category, TransactionType } from '../types';
import { AppMessage } from './AppMessage';

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

function sanitizeDecimal(text: string): string {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) return parts[0] + '.' + parts[1];
  if (parts[1]?.length > 2) return parts[0] + '.' + parts[1].slice(0, 2);
  return cleaned;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function AddTransactionModal({ visible, onClose, onSave, categories, type, currency }: Props) {
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Cálculo en tiempo real para el indicador de artículos
  const parsedTotal = parseFloat(amount) || 0;
  const namedItems = items.filter((i) => i.name.trim());
  const itemsSum = namedItems.reduce(
    (sum, i) => sum + (parseFloat(i.amount) || 0) * (parseFloat(i.quantity) || 1),
    0
  );
  const itemsOverBudget = parsedTotal > 0 && itemsSum > parsedTotal + 0.001;
  const itemsDiff = parsedTotal > 0 ? Math.round((parsedTotal - itemsSum) * 100) / 100 : 0;

  function reset() {
    const today = new Date();
    setCategoryId(''); setAmount(''); setNotes(''); setErrorMsg('');
    setSelectedDate(today); setDate(today.toISOString().split('T')[0]); setItems([]);
  }

  function handleAmountChange(text: string) {
    const val = sanitizeDecimal(text);
    setAmount(val);
    if (errorMsg) setErrorMsg('');
  }

  function handleItemAmountChange(index: number, text: string) {
    updateItem(index, 'amount', sanitizeDecimal(text));
  }

  function handleDateChange(_: any, picked?: Date) {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (picked) {
      setSelectedDate(picked);
      setDate(picked.toISOString().split('T')[0]);
    }
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
    if (!categoryId) return setErrorMsg('Seleccioná una categoría');
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return setErrorMsg('Ingresá un monto válido');

    const parsedItems = namedItems.map((i) => ({
      name: i.name.trim(),
      amount: parseFloat(i.amount) || 0,
      quantity: parseFloat(i.quantity) || 1,
    }));

    const total = parsedItems.reduce((sum, i) => sum + i.amount * i.quantity, 0);

    if (total > parsedAmount + 0.001) {
      return setErrorMsg(
        `La suma de artículos (${currency} ${total.toFixed(2)}) supera el monto total`
      );
    }

    // Si hay artículos y hay diferencia, crear item "Otros" con el resto
    if (parsedItems.length > 0 && itemsDiff > 0.001) {
      parsedItems.push({ name: 'Otros', amount: itemsDiff, quantity: 1 });
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await onSave(categoryId, parsedAmount, date, notes, parsedItems);
      reset();
      onClose();
    } catch (e: any) {
      setErrorMsg(e.message ?? 'Ocurrió un error al guardar');
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
          <AppMessage message={errorMsg} type="error" />

          {/* Monto */}
          <Text style={styles.label}>Monto ({currency})</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#9CA3AF"
            value={amount}
            onChangeText={handleAmountChange}
            keyboardType="decimal-pad"
          />

          {/* Fecha */}
          <Text style={styles.label}>Fecha</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateBtnText}>{formatDate(selectedDate)}</Text>
            <Text style={styles.dateBtnIcon}>📅</Text>
          </TouchableOpacity>

          {/* DatePicker Android — dialog nativo */}
          {showDatePicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}

          {/* DatePicker iOS — spinner en modal bottom */}
          {Platform.OS === 'ios' && (
            <Modal visible={showDatePicker} transparent animationType="slide">
              <View style={styles.dateOverlay}>
                <View style={styles.dateSheet}>
                  <View style={styles.dateSheetHeader}>
                    <Text style={styles.dateSheetTitle}>Seleccioná la fecha</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.dateSheetDone}>Listo</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="spinner"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                    style={{ height: 200 }}
                  />
                </View>
              </View>
            </Modal>
          )}

          {/* Categoría */}
          <Text style={styles.label}>Categoría</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.catChip, categoryId === c.id && { borderColor: c.color, backgroundColor: c.color + '20' }]}
                onPress={() => { setCategoryId(c.id); if (errorMsg) setErrorMsg(''); }}
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

              {/* Indicador de suma vs total */}
              {items.length > 0 && parsedTotal > 0 && (
                <View style={[styles.itemsIndicator, itemsOverBudget && styles.itemsIndicatorError]}>
                  <Text style={[styles.itemsIndicatorText, itemsOverBudget && styles.itemsIndicatorTextError]}>
                    {itemsOverBudget
                      ? `Excede el total por ${currency} ${(itemsSum - parsedTotal).toFixed(2)}`
                      : itemsDiff > 0.001
                      ? `Se agregará "Otros" por ${currency} ${itemsDiff.toFixed(2)}`
                      : `Artículos cubren el total completo`}
                  </Text>
                </View>
              )}

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
                    onChangeText={(v) => handleItemAmountChange(i, v)}
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
  dateBtn: {
    height: 48, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10,
    paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  dateBtnText: { fontSize: 16, color: '#111827' },
  dateBtnIcon: { fontSize: 18 },
  dateOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end',
  },
  dateSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  dateSheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  dateSheetTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  dateSheetDone: { fontSize: 16, color: '#4F46E5', fontWeight: '600' },
  catRow: { flexDirection: 'row', marginBottom: 4 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#E5E7EB', marginRight: 8,
  },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catText: { fontSize: 14, color: '#6B7280' },
  itemsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addItem: { fontSize: 14, color: '#4F46E5', fontWeight: '600', marginTop: 16 },
  itemsIndicator: {
    backgroundColor: '#EFF6FF', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8,
  },
  itemsIndicatorError: { backgroundColor: '#FEF2F2' },
  itemsIndicatorText: { fontSize: 13, color: '#2563EB', fontWeight: '500' },
  itemsIndicatorTextError: { color: '#DC2626' },
  itemRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  itemName: { flex: 1 },
  itemAmount: { width: 100 },
  removeItem: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  removeText: { fontSize: 16, color: '#EF4444' },
});
