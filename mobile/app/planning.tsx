import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Q } from '@nozbe/watermelondb';
import { database } from '../src/lib/watermelondb/database';
import CategoryModel from '../src/lib/watermelondb/models/Category';
import { useProjection, PlanVsReal } from '../src/hooks/useProjection';
import { useRecurring, RecurringTemplate } from '../src/hooks/useRecurring';
import { useAuth } from '../src/contexts/AuthContext';
import { categoryLabel } from '../src/lib/categoryName';
import { TransactionType } from '../src/types';

const MONTH_NAMES: Record<string, string[]> = {
  es: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
};

const TEMPLATE_TYPES: TransactionType[] = ['expense', 'income', 'saving'];

export default function PlanningScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, session } = useAuth();
  const { projection, planVsReal, templates, loading } = useProjection();
  const { addTemplate, updateTemplate, deleteTemplate } = useRecurring();

  const [categories, setCategories] = useState<CategoryModel[]>([]);

  // Form modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<RecurringTemplate | null>(null);
  const [formType, setFormType] = useState<TransactionType>('expense');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDay, setFormDay] = useState('1');
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const currency = profile?.currency ?? 'USD';
  const lang = profile?.language ?? 'es';

  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthName = (MONTH_NAMES[lang] ?? MONTH_NAMES['es'])[next.getMonth()];

  useEffect(() => {
    const sub = database.collections
      .get<CategoryModel>('categories')
      .query(Q.where('is_deleted', false))
      .observe()
      .subscribe((cats) => {
        setCategories(cats.sort((a, b) => a.name.localeCompare(b.name)));
      });
    return () => sub.unsubscribe();
  }, []);

  const formCategories = categories.filter((c) => c.type === formType);

  function openAdd() {
    setEditing(null);
    setFormType('expense');
    setFormCategoryId('');
    setFormAmount('');
    setFormDay('1');
    setFormActive(true);
    setModalVisible(true);
  }

  function openEdit(row: PlanVsReal) {
    setEditing(row.template);
    setFormType(row.template.type);
    setFormCategoryId(row.template.category_id);
    setFormAmount(String(row.template.amount));
    setFormDay(String(row.template.day_of_month));
    setFormActive(row.template.is_active);
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setEditing(null);
  }

  async function handleSave() {
    if (!session) return;
    if (!formCategoryId) {
      Alert.alert(t('common.error'), t('planning.select_category'));
      return;
    }
    const amount = parseFloat(formAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(t('common.error'), t('budget.invalid_amount'));
      return;
    }
    const day = Math.min(Math.max(parseInt(formDay, 10) || 1, 1), 31);

    // Evitar dos plantillas activas para la misma categoría+tipo
    const duplicate = templates.find((tp) =>
      tp.category_id === formCategoryId && tp.type === formType &&
      tp.is_active && tp.id !== editing?.id,
    );
    if (!editing && duplicate) {
      Alert.alert(t('common.error'), t('planning.duplicate_template'));
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateTemplate(editing.id, {
          amount, day_of_month: day, is_active: formActive, category_id: formCategoryId,
        });
      } else {
        await addTemplate(session.user.id, formCategoryId, formType, amount, day);
      }
      closeModal();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('common.error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editing) return;
    setSaving(true);
    try {
      await deleteTemplate(editing.id);
      closeModal();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('common.error'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.outer, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.back}>‹ {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('planning.title')}</Text>
        <TouchableOpacity onPress={openAdd} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.addBtn}>＋</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color="#4F46E5" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {/* Proyección próximo mes */}
          <View style={styles.projCard}>
            <Text style={styles.projTitle}>
              {t('planning.next_month')} · {nextMonthName}
            </Text>
            <Text
              style={[styles.projBalance, { color: projection.balance >= 0 ? '#111827' : '#EF4444' }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {projection.balance >= 0 ? '+' : '-'}{currency} {Math.abs(projection.balance).toFixed(2)}
            </Text>
            <View style={styles.projRow}>
              <ProjPill label={t('dashboard.total_income')} amount={projection.income} currency={currency} color="#10B981" />
              <View style={styles.projDivider} />
              <ProjPill label={t('dashboard.total_expenses')} amount={projection.expenses} currency={currency} color="#EF4444" />
              {projection.savings > 0 && (
                <>
                  <View style={styles.projDivider} />
                  <ProjPill label={t('planning.projected_savings')} amount={projection.savings} currency={currency} color="#0EA5E9" />
                </>
              )}
            </View>
            <Text style={styles.projHint}>{t('planning.projection_hint')}</Text>
          </View>

          {/* Plan vs real del mes actual */}
          {planVsReal.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('planning.plan_vs_real')}</Text>
              {planVsReal.map((row) => (
                <TemplateRow key={row.template.id} row={row} currency={currency} t={t} onPress={() => openEdit(row)} />
              ))}
            </View>
          )}

          {planVsReal.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔁</Text>
              <Text style={styles.emptyTitle}>{t('planning.no_templates')}</Text>
              <Text style={styles.emptyHint}>{t('planning.no_templates_hint')}</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={openAdd}>
                <Text style={styles.emptyBtnText}>{t('planning.add')}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Form modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {editing ? t('planning.edit_template') : t('planning.new_template')}
            </Text>

            {/* Tipo (solo al crear) */}
            {!editing && (
              <View style={styles.typeRow}>
                {TEMPLATE_TYPES.map((tp) => (
                  <TouchableOpacity
                    key={tp}
                    style={[styles.typeChip, formType === tp && styles.typeChipSelected]}
                    onPress={() => { setFormType(tp); setFormCategoryId(''); }}
                  >
                    <Text style={[styles.typeChipText, formType === tp && styles.typeChipTextSelected]}>
                      {t(`planning.type_${tp}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Categoría */}
            <Text style={styles.modalLabel}>{t('modal.category')}</Text>
            {formCategories.length === 0 ? (
              <Text style={styles.noCatsText}>{t('planning.no_categories_for_type')}</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                {formCategories.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.catChip, formCategoryId === c.id && { borderColor: c.color, backgroundColor: c.color + '20' }]}
                    onPress={() => setFormCategoryId(c.id)}
                  >
                    {c.icon ? <Text style={styles.catChipIcon}>{c.icon}</Text> : <View style={[styles.catDot, { backgroundColor: c.color }]} />}
                    <Text style={[styles.catChipText, formCategoryId === c.id && { color: c.color, fontWeight: '600' }]}>
                      {categoryLabel(c.name, t)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Monto estimado */}
            <Text style={styles.modalLabel}>{t('planning.amount_label')} ({currency})</Text>
            <TextInput
              style={styles.input}
              value={formAmount}
              onChangeText={setFormAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
            />

            {/* Día del mes */}
            <Text style={styles.modalLabel}>{t('planning.day_label')}</Text>
            <TextInput
              style={[styles.input, { width: 100 }]}
              value={formDay}
              onChangeText={(v) => setFormDay(v.replace(/[^0-9]/g, '').slice(0, 2))}
              keyboardType="number-pad"
              placeholder="1"
              placeholderTextColor="#9CA3AF"
            />

            {/* Activo (solo al editar) */}
            {editing && (
              <View style={styles.activeRow}>
                <Text style={styles.activeLabel}>{t('planning.active')}</Text>
                <Switch
                  value={formActive}
                  onValueChange={setFormActive}
                  trackColor={{ false: '#E5E7EB', true: '#C7D2FE' }}
                  thumbColor={formActive ? '#4F46E5' : '#9CA3AF'}
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t('common.save')}</Text>}
            </TouchableOpacity>

            {editing && (
              <TouchableOpacity style={[styles.removeBtn, saving && styles.saveBtnDisabled]} onPress={handleDelete} disabled={saving}>
                <Text style={styles.removeBtnText}>{t('planning.delete')}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
              <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function ProjPill({ label, amount, currency, color }: { label: string; amount: number; currency: string; color: string }) {
  return (
    <View style={styles.projPill}>
      <Text style={styles.projPillLabel}>{label}</Text>
      <Text style={[styles.projPillAmount, { color }]}>{currency} {amount.toFixed(2)}</Text>
    </View>
  );
}

interface TemplateRowProps {
  row: PlanVsReal;
  currency: string;
  t: (key: string, opts?: any) => string;
  onPress: () => void;
}

function TemplateRow({ row, currency, t, onPress }: TemplateRowProps) {
  const { template, actual, avg3m } = row;
  const estimated = template.amount;
  const pct = estimated > 0 ? Math.min((actual / estimated) * 100, 100) : 0;
  const over = template.type === 'expense' && actual > estimated;
  const barColor = over ? '#EF4444' : template.type === 'income' ? '#10B981' : template.type === 'saving' ? '#0EA5E9' : '#4F46E5';
  const color = row.category_color || '#9CA3AF';

  return (
    <TouchableOpacity style={rowStyles.wrap} onPress={onPress}>
      <View style={rowStyles.top}>
        <View style={rowStyles.left}>
          <View style={[rowStyles.iconWrap, { backgroundColor: color + '18' }]}>
            {row.category_icon ? (
              <Text style={rowStyles.icon}>{row.category_icon}</Text>
            ) : (
              <View style={[rowStyles.dot, { backgroundColor: color }]} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={rowStyles.name} numberOfLines={1}>
              {categoryLabel(row.category_name, t)}
              {!template.is_active ? `  · ${t('planning.paused')}` : ''}
            </Text>
            {avg3m !== null && (
              <Text style={rowStyles.avgText}>
                {t('planning.avg_3m')}: {currency} {avg3m.toFixed(2)}
              </Text>
            )}
          </View>
        </View>
        <View style={rowStyles.rightCol}>
          <Text style={[rowStyles.actual, over && rowStyles.overText]}>
            {currency} {actual.toFixed(2)}
          </Text>
          <Text style={rowStyles.estimated}>
            {over ? `${t('budget.over_budget')} · ` : ''}{t('budget.of')} {currency} {estimated.toFixed(2)}
          </Text>
        </View>
      </View>
      <View style={rowStyles.bar}>
        <View style={[rowStyles.fill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
      </View>
    </TouchableOpacity>
  );
}

const rowStyles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  top: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  iconWrap: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  icon: { fontSize: 15 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { fontSize: 14, color: '#374151', fontWeight: '500' },
  avgText: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  rightCol: { alignItems: 'flex-end', marginLeft: 8 },
  actual: { fontSize: 13, color: '#111827', fontWeight: '600' },
  overText: { color: '#EF4444' },
  estimated: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  bar: { height: 5, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
  fill: { height: 5, borderRadius: 3 },
});

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  back: { fontSize: 16, color: '#4F46E5', fontWeight: '500', width: 60 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  addBtn: { fontSize: 22, color: '#4F46E5', fontWeight: '600', width: 60, textAlign: 'right' },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 40 },

  projCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginTop: 4,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 4,
  },
  projTitle: { fontSize: 13, color: '#6B7280', marginBottom: 6 },
  projBalance: { fontSize: 34, fontWeight: '800', letterSpacing: -1, marginBottom: 16 },
  projRow: {
    flexDirection: 'row', width: '100%',
    backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, marginBottom: 10,
  },
  projPill: { flex: 1, alignItems: 'center', gap: 3 },
  projPillLabel: { fontSize: 11, color: '#9CA3AF' },
  projPillAmount: { fontSize: 14, fontWeight: '700' },
  projDivider: { width: 1, backgroundColor: '#E5E7EB', marginHorizontal: 8 },
  projHint: { fontSize: 11, color: '#C4B5FD', textAlign: 'center' },

  section: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 14 },

  empty: { alignItems: 'center', marginTop: 48, paddingHorizontal: 24 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 6, textAlign: 'center' },
  emptyHint: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 19, marginBottom: 20 },
  emptyBtn: {
    backgroundColor: '#4F46E5', borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: '#E5E7EB',
    borderRadius: 2, alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 8, marginTop: 12 },

  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  typeChipSelected: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  typeChipText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  typeChipTextSelected: { color: '#4F46E5', fontWeight: '700' },

  catScroll: { flexDirection: 'row', marginBottom: 4 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#E5E7EB', marginRight: 8,
  },
  catChipIcon: { fontSize: 14 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catChipText: { fontSize: 14, color: '#6B7280' },
  noCatsText: { fontSize: 13, color: '#9CA3AF', marginBottom: 4 },

  input: {
    height: 48, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10,
    paddingHorizontal: 14, fontSize: 16, color: '#111827',
  },

  activeRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 16,
  },
  activeLabel: { fontSize: 15, color: '#374151' },

  saveBtn: {
    height: 50, backgroundColor: '#4F46E5', borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginTop: 20, marginBottom: 10,
  },
  saveBtnDisabled: { backgroundColor: '#C7D2FE' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  removeBtn: {
    height: 46, backgroundColor: '#FFF1F2', borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
    borderWidth: 1, borderColor: '#FEE2E2',
  },
  removeBtnText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
  cancelBtn: { height: 46, justifyContent: 'center', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, color: '#9CA3AF' },
});
