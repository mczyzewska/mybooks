
import { create } from 'zustand';
import { Book, User } from '../types';

interface AppState {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

  books: Book[];
  setBooks: (books: Book[]) => void;
  addBook: (book: Book) => void;
  updateBook: (book: Book) => void;
  removeBook: (id: string) => void;
}

export const useStore = create<AppState>((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  books: [],
  setBooks: (books) => set({ books }),
  addBook: (book) => set((state) => ({ books: [book, ...state.books] })),
  updateBook: (book) =>
    set((state) => ({
      books: state.books.map((b) => (b.id === book.id ? book : b)),
    })),
  removeBook: (id) =>
    set((state) => ({ books: state.books.filter((b) => b.id !== id) })),
}));
