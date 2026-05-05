# 📚 MyBooks

Aplikacja mobilna do śledzenia przeczytanych książek i odkrywania co czytają inni. Zbudowana w React Native (Expo) z backendem Supabase.

---

## Funkcjonalności

- 🔐 Rejestracja i logowanie (Supabase Auth)
- 📚 Lista książek z filtrami (Chcę przeczytać / Czytam / Przeczytane)
- ➕ Dodawanie i edycja książek (tytuł, autor, status, ocena 1–5, notatki)
- 🔍 Wyszukiwanie po tytule i autorze
- 📅 Licznik książek przeczytanych w tym roku
- 📊 Statystyki (średnia ocena, najwyżej oceniona, podział wg statusu)
- 🌐 Ekran **Odkrywaj** — książki przeczytane przez innych użytkowników
- 👥 Sekcja "Inni czytelnicy" na szczegółach książki
- 👁 Obserwowanie innych czytelników
- ➕ Kopiowanie książek obserwowanych na własną listę

---

## Stack

| Technologia | Zastosowanie |
|-------------|--------------|
| React Native + Expo | Framework mobilny |
| TypeScript | Typowanie |
| Supabase | Baza danych + Auth + RLS |
| Zustand | Stan globalny (currentUser, lista książek) |

---

## Struktura projektu

```
mybooks/
├── app/
│   └── index.tsx              ← nawigacja + obsługa sesji
├── components/
│   ├── LoginScreen.tsx
│   ├── RegisterScreen.tsx
│   ├── MyBooksScreen.tsx      ← główna lista książek
│   ├── AddBookScreen.tsx
│   ├── EditBookScreen.tsx
│   ├── BookDetailScreen.tsx   ← szczegóły + inni czytelnicy
│   ├── DiscoverScreen.tsx     ← odkrywaj książki innych
│   ├── StatsScreen.tsx
│   ├── FollowingScreen.tsx
│   ├── BookCard.tsx
│   └── StarRating.tsx
├── store/
│   └── useStore.ts
├── lib/
│   ├── supabase.ts            ← wklej tu swój URL i klucz
│   └── theme.ts
├── types/
│   └── index.ts
└── sql/
    ├── schema.sql             ← uruchom jako pierwszy
    └── seed.sql               ← uruchom jako drugi (dane testowe)
```

---

## Uruchomienie

### 1. Supabase — baza danych

1. Załóż konto na [supabase.com](https://supabase.com) i stwórz nowy projekt
2. Wejdź w **SQL Editor** i uruchom plik `sql/schema.sql`
3. Opcjonalnie: uruchom `sql/seed.sql` żeby dodać przykładowych użytkowników i książki (wymaga ręcznego wpisania UUID — instrukcja w pliku)
4. Wejdź w **Settings → API** i skopiuj:
   - **Project URL**
   - **anon public key**

### 2. Konfiguracja

Otwórz plik `lib/supabase.ts` i wklej swoje dane:

```ts
const SUPABASE_URL = 'https://twoj-projekt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### 3. Instalacja zależności

```bash
npm install
```

Jeśli instalujesz od zera na nowym projekcie Expo:

```bash
npm install @supabase/supabase-js @react-native-async-storage/async-storage zustand
```

> **Windows — błąd uprawnień PowerShell:**
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```

### 4. Uruchomienie

```bash
npx expo start
```

Zeskanuj kod QR aplikacją **Expo Go** na telefonie (Android lub iOS). Telefon i komputer muszą być w tej samej sieci Wi-Fi.

---

## Baza danych — tabele

### `profiles`
| Kolumna | Typ | Opis |
|---------|-----|------|
| id | UUID | FK → auth.users |
| username | TEXT | Nazwa użytkownika |
| created_at | TIMESTAMPTZ | Data rejestracji |

> Profil tworzony automatycznie przez trigger przy rejestracji.

### `books`
| Kolumna | Typ | Opis |
|---------|-----|------|
| id | UUID | Klucz główny |
| user_id | UUID | FK → auth.users |
| title | TEXT | Tytuł |
| author | TEXT | Autor |
| status | TEXT | `to_read` / `reading` / `finished` |
| rating | INTEGER | 1–5 (opcjonalne) |
| notes | TEXT | Notatki (opcjonalne) |
| date_added | TIMESTAMPTZ | Data dodania |
| date_finished | TIMESTAMPTZ | Data ukończenia |

### `user_follows`
| Kolumna | Typ | Opis |
|---------|-----|------|
| id | UUID | Klucz główny |
| follower_id | UUID | Obserwujący |
| following_id | UUID | Obserwowany |
| created_at | TIMESTAMPTZ | Data obserwowania |

---

## Wkład własny

Pull requesty mile widziane. Przed większymi zmianami otwórz issue.
