import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCategories } from '../src/hooks/useCategories';
import { CategoryFormModal } from '../src/components/CategoryFormModal';
import { ConfirmModal } from '../src/components/ConfirmModal';
import { categoryLabel } from '../src/lib/categoryName';
import { Category, TransactionType } from '../src/types';

export default function CategoriesScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { categories, loading, addCategory, updateCategory, deleteCategory } = useCategories();

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [defaultType, setDefaultType] = useState<TransactionType>('expense');
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const expenses = categories.filter((c) => c.type === 'expense');
  const incomes = categories.filter((c) => c.type === 'income');
  const savings = categories.filter((c) => c.type === 'saving');

  function openAdd(type: TransactionType) {
    setEditTarget(null);
    setDefaultType(type);
    setShowForm(true);
  }

  function openEdit(cat: Category) {
    setEditTarget(cat);
    setShowForm(true);
  }

  async function handleSave(name: string, icon: string, color: string, type: TransactionType) {
    if (editTarget) {
      await updateCategory(editTarget.id, name, icon, color);
    } else {
      await addCategory(name, icon, color, type);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteCategory(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('categories_manage.title')}</Text>
        <View style={{ width: 64 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#4F46E5" />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <CategorySection
            title={t('categories_manage.expense_section')}
            categories={expenses}
            accentColor="#EF4444"
            onAdd={() => openAdd('expense')}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
            t={t}
          />
          <CategorySection
            title={t('categories_manage.income_section')}
            categories={incomes}
            accentColor="#10B981"
            onAdd={() => openAdd('income')}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
            t={t}
          />
          <CategorySection
            title={t('categories_manage.saving_section')}
            categories={savings}
            accentColor="#0EA5E9"
            onAdd={() => openAdd('saving')}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
            t={t}
          />
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      <CategoryFormModal
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleSave}
        editCategory={editTarget}
        defaultType={defaultType}
      />

      <ConfirmModal
        visible={!!deleteTarget}
        title={t('categories_manage.delete_title')}
        message={t('categories_manage.delete_message')}
        confirmLabel={t('common.delete')}
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}

interface SectionProps {
  title: string;
  categories: Category[];
  accentColor: string;
  onAdd: () => void;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
  t: (key: string) => string;
}

function CategorySection({ title, categories, accentColor, onAdd, onEdit, onDelete, t }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleWrap}>
          <Text style={[styles.sectionTitle, { color: accentColor }]}>{title.toUpperCase()}</Text>
          <Text style={styles.sectionCount}>{categories.length}</Text>
        </View>
        <TouchableOpacity style={[styles.addChip, { borderColor: accentColor }]} onPress={onAdd}>
          <Text style={[styles.addChipText, { color: accentColor }]}>+ {t('categories_manage.add_short')}</Text>
        </TouchableOpacity>
      </View>

      {categories.length === 0 ? (
        <View style={styles.emptySection}>
          <Text style={styles.emptyText}>{t('categories_manage.empty_section')}</Text>
        </View>
      ) : (
        categories.map((cat) => (
          <View key={cat.id} style={styles.row}>
            {/* Unified icon/dot in rounded square — matches TransactionCard */}
            {cat.icon ? (
              <View style={[styles.iconWrap, { backgroundColor: cat.color + '18' }]}>
                <Text style={styles.iconText}>{cat.icon}</Text>
              </View>
            ) : (
              <View style={[styles.iconWrap, { backgroundColor: cat.color + '18' }]}>
                <View style={[styles.dot, { backgroundColor: cat.color }]} />
              </View>
            )}

            <Text style={styles.catName} numberOfLines={1}>{categoryLabel(cat.name, t)}</Text>

            {cat.is_default && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>{t('categories_manage.default_badge')}</Text>
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity onPress={() => onEdit(cat)} style={styles.actionBtn}>
                <Text style={styles.editIcon}>✏️</Text>
              </TouchableOpacity>
              {cat.is_default ? (
                <View style={styles.actionBtn}>
                  <Text style={styles.lockIcon}>🔒</Text>
                </View>
              ) : (
                <TouchableOpacity onPress={() => onDelete(cat)} style={styles.actionBtn}>
                  <Text style={styles.deleteIcon}>🗑</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    backgroundColor: '#fff',
  },
  backBtn: { width: 64 },
  backText: { fontSize: 16, color: '#4F46E5', fontWeight: '500' },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },

  content: { padding: 20 },

  section: {
    backgroundColor: '#fff', borderRadius: 14, marginBottom: 16,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  sectionCount: {
    fontSize: 11, fontWeight: '600', color: '#9CA3AF',
    backgroundColor: '#F3F4F6', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10,
  },
  addChip: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, borderWidth: 1.5,
  },
  addChipText: { fontSize: 13, fontWeight: '600' },

  emptySection: {
    paddingVertical: 16, alignItems: 'center',
  },
  emptyText: { fontSize: 13, color: '#9CA3AF' },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F9FAFB',
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  iconText: { fontSize: 20 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  catName: { flex: 1, fontSize: 15, color: '#111827' },

  defaultBadge: {
    backgroundColor: '#F3F4F6', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  defaultBadgeText: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },

  actions: { flexDirection: 'row', gap: 4 },
  actionBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  editIcon: { fontSize: 17 },
  deleteIcon: { fontSize: 16 },
  lockIcon: { fontSize: 14, opacity: 0.4 },
});
