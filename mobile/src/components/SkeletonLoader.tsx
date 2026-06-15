import { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';

interface Props {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLoader({ width = '100%', height = 16, borderRadius = 8, style }: Props) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.base,
        { width: width as any, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function TransactionSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonLoader width={12} height={12} borderRadius={6} />
      <View style={styles.info}>
        <SkeletonLoader width="50%" height={14} />
        <SkeletonLoader width="35%" height={11} style={{ marginTop: 6 }} />
      </View>
      <View style={styles.right}>
        <SkeletonLoader width={72} height={14} />
        <SkeletonLoader width={48} height={11} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

export function DashboardSkeleton() {
  return (
    <>
      {/* Balance card */}
      <View style={styles.balanceCard}>
        <SkeletonLoader width={80} height={13} style={{ marginBottom: 10 }} />
        <SkeletonLoader width={140} height={36} borderRadius={8} />
      </View>
      {/* Summary row */}
      <View style={styles.row}>
        <View style={[styles.summaryCard, { backgroundColor: '#F0FDF4' }]}>
          <SkeletonLoader width="60%" height={12} style={{ marginBottom: 8 }} />
          <SkeletonLoader width="80%" height={20} />
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#FFF1F2' }]}>
          <SkeletonLoader width="60%" height={12} style={{ marginBottom: 8 }} />
          <SkeletonLoader width="80%" height={20} />
        </View>
      </View>
      {/* Category rows */}
      <View style={styles.section}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.catRow}>
            <SkeletonLoader width={10} height={10} borderRadius={5} />
            <SkeletonLoader width="45%" height={13} />
            <SkeletonLoader width={60} height={13} />
            <SkeletonLoader width={28} height={11} />
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: '#E5E7EB' },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginBottom: 8, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  info: { flex: 1, gap: 0 },
  right: { alignItems: 'flex-end' },
  balanceCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24,
    alignItems: 'center', marginVertical: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 16 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 4, gap: 16 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
