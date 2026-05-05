
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { COLORS } from '../lib/theme';
import { useStore } from '../store/useStore';
import StarRating from './StarRating';

interface Props {
  onBack: () => void;
}

interface DiscoverBook {
  title: string;
  author: string;
  avgRating: number | null;
  readersCount: number;
  readers: ReaderEntry[];
}

interface ReaderEntry {
  user_id: string;
  username: string;
  rating?: number;
  date_finished?: string;
  notes?: string;
}

export default function DiscoverScreen({ onBack }: Props) {
  const currentUser = useStore((s) => s.currentUser);
  const addBook = useStore((s) => s.addBook);

  const [books, setBooks] = useState<DiscoverBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBook, setSelectedBook] = useState<DiscoverBook | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [addingBook, setAddingBook] = useState(false);

  useEffect(() => {
    loadDiscoverBooks();
    loadFollowedIds();
  }, []);

  const loadDiscoverBooks = async () => {
    setLoading(true);

    const { data: booksData, error } = await supabase
      .from('books')
      .select('title, author, rating, date_finished, user_id, notes')
      .eq('status', 'finished')
      .neq('user_id', currentUser?.id ?? '');

    if (error || !booksData || booksData.length === 0) {
      setBooks([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(booksData.map((b) => b.user_id))];
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', userIds);

    const profileMap: Record<string, string> = {};
    (profilesData || []).forEach((p) => {
      profileMap[p.id] = p.username;
    });

    const bookMap: Record<string, DiscoverBook> = {};
    booksData.forEach((row) => {
      const key = `${row.title}|||${row.author}`;
      if (!bookMap[key]) {
        bookMap[key] = {
          title: row.title,
          author: row.author,
          avgRating: null,
          readersCount: 0,
          readers: [],
        };
      }
      bookMap[key].readers.push({
        user_id: row.user_id,
        username: profileMap[row.user_id] ?? row.user_id.slice(0, 8),
        rating: row.rating ?? undefined,
        date_finished: row.date_finished ?? undefined,
        notes: row.notes ?? undefined,
      });
      bookMap[key].readersCount++;
    });

    Object.values(bookMap).forEach((b) => {
      const rated = b.readers.filter((r) => r.rating);
      if (rated.length > 0) {
        b.avgRating = parseFloat(
          (rated.reduce((s, r) => s + (r.rating || 0), 0) / rated.length).toFixed(1)
        );
      }
    });

    const sorted = Object.values(bookMap).sort((a, b) => b.readersCount - a.readersCount);
    setBooks(sorted);
    setLoading(false);
  };

  const loadFollowedIds = async () => {
    if (!currentUser) return;
    const { data } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', currentUser.id);
    setFollowedIds((data || []).map((r) => r.following_id));
  };

  const handleFollow = async (userId: string) => {
    if (!currentUser) return;
    if (followedIds.includes(userId)) {
      await supabase.from('user_follows').delete()
        .eq('follower_id', currentUser.id).eq('following_id', userId);
      setFollowedIds((prev) => prev.filter((id) => id !== userId));
    } else {
      await supabase.from('user_follows').insert({
        follower_id: currentUser.id,
        following_id: userId,
      });
      setFollowedIds((prev) => [...prev, userId]);
    }
  };

  const handleAddToMyList = async (book: DiscoverBook) => {
    if (!currentUser) return;
    setAddingBook(true);
    const { data, error } = await supabase
      .from('books')
      .insert({
        user_id: currentUser.id,
        title: book.title,
        author: book.author,
        status: 'to_read',
      })
      .select()
      .single();
    setAddingBook(false);
    if (!error && data) {
      addBook(data);
      Alert.alert('Dodano! 📚', `"${book.title}" trafiła na Twoją listę jako "Chcę przeczytać"`);
      setModalVisible(false);
    } else if (error) {
      Alert.alert('Błąd', error.message);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return books;
    const q = search.toLowerCase();
    return books.filter(
      (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
    );
  }, [books, search]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Wróć</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Odkrywaj 🔍</Text>
        <View style={{ width: 60 }} />
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Szukaj książki lub autora..."
        placeholderTextColor={COLORS.textMuted}
        value={search}
        onChangeText={setSearch}
      />

      {loading ? (
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => `${item.title}${item.author}`}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.bookCard}
              onPress={() => { setSelectedBook(item); setModalVisible(true); }}
              activeOpacity={0.85}
            >
              <View style={styles.bookLeft}>
                <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.bookAuthor}>{item.author}</Text>
                <View style={styles.bookMeta}>
                  <Text style={styles.readersChip}>
                    👥 {item.readersCount} {item.readersCount === 1 ? 'czytelnik' : 'czytelników'}
                  </Text>
                  {item.avgRating && (
                    <Text style={styles.ratingChip}>⭐ {item.avgRating}/5</Text>
                  )}
                </View>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔭</Text>
              <Text style={styles.emptyTitle}>Brak wyników</Text>
              <Text style={styles.emptyText}>
                {search ? 'Spróbuj innej frazy' : 'Inni użytkownicy jeszcze nic nie przeczytali'}
              </Text>
            </View>
          }
        />
      )}

      {/* Modal szczegółów książki */}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.backText}>← Zamknij</Text>
            </TouchableOpacity>
            <View style={{ width: 60 }} />
          </View>

          {selectedBook && (
            <FlatList
              data={selectedBook.readers}
              keyExtractor={(item, i) => i.toString()}
              ListHeaderComponent={
                <View style={styles.modalBookInfo}>
                  <Text style={styles.modalTitle}>{selectedBook.title}</Text>
                  <Text style={styles.modalAuthor}>{selectedBook.author}</Text>

                  <View style={styles.modalStats}>
                    <View style={styles.modalStat}>
                      <Text style={styles.modalStatNum}>{selectedBook.readersCount}</Text>
                      <Text style={styles.modalStatLabel}>czytelników</Text>
                    </View>
                    {selectedBook.avgRating && (
                      <View style={styles.modalStat}>
                        <Text style={styles.modalStatNum}>{selectedBook.avgRating}</Text>
                        <Text style={styles.modalStatLabel}>śr. ocena</Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => handleAddToMyList(selectedBook)}
                    disabled={addingBook}
                  >
                    {addingBook
                      ? <ActivityIndicator color={COLORS.bg} />
                      : <Text style={styles.addBtnText}>+ Dodaj do mojej listy</Text>
                    }
                  </TouchableOpacity>

                  <Text style={styles.readersHeader}>Czytelnicy:</Text>
                </View>
              }
              renderItem={({ item: reader }) => (
                <View style={styles.readerCard}>
                  <View style={styles.readerLeft}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {reader.username ? reader.username[0].toUpperCase() : '?'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.readerName}>{reader.username}</Text>
                      {reader.rating ? <StarRating rating={reader.rating} size={14} /> : null}
                      {reader.date_finished ? (
                        <Text style={styles.readerDate}>
                          {new Date(reader.date_finished).toLocaleDateString('pl-PL')}
                        </Text>
                      ) : null}
                      {reader.notes ? (
                        <Text style={styles.readerNotes} numberOfLines={2}>
                          „{reader.notes}"
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.followBtn,
                      followedIds.includes(reader.user_id) && styles.followingBtn,
                    ]}
                    onPress={() => handleFollow(reader.user_id)}
                  >
                    <Text style={[
                      styles.followBtnText,
                      followedIds.includes(reader.user_id) && styles.followingBtnText,
                    ]}>
                      {followedIds.includes(reader.user_id) ? 'Obserwujesz' : '+ Obserwuj'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 8 },
  backText: { color: COLORS.accent, fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  searchInput: {
    margin: 16, backgroundColor: COLORS.surface, color: COLORS.textPrimary,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 12,
    padding: 13, fontSize: 15,
  },
  bookCard: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: COLORS.border,
    flexDirection: 'row', alignItems: 'center',
  },
  bookLeft: { flex: 1 },
  bookTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 3 },
  bookAuthor: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 },
  bookMeta: { flexDirection: 'row', gap: 10 },
  readersChip: {
    fontSize: 12, color: COLORS.blue, fontWeight: '600',
    backgroundColor: COLORS.blue + '18', paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: 10,
  },
  ratingChip: {
    fontSize: 12, color: COLORS.accent, fontWeight: '600',
    backgroundColor: COLORS.accentSoft, paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: 10,
  },
  arrow: { fontSize: 24, color: COLORS.textMuted, marginLeft: 8 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
  modal: { flex: 1, backgroundColor: COLORS.bg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalBookInfo: { paddingBottom: 8 },
  modalTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  modalAuthor: { fontSize: 16, color: COLORS.textSecondary, marginBottom: 16 },
  modalStats: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  modalStat: { alignItems: 'center' },
  modalStatNum: { fontSize: 28, fontWeight: '800', color: COLORS.accent },
  modalStatLabel: { fontSize: 12, color: COLORS.textSecondary },
  addBtn: {
    backgroundColor: COLORS.accent, borderRadius: 14,
    padding: 14, alignItems: 'center', marginBottom: 24,
  },
  addBtnText: { color: COLORS.bg, fontWeight: '800', fontSize: 16 },
  readersHeader: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  readerCard: {
    backgroundColor: COLORS.card, borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: COLORS.border,
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
  },
  readerLeft: { flexDirection: 'row', gap: 12, flex: 1 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.accent,
  },
  avatarText: { color: COLORS.accent, fontWeight: '800', fontSize: 16 },
  readerName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 3 },
  readerDate: { fontSize: 12, color: COLORS.textMuted, marginTop: 3 },
  readerNotes: { fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic', marginTop: 4, maxWidth: 180 },
  followBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: COLORS.accentSoft, borderWidth: 1, borderColor: COLORS.accent,
  },
  followBtnText: { color: COLORS.accent, fontSize: 12, fontWeight: '700' },
  followingBtn: { backgroundColor: COLORS.surface, borderColor: COLORS.border },
  followingBtnText: { color: COLORS.textSecondary },
});
