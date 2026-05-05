
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { COLORS } from '../lib/theme';
import { useStore } from '../store/useStore';
import { Book, BookStatus } from '../types';
import BookCard from './BookCard';

interface Props {
  onAddBook: () => void;
  onBookPress: (book: Book) => void;
  onStats: () => void;
  onFollowing: () => void;
  onDiscover: () => void;
  onLogout: () => void;
}

const STATUS_FILTERS: Array<{ key: BookStatus | 'all'; label: string }> = [
  { key: 'all', label: 'Wszystkie' },
  { key: 'to_read', label: 'Chcę' },
  { key: 'reading', label: 'Czytam' },
  { key: 'finished', label: 'Przeczytane' },
];

export default function MyBooksScreen({ onAddBook, onBookPress, onStats, onFollowing, onDiscover, onLogout }: Props) {
  const currentUser = useStore((s) => s.currentUser);
  const books = useStore((s) => s.books);
  const setBooks = useStore((s) => s.setBooks);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookStatus | 'all'>('all');

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    if (!currentUser) return;
    setLoading(true);
    const { data } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('date_added', { ascending: false });
    setBooks(data || []);
    setLoading(false);
  };

  const thisYearFinished = useMemo(() => {
    const thisYear = new Date().getFullYear();
    return books.filter((b) => {
      if (b.status !== 'finished') return false;
      const date = b.date_finished || b.date_added;
      return new Date(date).getFullYear() === thisYear;
    }).length;
  }, [books]);

  const filteredBooks = useMemo(() => {
    return books
      .filter((b) => statusFilter === 'all' || b.status === statusFilter)
      .filter((b) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
      });
  }, [books, statusFilter, search]);

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Cześć, {currentUser?.username}!</Text>
          <Text style={styles.yearCounter}>
            W tym roku: <Text style={styles.yearNum}>{thisYearFinished}</Text> przeczytanych
          </Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Wyloguj</Text>
        </TouchableOpacity>
      </View>

      {/* Nav Actions — 3 przyciski */}
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.navBtn} onPress={onDiscover}>
          <Text style={styles.navBtnText}>Odkrywaj</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={onStats}>
          <Text style={styles.navBtnText}>Statystyki</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={onFollowing}>
          <Text style={styles.navBtnText}>Obserwowani</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Szukaj po tytule lub autorze..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Status Filter */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, statusFilter === f.key && styles.filterBtnActive]}
            onPress={() => setStatusFilter(f.key)}
          >
            <Text style={[styles.filterText, statusFilter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Book List */}
      {loading ? (
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filteredBooks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BookCard book={item} onPress={() => onBookPress(item)} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📚</Text>
              <Text style={styles.emptyTitle}>Brak książek</Text>
              <Text style={styles.emptyText}>
                {search
                  ? 'Nic nie pasuje do Twojego wyszukiwania'
                  : 'Dodaj pierwszą książkę lub zajrzyj do Odkrywaj!'}
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={onAddBook}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12,
  },
  greeting: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  yearCounter: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  yearNum: { color: COLORS.accent, fontWeight: '700' },
  logoutBtn: {
    backgroundColor: COLORS.surface, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: COLORS.border,
  },
  logoutText: { color: COLORS.textSecondary, fontSize: 13 },
  navRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  navBtn: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: 12, padding: 10,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  navBtnText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  searchRow: { paddingHorizontal: 16, marginBottom: 10 },
  searchInput: {
    backgroundColor: COLORS.surface, color: COLORS.textPrimary,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 12,
    padding: 12, fontSize: 14,
  },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 14 },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
  },
  filterBtnActive: { backgroundColor: COLORS.accentSoft, borderColor: COLORS.accent },
  filterText: { color: COLORS.textSecondary, fontSize: 13 },
  filterTextActive: { color: COLORS.accent, fontWeight: '700' },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
  fab: {
    position: 'absolute', right: 20, bottom: 32,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.accent, shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabText: { fontSize: 30, color: COLORS.bg, fontWeight: '300', marginTop: -2 },
});
