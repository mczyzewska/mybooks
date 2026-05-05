
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { COLORS, STATUS_COLORS, STATUS_LABELS } from '../lib/theme';
import { useStore } from '../store/useStore';
import { Book } from '../types';
import StarRating from './StarRating';

interface Props {
  book: Book;
  onBack: () => void;
  onEdit: (book: Book) => void;
  onDeleted: () => void;
}

interface OtherReader {
  user_id: string;
  username: string;
  rating?: number;
  date_finished?: string;
}

interface ReaderBook {
  title: string;
  author: string;
  rating?: number;
  date_finished?: string;
}

export default function BookDetailScreen({ book, onBack, onEdit, onDeleted }: Props) {
  const currentUser = useStore((s) => s.currentUser);
  const removeBook = useStore((s) => s.removeBook);

  const [readers, setReaders] = useState<OtherReader[]>([]);
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [selectedReader, setSelectedReader] = useState<OtherReader | null>(null);
  const [readerBooks, setReaderBooks] = useState<ReaderBook[]>([]);
  const [readerBooksLoading, setReaderBooksLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadOtherReaders();
    loadFollowedIds();
  }, [book.id]);

  const loadOtherReaders = async () => {
    const { data, error } = await supabase
      .from('books')
      .select('user_id, rating, date_finished')
      .eq('title', book.title)
      .eq('author', book.author)
      .eq('status', 'finished')
      .neq('user_id', currentUser?.id ?? '');

    if (error || !data || data.length === 0) return;

    const userIds = [...new Set(data.map((r) => r.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', userIds);

    const profileMap: Record<string, string> = {};
    (profiles || []).forEach((p) => { profileMap[p.id] = p.username; });

    setReaders(data.map((r) => ({
      user_id: r.user_id,
      username: profileMap[r.user_id] ?? r.user_id.slice(0, 8),
      rating: r.rating ?? undefined,
      date_finished: r.date_finished ?? undefined,
    })));
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
        follower_id: currentUser.id, following_id: userId,
      });
      setFollowedIds((prev) => [...prev, userId]);
    }
  };

  const openReaderBooks = async (reader: OtherReader) => {
    setSelectedReader(reader);
    setReaderBooksLoading(true);
    setModalVisible(true);
    const { data } = await supabase
      .from('books')
      .select('title, author, rating, date_finished')
      .eq('user_id', reader.user_id)
      .eq('status', 'finished')
      .order('date_finished', { ascending: false });
    setReaderBooks(data || []);
    setReaderBooksLoading(false);
  };

  const handleAddToMyList = async (rb: ReaderBook) => {
    if (!currentUser) return;
    const { error } = await supabase.from('books').insert({
      user_id: currentUser.id,
      title: rb.title,
      author: rb.author,
      status: 'to_read',
    });
    if (!error) Alert.alert('Dodano!', `"${rb.title}" trafiła na Twoją listę`);
    else Alert.alert('Błąd', error.message);
  };

  const handleDelete = () => {
    Alert.alert(
      'Usuń książkę',
      `Czy na pewno chcesz usunąć "${book.title}"?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const { error } = await supabase
              .from('books')
              .delete()
              .eq('id', book.id);

            if (error) {
              setDeleting(false);
              Alert.alert('Błąd usuwania', error.message);
              return;
            }

            removeBook(book.id);
            onDeleted();
          },
        },
      ]
    );
  };

  const statusColor = STATUS_COLORS[book.status];

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>← Wróć</Text>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => onEdit(book)} style={styles.actionBtn}>
              <Text style={styles.actionBtnText}>✏️ Edytuj</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              style={[styles.actionBtn, styles.deleteBtn]}
              disabled={deleting}
            >
              <Text style={styles.deleteBtnText}>{deleting ? '...' : '🗑️'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bookInfo}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {STATUS_LABELS[book.status]}
            </Text>
          </View>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.author}>{book.author}</Text>

          {book.rating ? (
            <View style={styles.ratingRow}>
              <StarRating rating={book.rating} size={26} />
              <Text style={styles.ratingNum}>{book.rating}/5</Text>
            </View>
          ) : null}

          <Text style={styles.dateAdded}>
            Dodano: {new Date(book.date_added).toLocaleDateString('pl-PL')}
          </Text>

          {book.notes ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>📝 Notatki</Text>
              <Text style={styles.notesText}>{book.notes}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Inni czytelnicy</Text>
          {readers.length === 0 ? (
            <Text style={styles.emptyText}>Nikt inny jeszcze nie przeczytał tej książki</Text>
          ) : (
            <>
              <Text style={styles.readersCount}>
                {readers.length} {readers.length === 1 ? 'osoba przeczytała' : 'osób przeczytało'} tę książkę
              </Text>
              {readers.map((reader) => (
                <TouchableOpacity
                  key={reader.user_id}
                  style={styles.readerRow}
                  onPress={() => openReaderBooks(reader)}
                  activeOpacity={0.8}
                >
                  <View style={styles.readerInfo}>
                    <Text style={styles.readerName}>{reader.username}</Text>
                    <Text style={styles.readerMeta}>
                      {reader.rating ? `Ocena: ${reader.rating}/5` : 'Brak oceny'}
                      {reader.date_finished
                        ? ` · ${new Date(reader.date_finished).toLocaleDateString('pl-PL')}`
                        : ''}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.followBtn, followedIds.includes(reader.user_id) && styles.followingBtn]}
                    onPress={() => handleFollow(reader.user_id)}
                  >
                    <Text style={[styles.followBtnText, followedIds.includes(reader.user_id) && styles.followingBtnText]}>
                      {followedIds.includes(reader.user_id) ? 'Obserwujesz' : '+ Obserwuj'}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.backText}>← Zamknij</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Książki: {selectedReader?.username}</Text>
            <View style={{ width: 70 }} />
          </View>

          {readerBooksLoading ? (
            <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={readerBooks}
              keyExtractor={(item, i) => i.toString()}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <View style={styles.readerBookCard}>
                  <View style={styles.readerBookInfo}>
                    <Text style={styles.readerBookTitle}>{item.title}</Text>
                    <Text style={styles.readerBookAuthor}>{item.author}</Text>
                    {item.rating ? <StarRating rating={item.rating} size={16} /> : null}
                    {item.date_finished ? (
                      <Text style={styles.readerBookDate}>
                        {new Date(item.date_finished).toLocaleDateString('pl-PL')}
                      </Text>
                    ) : null}
                  </View>
                  <TouchableOpacity style={styles.addToListBtn} onPress={() => handleAddToMyList(item)}>
                    <Text style={styles.addToListText}>+ Dodaj</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Brak przeczytanych książek</Text>
              }
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
  headerActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    backgroundColor: COLORS.surface, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  actionBtnText: { color: COLORS.textPrimary, fontSize: 13 },
  deleteBtn: { borderColor: COLORS.red + '66' },
  deleteBtnText: { color: COLORS.red, fontSize: 16 },
  bookInfo: { padding: 20 },
  statusBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, marginBottom: 14,
  },
  statusText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 6, lineHeight: 32 },
  author: { fontSize: 16, color: COLORS.textSecondary, marginBottom: 14 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  ratingNum: { color: COLORS.accent, fontWeight: '700', fontSize: 16 },
  dateAdded: { fontSize: 12, color: COLORS.textMuted, marginBottom: 16 },
  notesBox: {
    backgroundColor: COLORS.surface, borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: COLORS.border,
  },
  notesLabel: { fontSize: 13, color: COLORS.accent, fontWeight: '600', marginBottom: 8 },
  notesText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  section: {
    margin: 16, backgroundColor: COLORS.surface,
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  readersCount: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 14 },
  emptyText: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', padding: 20 },
  readerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  readerInfo: { flex: 1 },
  readerName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  readerMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  followBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: COLORS.accentSoft, borderWidth: 1, borderColor: COLORS.accent,
  },
  followBtnText: { color: COLORS.accent, fontSize: 12, fontWeight: '700' },
  followingBtn: { backgroundColor: COLORS.surface, borderColor: COLORS.border },
  followingBtnText: { color: COLORS.textSecondary },
  modal: { flex: 1, backgroundColor: COLORS.bg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  readerBookCard: {
    backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center',
  },
  readerBookInfo: { flex: 1 },
  readerBookTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  readerBookAuthor: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  readerBookDate: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  addToListBtn: {
    backgroundColor: COLORS.accentSoft, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.accent,
  },
  addToListText: { color: COLORS.accent, fontWeight: '700', fontSize: 12 },
});
