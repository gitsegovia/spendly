import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Modal, ScrollView, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import i18n from '../lib/i18n';
import { categoryLabel } from '../lib/categoryName';
import { Category, TransactionType } from '../types';
import { AppMessage } from './AppMessage';

interface Item { name: string; amount: string; quantity: string; }

interface InitialValues {
  id: string;
  categoryId: string;
  amount: number;
  date: string;
  notes: string;
  items: { name: string; amount: number; quantity: number }[];
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (
    categoryId: string,
    amount: number,
    date: string,
    notes: string,
    items: { name: string; amount: number; quantity: number }[],
    recurring?: boolean
  ) => Promise<void>;
  onUpdate?: (
    id: string,
    categoryId: string,
    amount: number,
    date: string,
    notes: string,
    items: { name: string; amount: number; quantity: number }[]
  ) => Promise<void>;
  initialValues?: InitialValues;
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
  const locale = i18n.language === 'es' ? 'es-ES' : 'en-US';
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

export function AddTransactionModal({ visible, onClose, onSave, onUpdate, initialValues, categories, type, currency }: Props) {
  const { t } = useTranslation();
  const isEditing = !!initialValues;

  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [recurring, setRecurring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Pre-llena el formulario cuando se abre en modo edición
  useEffect(() => {
    if (visible && initialValues) {
      setCategoryId(initialValues.categoryId);
      setAmount(String(initialValues.amount));
      setNotes(initialValues.notes ?? '');
      const d = new Date(initialValues.date + 'T12:00:00');
      setSelectedDate(d);
      setDate(initialValues.date);
      setItems(initialValues.items.map((i) => ({
        name: i.name,
        amount: String(i.amount),
        quantity: String(i.quantity),
      })));
      setErrorMsg('');
    } else if (visible && !initialValues) {
      reset();
    }
  }, [visible, initialValues?.id]);

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
    setRecurring(false);
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
    if (!categoryId) return setErrorMsg(t('modal.select_category'));
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return setErrorMsg(t('modal.invalid_amount'));

    const parsedItems = namedItems.map((i) => ({
      name: i.name.trim(),
      amount: parseFloat(i.amount) || 0,
      quantity: parseFloat(i.quantity) || 1,
    }));

    const total = parsedItems.reduce((sum, i) => sum + i.amount * i.quantity, 0);

    if (total > parsedAmount + 0.001) {
      return setErrorMsg(t('modal.items_over_total', { currency, total: total.toFixed(2) }));
    }

    // Si hay artículos y hay diferencia, crear item "Otros" con el resto
    if (parsedItems.length > 0 && itemsDiff > 0.001) {
      parsedItems.push({ name: t('modal.item_others'), amount: itemsDiff, quantity: 1 });
    }

    try {
      setLoading(true);
      setErrorMsg('');
      if (isEditing && onUpdate && initialValues) {
        await onUpdate(initialValues.id, categoryId, parsedAmount, date, notes, parsedItems);
      } else {
        await onSave(categoryId, parsedAmount, date, notes, parsedItems, recurring);
      }
      reset();
      onClose();
    } catch (e: any) {
      setErrorMsg(e.message ?? t('modal.save_error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { reset(); onClose(); }}>
            <Text style={styles.cancel}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {isEditing
              ? t('common.edit')
              : type === 'expense' ? t('modal.new_expense')
              : type === 'saving' ? t('modal.new_saving')
              : t('modal.new_income')}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text style={[styles.save, loading && styles.disabled]}>{t('common.save')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
          <AppMessage message={errorMsg} type="error" />

          {/* Monto */}
          <Text style={styles.label}>{t('modal.amount')} ({currency})</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#9CA3AF"
            value={amount}
            onChangeText={handleAmountChange}
            keyboardType="decimal-pad"
          />

          {/* Fecha */}
          <Text style={styles.label}>{t('modal.date')}</Text>
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
                    <Text style={styles.dateSheetTitle}>{t('modal.date_picker_title')}</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.dateSheetDone}>{t('modal.date_picker_done')}</Text>
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
          <Text style={styles.label}>{t('modal.category')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.catChip, categoryId === c.id && { borderColor: c.color, backgroundColor: c.color + '20' }]}
                onPress={() => { setCategoryId(c.id); if (errorMsg) setErrorMsg(''); }}
              >
                <View style={[styles.catDot, { backgroundColor: c.color }]} />
                <Text style={[styles.catText, categoryId === c.id && { color: c.color, fontWeight: '600' }]}>
                  {categoryLabel(c.name, t)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Recurrente (solo al crear) */}
          {!isEditing && (
            <View style={styles.recurringRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.recurringLabel}>{t('modal.recurring_toggle')}</Text>
                <Text style={styles.recurringHint}>{t('modal.recurring_hint')}</Text>
              </View>
              <Switch
                value={recurring}
                onValueChange={setRecurring}
                trackColor={{ false: '#E5E7EB', true: '#C7D2FE' }}
                thumbColor={recurring ? '#4F46E5' : '#9CA3AF'}
              />
            </View>
          )}

          {/* Notas */}
          <Text style={styles.label}>{t('modal.notes_optional')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('modal.notes_placeholder')}
            placeholderTextColor="#9CA3AF"
            value={notes}
            onChangeText={setNotes}
          />

          {/* Artículos (solo para gastos) */}
          {type === 'expense' && (
            <>
              <View style={styles.itemsHeader}>
                <Text style={styles.label}>{t('modal.items_optional')}</Text>
                <TouchableOpacity onPress={addItem}>
                  <Text style={styles.addItem}>{t('modal.add_item')}</Text>
                </TouchableOpacity>
              </View>

              {/* Indicador de suma vs total */}
              {items.length > 0 && parsedTotal > 0 && (
                <View style={[styles.itemsIndicator, itemsOverBudget && styles.itemsIndicatorError]}>
                  <Text style={[styles.itemsIndicatorText, itemsOverBudget && styles.itemsIndicatorTextError]}>
                    {itemsOverBudget
                      ? t('modal.items_over_budget', { currency, amount: (itemsSum - parsedTotal).toFixed(2) })
                      : itemsDiff > 0.001
                      ? t('modal.items_others', { currency, amount: itemsDiff.toFixed(2) })
                      : t('modal.items_covered')}
                  </Text>
                </View>
              )}

              {items.map((item, i) => (
                <View key={i} style={styles.itemRow}>
                  <TextInput
                    style={[styles.input, styles.itemName]}
                    placeholder={t('modal.item_name')}
                    placeholderTextColor="#9CA3AF"
                    value={item.name}
                    onChangeText={(v) => updateItem(i, 'name', v)}
                  />
                  <TextInput
                    style={[styles.input, styles.itemAmount]}
                    placeholder={t('modal.item_amount')}
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
      </SafeAreaView>
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
  recurringRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16,
    backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
  },
  recurringLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  recurringHint: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
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
