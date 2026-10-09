// Lista obiekcji z pola tekstowego: jedna na linię, puste pomijamy.
//
// Osobny plik, bo używa jej też `postacie.ts`, a ten idzie do przeglądarki
// razem z komponentami klienckimi. Trzymana w `db.ts` ciągnęła za sobą
// klienta Supabase, który w przeglądarce wywracał całą stronę na starcie
// („supabaseUrl is required", 30.09).
//
// 9.10: obiekcja może mieć WYJAŚNIENIE po „ | " albo „ = ", np.
//   „Będziemy oddawać pieniądze | boi się, że urząd każe zwrócić dotację".
// Bruno-klient dostaje wyjaśnienie (8.10 rozumiał „oddawać pieniądze" jako
// podatki), karty powtórek i kreator dostają samo hasło.

export type Obiekcja = { nazwa: string; wyjasnienie: string | null };

const SEPARATOR = /\s+(?:\||=)\s+/;

export function obiekcjeZWyjasnieniem(tekst: string | null | undefined): Obiekcja[] {
  return (tekst ?? "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^[\s\-\*\d\.\)]+/, "").trim())
    .filter((l) => l.length >= 3)
    .slice(0, 20)
    .map((l) => {
      const [nazwa, ...reszta] = l.split(SEPARATOR);
      const wyjasnienie = reszta.join(" ").trim();
      return { nazwa: nazwa.trim(), wyjasnienie: wyjasnienie.length >= 3 ? wyjasnienie.slice(0, 300) : null };
    })
    .filter((o) => o.nazwa.length >= 3);
}

export function listaObiekcji(tekst: string | null | undefined): string[] {
  return obiekcjeZWyjasnieniem(tekst).map((o) => o.nazwa);
}
