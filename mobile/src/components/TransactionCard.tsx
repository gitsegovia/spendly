import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { categoryLabel } from '../lib/categoryName';
import { TransactionWithItems } from '../hooks/useTransactions';
import { ConfirmModal } from './ConfirmModal';

interface Props {
  transaction: TransactionWithItems;
  currency: string;
  onDelete: (id: string) => void;
}

export function TransactionCard({ transaction, currency, onDelete }: Props) {
  const { t } = useTranslation();
  const [showConfirm, setShowConfirm] = useState(false);
  const hasItems = transaction.items.length > 0;

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
    <TouchableOpacity onLongPress={() => setShowConfirm(true)} style={styles.card}>
      <View style={[styles.dot, { backgroundColor: transaction.category_color ?? '#6B7280' }]} />
      <View style={styles.info}>
        <Text style={styles.category}>{categoryLabel(transaction.category_name, t)}</Text>
        {transaction.notes ? <Text style={styles.notes}>{transaction.notes}</Text> : null}
        {hasItems && (
          <Text style={styles.items}>
            {t('transaction.items_count', { count: transaction.items.length })}
          </Text>
        )}
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>
          {currency} {Number(transaction.amount).toFixed(2)}
        </Text>
        <Text style={styles.date}>{transaction.date}</Text>
      </View>
    </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  info: { flex: 1 },
  category: { fontSize: 15, fontWeight: '600', color: '#111827' },
  notes: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  items: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  right: { alignItems: 'flex-end' },
  amount: { fontSize: 15, fontWeight: '700', color: '#111827' },
  date: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
});
