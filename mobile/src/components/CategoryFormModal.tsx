import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Modal, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Category, TransactionType } from '../types';

export const PRESET_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#10B981', '#06B6D4', '#3B82F6', '#6366F1',
  '#8B5CF6', '#EC4899', '#6B7280', '#14B8A6',
];

export const PRESET_ICONS = [
  '🍕', '🚗', '🏠', '💊', '🎮', '📚',
  '✈️', '💼', '🛒', '💡', '🏃', '🎵',
  '🐶', '🌿', '🎁', '☕', '🔧', '💸',
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, icon: string, color: string, type: TransactionType) => Promise<void>;
  editCategory?: Category | null;
  defaultType?: TransactionType;
}

export function CategoryFormModal({
  visible, onClose, onSave, editCategory, defaultType = 'expense',
}: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(PRESET_ICONS[0]);
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [type, setType] = useState<TransactionType>(defaultType);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    if (editCategory) {
      setName(editCategory.name);
      setIcon(editCategory.icon || PRESET_ICONS[0]);
      setColor(editCategory.color || PRESET_COLORS[0]);
      setType(editCategory.type);
    } else {
      setName('');
      setIcon(PRESET_ICONS[0]);
      setColor(PRESET_COLORS[0]);
      setType(defaultType);
    }
    setError('');
  }, [visible]);

  async function handleSave() {
    if (!name.trim()) { setError(t('categories_manage.name_required')); return; }
    setLoading(true);
    setError('');
    try {
      await onSave(name, icon, color, type);
      onClose();
    } catch (e: any) {
      setError(e.message ?? t('categories_manage.save_error'));
    } finally {
      setLoading(false);
    }
  }

  const isEditing = !!editCategory;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancel}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isEditing ? t('categories_manage.edit') : t('categories_manage.add')}
            </Text>
            <TouchableOpacity onPress={handleSave} disabled={loading}>
              <Text style={[styles.save, loading && styles.disabled]}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            {error ? <Text style={styles.errorMsg}>{error}</Text> : null}

            <Text style={styles.label}>{t('categories_manage.name')}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={(v) => { setName(v); setError(''); }}
              placeholder={t('categories_manage.name_placeholder')}
              placeholderTextColor="#9CA3AF"
              maxLength={30}
              autoFocus={!isEditing}
            />

            {!isEditing && (
              <>
                <Text style={styles.label}>{t('categories_manage.type')}</Text>
                <View style={styles.typeRow}>
                  <TouchableOpacity
                    style={[styles.typeChip, type === 'expense' && styles.typeExpenseActive]}
                    onPress={() => setType('expense')}
                  >
                    <Text style={[styles.typeChipText, type === 'expense' && styles.typeExpenseText]}>
                      {t('categories_manage.type_expense')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeChip, type === 'income' && styles.typeIncomeActive]}
                    onPress={() => setType('income')}
                  >
                    <Text style={[styles.typeChipText, type === 'income' && styles.typeIncomeText]}>
                      {t('categories_manage.type_income')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeChip, type === 'saving' && styles.typeSavingActive]}
                    onPress={() => setType('saving')}
                  >
                    <Text style={[styles.typeChipText, type === 'saving' && styles.typeSavingText]}>
                      {t('categories_manage.type_saving')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <Text style={styles.label}>{t('categories_manage.color')}</Text>
            <View style={styles.colorGrid}>
              {PRESET_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotSelected]}
                  onPress={() => setColor(c)}
                >
                  {color === c && <Text style={styles.colorCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>{t('categories_manage.icon')}</Text>
            <View style={styles.iconGrid}>
              {PRESET_ICONS.map((ic) => (
                <TouchableOpacity
                  key={ic}
                  style={[styles.iconChip, icon === ic && { borderColor: color, backgroundColor: color + '22' }]}
                  onPress={() => setIcon(ic)}
                >
                  <Text style={styles.iconEmoji}>{ic}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>{t('categories_manage.preview')}</Text>
            <View style={styles.previewRow}>
              <View style={[styles.previewIconWrap, { backgroundColor: color + '18' }]}>
                {icon ? (
                  <Text style={styles.previewIcon}>{icon}</Text>
                ) : (
                  <View style={[styles.previewDot, { backgroundColor: color }]} />
                )}
              </View>
              <Text style={styles.previewName} numberOfLines={1}>
                {name.trim() || t('categories_manage.name_placeholder')}
              </Text>
              <View style={[styles.previewColorSwatch, { backgroundColor: color }]} />
            </View>

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
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  cancel: { fontSize: 16, color: '#6B7280' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#111827' },
  save: { fontSize: 16, color: '#4F46E5', fontWeight: '600' },
  disabled: { opacity: 0.4 },

  body: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  errorMsg: { fontSize: 13, color: '#EF4444', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 20, marginBottom: 10 },

  input: {
    height: 48, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10,
    paddingHorizontal: 14, fontSize: 16, color: '#111827',
  },

  typeRow: { flexDirection: 'row', gap: 10 },
  typeChip: {
    flex: 1, height: 42, borderRadius: 10, borderWidth: 1.5,
    borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center',
  },
  typeChipText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  typeExpenseActive: { borderColor: '#EF4444', backgroundColor: '#FFF1F2' },
  typeExpenseText: { color: '#EF4444', fontWeight: '700' },
  typeIncomeActive: { borderColor: '#10B981', backgroundColor: '#F0FDF4' },
  typeIncomeText: { color: '#10B981', fontWeight: '700' },
  typeSavingActive: { borderColor: '#0EA5E9', backgroundColor: '#F0F9FF' },
  typeSavingText: { color: '#0EA5E9', fontWeight: '700' },

  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorDot: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  colorDotSelected: { borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  colorCheck: { fontSize: 16, color: '#fff', fontWeight: '700' },

  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconChip: {
    width: 48, height: 48, borderRadius: 12, borderWidth: 1.5,
    borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center',
  },
  iconEmoji: { fontSize: 24 },

  previewRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14,
  },
  previewIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  previewIcon: { fontSize: 22 },
  previewDot: { width: 14, height: 14, borderRadius: 7 },
  previewName: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1 },
  previewColorSwatch: { width: 18, height: 18, borderRadius: 9, flexShrink: 0 },
});
