// Lista obiekcji z pola tekstowego: jedna na linię, puste pomijamy.
//
// Osobny plik, bo używa jej też `postacie.ts`, a ten idzie do przeglądarki
// razem z komponentami klienckimi. Trzymana w `db.ts` ciągnęła za sobą
// klienta Supabase, który w przeglądarce wywracał całą stronę na starcie
// („supabaseUrl is required", 30.09).
export function listaObiekcji(tekst: string | null | undefined): string[] {
  return (tekst ?? "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^[\s\-\*\d\.\)]+/, "").trim())
    .filter((l) => l.length >= 3)
    .slice(0, 20);
}
