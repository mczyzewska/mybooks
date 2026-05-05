
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert, KeyboardAvoidingView, Platform,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { COLORS } from '../lib/theme';

interface Props {
  onSwitch: () => void;
}

export default function RegisterScreen({ onSwitch }: Props) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert('Błąd', 'Wypełnij wszystkie pola');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Błąd', 'Hasło musi mieć co najmniej 6 znaków');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    setLoading(false);
    if (error) {
      Alert.alert('Błąd rejestracji', error.message);
    } else {
      Alert.alert('Sukces!', 'Konto zostało utworzone. Możesz się teraz zalogować.', [
        { text: 'OK', onPress: onSwitch },
      ]);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>📖</Text>
        <Text style={styles.title}>Dołącz</Text>
        <Text style={styles.subtitle}>Stwórz swój dziennik lektur</Text>

        <TextInput
          style={styles.input}
          placeholder="Nazwa użytkownika"
          placeholderTextColor={COLORS.textMuted}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={COLORS.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Hasło (min. 6 znaków)"
          placeholderTextColor={COLORS.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.bg} />
          ) : (
            <Text style={styles.btnText}>Zarejestruj się</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={onSwitch} style={styles.switchBtn}>
          <Text style={styles.switchText}>
            Masz już konto? <Text style={styles.switchLink}>Zaloguj się</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  logo: { fontSize: 56, textAlign: 'center', marginBottom: 8 },
  title: {
    fontSize: 36, fontWeight: '800', color: COLORS.accent,
    textAlign: 'center', letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14, color: COLORS.textSecondary, textAlign: 'center',
    marginBottom: 40, letterSpacing: 1,
  },
  input: {
    backgroundColor: COLORS.surface, color: COLORS.textPrimary,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 12,
    padding: 14, marginBottom: 12, fontSize: 15,
  },
  btn: {
    backgroundColor: COLORS.accent, borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 8,
  },
  btnText: { color: COLORS.bg, fontWeight: '700', fontSize: 16 },
  switchBtn: { marginTop: 24, alignItems: 'center' },
  switchText: { color: COLORS.textSecondary, fontSize: 14 },
  switchLink: { color: COLORS.accent, fontWeight: '600' },
});
