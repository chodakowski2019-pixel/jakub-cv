// 5.11: listy wyboru formularza po płatności. Osobny plik bez "use client", bo czyta je też API (/api/bruno/start);
// stałe z pliku klienckiego na serwerze są pustymi odnośnikami, nie tablicami.
export const CELE = ["dorobić na etacie", "zmienić pracę na sprzedaż", "własny biznes", "lepsze wyniki w obecnej pracy"];
export const DOSW: [string, string][] = [
  ["0", "Zero, zaczynam"],
  ["do roku", "Do roku"],
  ["1-3 lata", "1-3 lata"],
  ["ponad 3 lata", "Ponad 3 lata"],
];
export const ROZMOW = ["0", "1-5", "6-20", "ponad 20"];
export const KANALY = ["telefon", "spotkanie na żywo", "wideo (Meet, Zoom)", "wiadomości (czat, e-mail)"];
export const KOMU = ["osobom prywatnym", "firmom", "jeszcze nie wiem"];
export const PORY = ["rano (przed pracą)", "w ciągu dnia", "wieczorem"];
export const MINUT = ["15", "30", "60"];
