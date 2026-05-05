
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../lib/theme';
import { useStore } from '../store/useStore';
import StarRating from './StarRating';

interface Props {
  onBack: () => void;
}

export default function StatsScreen({ onBack }: Props) {
  const books = useStore((s) => s.books);

  const stats = useMemo(() => {
    const finished = books.filter((b) => b.status === 'finished');
    const thisYear = new Date().getFullYear();
    const thisYearFinished = finished.filter(
      (b) => new Date(b.date_added).getFullYear() === thisYear
    );

    const ratedBooks = finished.filter((b) => b.rating);
    const avgRating = ratedBooks.length
      ? (ratedBooks.reduce((sum, b) => sum + (b.rating || 0), 0) / ratedBooks.length).toFixed(1)
      : null;

    const topBook = ratedBooks.sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];

    return {
      total: books.length,
      finished: finished.length,
      thisYearFinished: thisYearFinished.length,
      avgRating,
      toRead: books.filter((b) => b.status === 'to_read').length,
      reading: books.filter((b) => b.status === 'reading').length,
      topBook,
    };
  }, [books]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Wróć</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Statystyki</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Big Stats */}
        <View style={styles.statsGrid}>
          <StatCard icon="📚" label="Wszystkich" value={stats.total} color={COLORS.blue} />
          <StatCard icon="✅" label="Przeczytanych" value={stats.finished} color={COLORS.green} />
          <StatCard icon="📅" label="W tym roku" value={stats.thisYearFinished} color={COLORS.accent} />
          <StatCard
            icon="⭐"
            label="Średnia ocena"
            value={stats.avgRating ? `${stats.avgRating}/5` : '—'}
            color={COLORS.accent}
          />
        </View>

        {/* Status Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Podział wg statusu</Text>
          <StatusBar label="Chcę przeczytać" count={stats.toRead} total={stats.total} color={COLORS.blue} />
          <StatusBar label="Czytam" count={stats.reading} total={stats.total} color={COLORS.accent} />
          <StatusBar label="Przeczytane" count={stats.finished} total={stats.total} color={COLORS.green} />
        </View>

        {/* Top Book */}
        {stats.topBook && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🏆 Najwyżej oceniona</Text>
            <Text style={styles.topTitle}>{stats.topBook.title}</Text>
            <Text style={styles.topAuthor}>{stats.topBook.author}</Text>
            <View style={styles.topRatingRow}>
              <StarRating rating={stats.topBook.rating || 0} size={22} />
              <Text style={styles.topRatingNum}>{stats.topBook.rating}/5</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <View style={[statCardStyles.card, { borderColor: color + '44' }]}>
      <Text style={statCardStyles.icon}>{icon}</Text>
      <Text style={[statCardStyles.value, { color }]}>{value}</Text>
      <Text style={statCardStyles.label}>{label}</Text>
    </View>
  );
}

const statCardStyles = StyleSheet.create({
  card: {
    width: '47%', backgroundColor: COLORS.card, borderRadius: 16,
    padding: 16, alignItems: 'center', borderWidth: 1,
  },
  icon: { fontSize: 28, marginBottom: 8 },
  value: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  label: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' },
});

function StatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <View style={barStyles.row}>
      <View style={barStyles.labelRow}>
        <Text style={barStyles.label}>{label}</Text>
        <Text style={[barStyles.count, { color }]}>{count}</Text>
      </View>
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const barStyles = StyleSheet.create({
  row: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: COLORS.textSecondary, fontSize: 14 },
  count: { fontWeight: '700', fontSize: 14 },
  track: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 8 },
  backText: { color: COLORS.accent, fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  content: { padding: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  card: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 18,
    marginBottom: 14, borderWidth: 1, borderColor: COLORS.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 14 },
  topTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  topAuthor: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 12 },
  topRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topRatingNum: { color: COLORS.accent, fontWeight: '700', fontSize: 16 },
});
