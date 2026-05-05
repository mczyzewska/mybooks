
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { COLORS, STATUS_LABELS } from '../lib/theme';
import { useStore } from '../store/useStore';
import { Book, BookStatus } from '../types';
import StarRating from './StarRating';

interface Props {
  book: Book;
  onBack: () => void;
  onSaved: (book: Book) => void;
}

const STATUSES: BookStatus[] = ['to_read', 'reading', 'finished'];

export default function EditBookScreen({ book, onBack, onSaved }: Props) {
  const updateBook = useStore((s) => s.updateBook);
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [status, setStatus] = useState<BookStatus>(book.status);
  const [rating, setRating] = useState(book.rating || 0);
  const [notes, setNotes] = useState(book.notes || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !author.trim()) {
      Alert.alert('Błąd', 'Tytuł i autor są wymagane');
      return;
    }
    setLoading(true);

    const updates = {
      title: title.trim(),
      author: author.trim(),
      status,
      rating: rating || null,
      notes: notes.trim() || null,
      date_finished:
        status === 'finished' && book.status !== 'finished'
          ? new Date().toISOString()
          : book.date_finished,
    };

    const { data, error } = await supabase
      .from('books')
      .update(updates)
      .eq('id', book.id)
      .select()
      .single();

    setLoading(false);

    if (error) {
      Alert.alert('Błąd', error.message);
      return;
    }

    updateBook(data);
    onSaved(data);
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Anuluj</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edytuj książkę</Text>
        <View style={{ width: 70 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Tytuł *</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholderTextColor={COLORS.textMuted} />

        <Text style={styles.label}>Autor *</Text>
        <TextInput style={styles.input} value={author} onChangeText={setAuthor} placeholderTextColor={COLORS.textMuted} />

        <Text style={styles.label}>Status</Text>
        <View style={styles.statusRow}>
          {STATUSES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.statusBtn, status === s && styles.statusBtnActive]}
              onPress={() => setStatus(s)}
            >
              <Text style={[styles.statusBtnText, status === s && styles.statusBtnTextActive]}>
                {STATUS_LABELS[s]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Ocena</Text>
        <View style={styles.ratingRow}>
          <StarRating rating={rating} onRate={setRating} size={32} />
          {rating > 0 && (
            <TouchableOpacity onPress={() => setRating(0)}>
              <Text style={styles.clearText}>Wyczyść</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.label}>Notatki</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          placeholderTextColor={COLORS.textMuted}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.bg} /> : <Text style={styles.saveBtnText}>Zapisz zmiany</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  form: { padding: 20 },
  label: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 6, marginTop: 16, fontWeight: '600' },
  input: {
    backgroundColor: COLORS.surface, color: COLORS.textPrimary,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 12,
    padding: 14, fontSize: 15,
  },
  textarea: { height: 100, textAlignVertical: 'top' },
  statusRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  statusBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  statusBtnActive: { backgroundColor: COLORS.accentSoft, borderColor: COLORS.accent },
  statusBtnText: { color: COLORS.textSecondary, fontSize: 13 },
  statusBtnTextActive: { color: COLORS.accent, fontWeight: '700' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  clearText: { color: COLORS.textMuted, fontSize: 13 },
  saveBtn: {
    backgroundColor: COLORS.accent, borderRadius: 14,
    padding: 16, alignItems: 'center', marginTop: 32,
  },
  saveBtnText: { color: COLORS.bg, fontWeight: '800', fontSize: 17 },
});
