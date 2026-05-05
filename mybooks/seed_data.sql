-- =============================================
-- SEEDERY — przykładowi użytkownicy i książki
-- Uruchom w Supabase SQL Editor
-- =============================================

-- WAŻNE: najpierw stwórz użytkowników przez Supabase Auth
-- (Authentication → Users → Add user → Create new user)
-- Dane użytkowników do stworzenia:
--   1. email: anna@demo.pl        hasło: demo123456   username: anna_czyta
--   2. email: bartek@demo.pl      hasło: demo123456   username: bartek_books
--   3. email: kasia@demo.pl       hasło: demo123456   username: kasia_reads

-- Po stworzeniu użytkowników wklej ich UUID poniżej (Settings → Users → kliknij użytkownika → skopiuj UUID)

-- UWAGA: zamień te UUID na prawdziwe z Twojego Supabase!
DO $$
DECLARE
  anna_id   UUID := '00000000-0000-0000-0000-000000000001'; -- ZMIEŃ
  bartek_id UUID := '00000000-0000-0000-0000-000000000002'; -- ZMIEŃ
  kasia_id  UUID := '00000000-0000-0000-0000-000000000003'; -- ZMIEŃ
BEGIN

-- =====================
-- Książki Anny
-- =====================
INSERT INTO books (user_id, title, author, status, rating, notes, date_added, date_finished) VALUES
(anna_id, 'Wiedźmin: Ostatnie życzenie', 'Andrzej Sapkowski', 'finished', 5, 'Absolutna klasyka! Geralt najlepszy.', NOW() - INTERVAL '60 days', NOW() - INTERVAL '55 days'),
(anna_id, 'Harry Potter i Kamień Filozoficzny', 'J.K. Rowling', 'finished', 5, 'Czytam po raz czwarty i nadal czuję magię.', NOW() - INTERVAL '40 days', NOW() - INTERVAL '35 days'),
(anna_id, 'Mały Książę', 'Antoine de Saint-Exupéry', 'finished', 5, 'Wzruszające. Dla dorosłych bardziej niż dla dzieci.', NOW() - INTERVAL '20 days', NOW() - INTERVAL '18 days'),
(anna_id, 'Dune', 'Frank Herbert', 'finished', 4, 'Epicki świat. Trochę wolno się zaczyna ale warto.', NOW() - INTERVAL '90 days', NOW() - INTERVAL '80 days'),
(anna_id, 'Zbrodnia i kara', 'Fiodor Dostojewski', 'reading', NULL, 'W połowie. Raskolnikow mnie wciąga.', NOW() - INTERVAL '10 days', NULL),
(anna_id, 'Sto lat samotności', 'Gabriel García Márquez', 'to_read', NULL, 'Polecona przez mamę.', NOW() - INTERVAL '5 days', NULL);

-- =====================
-- Książki Bartka
-- =====================
INSERT INTO books (user_id, title, author, status, rating, notes, date_added, date_finished) VALUES
(bartek_id, 'Dune', 'Frank Herbert', 'finished', 5, 'Najlepsza sci-fi jaka istnieje. Koniec.', NOW() - INTERVAL '70 days', NOW() - INTERVAL '60 days'),
(bartek_id, 'Solaris', 'Stanisław Lem', 'finished', 5, 'Geniusz. Lem wyprzedził swoje czasy o 50 lat.', NOW() - INTERVAL '50 days', NOW() - INTERVAL '45 days'),
(bartek_id, 'Wiedźmin: Ostatnie życzenie', 'Andrzej Sapkowski', 'finished', 4, 'Świetne opowiadania. Lepsza forma niż powieść.', NOW() - INTERVAL '30 days', NOW() - INTERVAL '25 days'),
(bartek_id, '1984', 'George Orwell', 'finished', 5, 'Przerażająco aktualne. Obowiązkowa lektura.', NOW() - INTERVAL '100 days', NOW() - INTERVAL '95 days'),
(bartek_id, 'Nowy wspaniały świat', 'Aldous Huxley', 'finished', 4, 'Dobra para do 1984. Inne podejście do dystopii.', NOW() - INTERVAL '110 days', NOW() - INTERVAL '105 days'),
(bartek_id, 'Harry Potter i Kamień Filozoficzny', 'J.K. Rowling', 'finished', 4, 'Sentymentalne. Przeczytane razem z córką.', NOW() - INTERVAL '15 days', NOW() - INTERVAL '10 days'),
(bartek_id, 'Mały Książę', 'Antoine de Saint-Exupéry', 'reading', NULL, 'Na nowo odkrywam jako dorosły.', NOW() - INTERVAL '3 days', NULL);

-- =====================
-- Książki Kasi
-- =====================
INSERT INTO books (user_id, title, author, status, rating, notes, date_added, date_finished) VALUES
(kasia_id, 'Harry Potter i Kamień Filozoficzny', 'J.K. Rowling', 'finished', 5, 'Moja ulubiona seria wszech czasów!', NOW() - INTERVAL '80 days', NOW() - INTERVAL '75 days'),
(kasia_id, 'Mały Książę', 'Antoine de Saint-Exupéry', 'finished', 5, 'Płakałam. Piękna książka.', NOW() - INTERVAL '60 days', NOW() - INTERVAL '58 days'),
(kasia_id, 'Sto lat samotności', 'Gabriel García Márquez', 'finished', 4, 'Trudna w czytaniu ale warta wysiłku.', NOW() - INTERVAL '40 days', NOW() - INTERVAL '30 days'),
(kasia_id, 'Zbrodnia i kara', 'Fiodor Dostojewski', 'finished', 3, 'Przeczytane bo musiałam. Wolę współczesną literaturę.', NOW() - INTERVAL '20 days', NOW() - INTERVAL '15 days'),
(kasia_id, '1984', 'George Orwell', 'finished', 5, 'Chyba najważniejsza książka jaką przeczytałam.', NOW() - INTERVAL '120 days', NOW() - INTERVAL '115 days'),
(kasia_id, 'Dune', 'Frank Herbert', 'to_read', NULL, 'Bartek polecił. Zobaczymy.', NOW() - INTERVAL '2 days', NULL),
(kasia_id, 'Solaris', 'Stanisław Lem', 'to_read', NULL, 'Klasyk polskiej literatury.', NOW() - INTERVAL '1 days', NULL);

-- =====================
-- Obserwowania między użytkownikami
-- =====================
INSERT INTO user_follows (follower_id, following_id) VALUES
(anna_id, bartek_id),
(anna_id, kasia_id),
(bartek_id, kasia_id),
(kasia_id, anna_id);

END $$;
