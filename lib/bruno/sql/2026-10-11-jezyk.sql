-- 11.10: język konta (salesbruno.com = en, salesbruno.pl = pl). Steruje panelem, głosem i promptem Bruno, mailami i domeną w linkach.
alter table bruno_konta add column if not exists jezyk text not null default 'en';
