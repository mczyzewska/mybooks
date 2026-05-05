
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
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

interface FollowedUser {
  id: string;
  username: string;
}

interface FinishedBook {
  title: string;
  author: string;
  rating?: number;
  date_finished?: string;
}

export default function FollowingScreen({ onBack }: Props) {
  const currentUser = useStore((s) => s.currentUser);
  const [followedUsers, setFollowedUsers] = useState<FollowedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<FollowedUser | null>(null);
  const [userBooks, setUserBooks] = useState<FinishedBook[]>([]);
  const [userBooksLoading, setUserBooksLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadFollowing();
  }, []);

  const loadFollowing = async () => {
    if (!currentUser) return;
    setLoading(true);

    const { data: follows } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', currentUser.id);

    if (!follows || follows.length === 0) {
      setFollowedUsers([]);
      setLoading(false);
      return;
    }

    const ids = follows.map((f) => f.following_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', ids);

    setFollowedUsers(
      (profiles || []).map((p) => ({ id: p.id, username: p.username || 'Anonim' }))
    );
    setLoading(false);
  };

  const openUserBooks = async (user: FollowedUser) => {
    setSelectedUser(user);
    setUserBooksLoading(true);
    setModalVisible(true);

    const { data } = await supabase
      .from('books')
      .select('title, author, rating, date_finished')
      .eq('user_id', user.id)
      .eq('status', 'finished')
      .order('date_finished', { ascending: false });

    setUserBooks(data || []);
    setUserBooksLoading(false);
  };

  const handleUnfollow = async (userId: string, username: string) => {
    Alert.alert('Przestań obserwować', `Czy chcesz usunąć ${username} z obserwowanych?`, [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń', style: 'destructive',
        onPress: async () => {
          await supabase
            .from('user_follows')
            .delete()
            .eq('follower_id', currentUser?.id)
            .eq('following_id', userId);
          setFollowedUsers((prev) => prev.filter((u) => u.id !== userId));
        },
      },
    ]);
  };

  const handleAddToMyList = async (book: FinishedBook) => {
    if (!currentUser) return;
    const { error } = await supabase.from('books').insert({
      user_id: currentUser.id,
      title: book.title,
      author: book.author,
      status: 'to_read',
    });
    if (!error) Alert.alert('Dodano!', `"${book.title}" dodana do Twojej listy`);
    else Alert.alert('Błąd', error.message);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Wróć</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Obserwowani</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={followedUsers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.userCard} onPress={() => openUserBooks(item)} activeOpacity={0.85}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.username[0].toUpperCase()}</Text>
              </View>
              <Text style={styles.username}>{item.username}</Text>
              <TouchableOpacity
                style={styles.unfollowBtn}
                onPress={() => handleUnfollow(item.id, item.username)}
              >
                <Text style={styles.unfollowText}>Usuń</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>Brak obserwowanych</Text>
              <Text style={styles.emptyText}>
                Wejdź w szczegóły książki lub do Odkrywaj i kliknij "+ Obserwuj"
              </Text>
            </View>
          }
        />
      )}

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.backText}>← Zamknij</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Przeczytane przez {selectedUser?.username}</Text>
            <View style={{ width: 70 }} />
          </View>

          {userBooksLoading ? (
            <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={userBooks}
              keyExtractor={(item, i) => i.toString()}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <View style={styles.bookCard}>
                  <View style={styles.bookInfo}>
                    <Text style={styles.bookTitle}>{item.title}</Text>
                    <Text style={styles.bookAuthor}>{item.author}</Text>
                    {item.rating ? <StarRating rating={item.rating} size={16} /> : null}
                    {item.date_finished ? (
                      <Text style={styles.bookDate}>
                        {new Date(item.date_finished).toLocaleDateString('pl-PL')}
                      </Text>
                    ) : null}
                  </View>
                  <TouchableOpacity style={styles.addBtn} onPress={() => handleAddToMyList(item)}>
                    <Text style={styles.addBtnText}>+ Dodaj</Text>
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
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 8 },
  backText: { color: COLORS.accent, fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  userCard: {
    backgroundColor: COLORS.card, borderRadius: 14,
    padding: 14, marginBottom: 10, flexDirection: 'row',
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: COLORS.accentSoft, alignItems: 'center',
    justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: COLORS.accent,
  },
  avatarText: { color: COLORS.accent, fontWeight: '800', fontSize: 18 },
  username: { flex: 1, fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  unfollowBtn: {
    backgroundColor: COLORS.surface, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: COLORS.red + '66',
  },
  unfollowText: { color: COLORS.red, fontSize: 13, fontWeight: '600' },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
  modal: { flex: 1, backgroundColor: COLORS.bg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, flex: 1, textAlign: 'center' },
  bookCard: {
    backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  bookInfo: { flex: 1 },
  bookTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  bookAuthor: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  bookDate: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  addBtn: {
    backgroundColor: COLORS.accentSoft, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.accent,
  },
  addBtnText: { color: COLORS.accent, fontWeight: '700', fontSize: 12 },
});
