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
      {/* Hero card */}
      <View style={styles.heroCard}>
        <SkeletonLoader width={80} height={11} borderRadius={6} style={{ marginBottom: 6 }} />
        <SkeletonLoader width={60} height={13} borderRadius={6} style={{ marginBottom: 6 }} />
        <SkeletonLoader width={160} height={40} borderRadius={8} style={{ marginBottom: 20 }} />
        <View style={styles.heroPills}>
          <View style={styles.heroPill}>
            <SkeletonLoader width="70%" height={11} style={{ marginBottom: 6 }} />
            <SkeletonLoader width="90%" height={15} />
          </View>
          <View style={{ width: 1 }} />
          <View style={styles.heroPill}>
            <SkeletonLoader width="70%" height={11} style={{ marginBottom: 6 }} />
            <SkeletonLoader width="90%" height={15} />
          </View>
        </View>
      </View>
      {/* Category section */}
      <View style={styles.section}>
        <SkeletonLoader width="50%" height={14} style={{ marginBottom: 14 }} />
        {[1, 2, 3].map((i) => (
          <View key={i} style={{ marginBottom: 14 }}>
            <View style={styles.catRow}>
              <SkeletonLoader width={10} height={10} borderRadius={5} />
              <SkeletonLoader width="40%" height={13} />
              <SkeletonLoader width={72} height={12} />
            </View>
            <SkeletonLoader width="100%" height={5} borderRadius={3} style={{ marginTop: 5 }} />
          </View>
        ))}
      </View>
      {/* Recent transactions section */}
      <View style={styles.section}>
        <SkeletonLoader width="55%" height={14} style={{ marginBottom: 14 }} />
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.catRow, { paddingVertical: 10 }]}>
            <SkeletonLoader width={10} height={10} borderRadius={5} />
            <View style={{ flex: 1, gap: 5 }}>
              <SkeletonLoader width="45%" height={13} />
              <SkeletonLoader width="30%" height={11} />
            </View>
            <View style={{ alignItems: 'flex-end', gap: 5 }}>
              <SkeletonLoader width={72} height={13} />
              <SkeletonLoader width={36} height={11} />
            </View>
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
  heroCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20,
    alignItems: 'center', marginTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 4,
  },
  heroPills: {
    flexDirection: 'row', width: '100%',
    backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14,
  },
  heroPill: { flex: 1, alignItems: 'center', gap: 0 },
  section: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginTop: 12 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
