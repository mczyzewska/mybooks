
import { Session } from '@supabase/supabase-js';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { COLORS } from '../lib/theme';
import { useStore } from '../store/useStore';
import { Book } from '../types';

import AddBookScreen from '../components/AddBookScreen';
import BookDetailScreen from '../components/BookDetailScreen';
import DiscoverScreen from '../components/DiscoverScreen';
import EditBookScreen from '../components/EditBookScreen';
import FollowingScreen from '../components/FollowingScreen';
import LoginScreen from '../components/LoginScreen';
import MyBooksScreen from '../components/MyBooksScreen';
import RegisterScreen from '../components/RegisterScreen';
import StatsScreen from '../components/StatsScreen';

type Screen =
  | 'login'
  | 'register'
  | 'mybooks'
  | 'add'
  | 'edit'
  | 'detail'
  | 'stats'
  | 'following'
  | 'discover';

export default function App() {
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const [screen, setScreen] = useState<Screen>('login');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) handleSession(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        handleSession(session);
        setScreen('mybooks');
      } else {
        setCurrentUser(null);
        setScreen('login');
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSession = (session: Session) => {
    const user = session.user;
    setCurrentUser({
      id: user.id,
      email: user.email || '',
      username: user.user_metadata?.username || user.email?.split('@')[0] || 'Czytelnik',
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleBookPress = (book: Book) => {
    setSelectedBook(book);
    setScreen('detail');
  };

  const handleEditBook = (book: Book) => {
    setSelectedBook(book);
    setScreen('edit');
  };

  const handleEditSaved = (book: Book) => {
    setSelectedBook(book);
    setScreen('detail');
  };

  if (!session) {
    return (
      <View style={styles.root}>
        {screen === 'login' && <LoginScreen onSwitch={() => setScreen('register')} />}
        {screen === 'register' && <RegisterScreen onSwitch={() => setScreen('login')} />}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {screen === 'mybooks' && (
        <MyBooksScreen
          onAddBook={() => setScreen('add')}
          onBookPress={handleBookPress}
          onStats={() => setScreen('stats')}
          onFollowing={() => setScreen('following')}
          onDiscover={() => setScreen('discover')}
          onLogout={handleLogout}
        />
      )}
      {screen === 'add' && (
        <AddBookScreen
          onBack={() => setScreen('mybooks')}
          onSaved={() => setScreen('mybooks')} 
        />
      )}
      {screen === 'edit' && selectedBook && (
        <EditBookScreen
          book={selectedBook}
          onBack={() => setScreen('detail')}
          onSaved={handleEditSaved}
        />
      )}
      {screen === 'detail' && selectedBook && (
        <BookDetailScreen
          book={selectedBook}
          onBack={() => setScreen('mybooks')}
          onEdit={handleEditBook}
          onDeleted={() => setScreen('mybooks')} 
        />
      )}
      {screen === 'stats' && (
        <StatsScreen onBack={() => setScreen('mybooks')} />
      )}
      {screen === 'following' && (
        <FollowingScreen onBack={() => setScreen('mybooks')} />
      )}
      {screen === 'discover' && (
        <DiscoverScreen onBack={() => setScreen('mybooks')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
});
