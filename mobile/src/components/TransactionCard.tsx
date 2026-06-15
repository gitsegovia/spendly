import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { categoryLabel } from '../lib/categoryName';
import { formatDate } from '../lib/dateFormat';
import { TransactionWithItems } from '../hooks/useTransactions';
import { ConfirmModal } from './ConfirmModal';

interface Props {
  transaction: TransactionWithItems;
  currency: string;
  onDelete: (id: string) => void;
  onEdit: (transaction: TransactionWithItems) => void;
}

export function TransactionCard({ transaction, currency, onDelete, onEdit }: Props) {
  const { t, i18n } = useTranslation();
  const [showConfirm, setShowConfirm] = useState(false);
  const hasItems = transaction.items.length > 0;
  const isExpense = transaction.type === 'expense';
  const amountColor = isExpense ? '#EF4444' : '#10B981';
  const amountPrefix = isExpense ? '-' : '+';

  return (
    <>
      <ConfirmModal
        visible={showConfirm}
        title={t('transaction.delete_title')}
        message={t('transaction.delete_message')}
        confirmLabel={t('transaction.delete_confirm')}
        destructive
        onConfirm={() => { setShowConfirm(false); onDelete(transaction.id); }}
        onCancel={() => setShowConfirm(false)}
      />
      <TouchableOpacity
        onPress={() => onEdit(transaction)}
        onLongPress={() => setShowConfirm(true)}
        style={styles.card}
        activeOpacity={0.75}
      >
        {/* Category icon or colored dot */}
        {transaction.category_icon ? (
          <View style={[styles.iconWrap, { backgroundColor: (transaction.category_color ?? '#6B7280') + '18' }]}>
            <Text style={styles.icon}>{transaction.category_icon}</Text>
          </View>
        ) : (
          <View style={[styles.dotWrap, { backgroundColor: (transaction.category_color ?? '#6B7280') + '18' }]}>
            <View style={[styles.dot, { backgroundColor: transaction.category_color ?? '#6B7280' }]} />
          </View>
        )}

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.category} numberOfLines={1}>
            {categoryLabel(transaction.category_name ?? '', t)}
          </Text>
          {transaction.notes ? (
            <Text style={styles.notes} numberOfLines={1}>{transaction.notes}</Text>
          ) : null}
          {hasItems && (
            <Text style={styles.items}>
              {t('transaction.items_count', { count: transaction.items.length })}
            </Text>
          )}
        </View>

        {/* Amount + date */}
        <View style={styles.right}>
          <Text style={[styles.amount, { color: amountColor }]}>
            {amountPrefix}{currency} {Number(transaction.amount).toFixed(2)}
          </Text>
          <Text style={styles.date}>{formatDate(transaction.date, i18n.language)}</Text>
        </View>

        {/* Edit chevron */}
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 10,
  },
  iconWrap: {
    width: 42, height: 42, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  icon: { fontSize: 20 },
  dotWrap: {
    width: 42, height: 42, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  info: { flex: 1 },
  category: { fontSize: 15, fontWeight: '600', color: '#111827' },
  notes: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  items: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  right: { alignItems: 'flex-end' },
  amount: { fontSize: 15, fontWeight: '700' },
  date: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  chevron: { fontSize: 20, color: '#D1D5DB', marginLeft: 2 },
});
