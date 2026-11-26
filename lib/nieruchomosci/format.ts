// Liczby po polsku (baza /wizualizacjadanych, 06-rzemioslo D8): spacja tysięcy ZAWSZE. Domyślnie pl-PL nie grupuje
// liczb 4-cyfrowych (8774 obok 14 561 w jednej kolumnie), dlatego useGrouping: "always". Osobny plik bez gus.json,
// żeby komponent kliencki (tabela.tsx) nie ciągnął danych do przeglądarki.
export const liczba = (n?: number | null) => (n == null ? "brak" : n.toLocaleString("pl-PL", { useGrouping: "always" }));
export const zl = (n?: number | null) => (n == null ? "brak" : `${liczba(n)} zł`);
export const proc = (n: number | null) =>
  n == null ? "brak" : `${n > 0 ? "+" : ""}${n.toLocaleString("pl-PL", { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%`;
