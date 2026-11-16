-- 16.11 (USER_001): Bruno gra klienta z branży, w której handlowiec ma doświadczenie. Przy rozmowie zapisujemy,
-- z jakiej branży i dla jakiego klienta (firma / osoba) była sytuacja, żeby ocena i widok firmy mówiły to samo.
alter table praca_rozmowy_testowe add column if not exists branza text;
alter table praca_rozmowy_testowe add column if not exists segment text;
