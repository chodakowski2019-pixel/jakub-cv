// Kolory strony szkoleń jako dane (21.11.2026).
// USER_001 odrzucił po kolei: czarną, białą, a potem Tytan / Szkło / Grafit („nadal mi się nie podoba ta kolorystyka”).
// Zamiast zgadywać kolejną wersję: cała kolorystyka wynika z 2 kolorów (tło i akcent) + materiału (metal albo szkło).
// Reszta (tekst, linie, karty, połysk, cienie) wylicza się sama w szkolenia-ai.css, w klasie .gen.
// Dzięki temu paleta to jedna linijka poniżej, a USER_001 może w podglądzie sam ustawić oba kolory.

export type Material = "metal" | "szklo";
export type Paleta = { id: string; nazwa: string; b: string; a: string; m: Material };

// b = tło, a = akcent (przyciski, wyróżnienia), m = materiał.
export const PALETY: Paleta[] = [
  { id: "kobalt", nazwa: "Kobalt", b: "#10245c", a: "#5cc8ff", m: "metal" },
  { id: "granat-zloto", nazwa: "Granat i złoto", b: "#121f3d", a: "#e9bd62", m: "metal" },
  { id: "indygo", nazwa: "Indygo", b: "#1d1548", a: "#b69cff", m: "szklo" },
  { id: "neon", nazwa: "Fiolet i róż", b: "#24103f", a: "#ff5fc8", m: "szklo" },
  { id: "ocean", nazwa: "Ocean", b: "#0a3a4a", a: "#5df0d0", m: "szklo" },
  { id: "szmaragd", nazwa: "Szmaragd i złoto", b: "#0b3b33", a: "#f0c75e", m: "metal" },
  { id: "miedz", nazwa: "Miedź", b: "#2b2320", a: "#ff9457", m: "metal" },
  { id: "burgund", nazwa: "Burgund", b: "#3a1020", a: "#ffb199", m: "metal" },
  { id: "stal-pomarancz", nazwa: "Stal i pomarańcz", b: "#2f3a46", a: "#ff7a2f", m: "metal" },
  { id: "grafit-blekit", nazwa: "Grafit i błękit", b: "#23272e", a: "#6fb4ff", m: "metal" },
  { id: "srebro-kobalt", nazwa: "Srebro i kobalt", b: "#cfd4da", a: "#1f4fff", m: "metal" },
  { id: "perla", nazwa: "Perła", b: "#e9ebf3", a: "#6a4dff", m: "szklo" },
  { id: "lod", nazwa: "Lód", b: "#dbe7f2", a: "#0a66ff", m: "szklo" },
];

// Wcześniejsze wersje (osobne klasy w arkuszu). Zostają do porównania. b i a służą tylko do narysowania próbki.
export const STARE: { id: string; nazwa: string; klasy: string[]; b: string; a: string }[] = [
  { id: "tytan", nazwa: "Tytan (wcześniejsza)", klasy: ["jasna", "tytan"], b: "#c9ced5", a: "#d9e000" },
  { id: "szklo", nazwa: "Szkło (wcześniejsza)", klasy: ["szklo"], b: "#2d4862", a: "#d9e000" },
  { id: "grafit", nazwa: "Grafit (wcześniejsza)", klasy: ["grafit"], b: "#22262b", a: "#d9e000" },
  { id: "ciemny", nazwa: "Czarna (pierwsza)", klasy: [], b: "#030405", a: "#d9e000" },
  { id: "jasny", nazwa: "Biała (wcześniejsza)", klasy: ["jasna"], b: "#f3f5f3", a: "#d9e000" },
];

const ATRAMENT_JASNY = "#f7f9fb";
const ATRAMENT_CIEMNY = "#0d1116";

const rgb = (h: string) => {
  const n = parseInt(h.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const hex = (c: number[]) => `#${c.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join("")}`;
const jasnosc = (h: string) => {
  const [r, g, b] = rgb(h).map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const kontrast = (x: string, y: string) => {
  const a = jasnosc(x);
  const b = jasnosc(y);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};
const miks = (x: string, y: string, t: number) => {
  const p = rgb(x);
  const q = rgb(y);
  return hex(p.map((v, i) => v + (q[i] - v) * t));
};

export const poprawnyKolor = (h: string) => /^#[0-9a-fA-F]{6}$/.test(h);

// Tło jest „jasne”, gdy ciemny tekst czyta się na nim lepiej niż jasny.
export const jasneTlo = (b: string) => kontrast(b, ATRAMENT_CIEMNY) > kontrast(b, ATRAMENT_JASNY);

// Zmienne ustawiane na korzeniu strony. Akcent użyty jako TEKST jest rozjaśniany albo przyciemniany,
// aż będzie czytelny na tle (kontrast min. 5,5), więc każda para kolorów daje czytelne napisy.
export function zmienne(b: string, a: string): Record<string, string> {
  const j = jasneTlo(b);
  const ink = j ? ATRAMENT_CIEMNY : ATRAMENT_JASNY;
  let tekstAkcentu = a;
  for (let t = 0.05; t <= 1 && kontrast(tekstAkcentu, b) < 5.5; t += 0.05) tekstAkcentu = miks(a, j ? "#000000" : "#ffffff", t);
  const naAkcencie = kontrast(a, ATRAMENT_CIEMNY) >= kontrast(a, "#ffffff") ? ATRAMENT_CIEMNY : "#ffffff";
  return {
    "--b": b,
    "--a": a,
    "--a-rgb": rgb(a).join(", "),
    "--a-tekst": tekstAkcentu,
    "--na-a": naAkcencie,
    "--ink": ink,
    "--ink-rgb": rgb(ink).join(", "),
  };
}

export const klasyGen = (b: string, m: Material) => ["gen", ...(jasneTlo(b) ? ["gen-j"] : []), `mat-${m}`];
export const KLASY_WSZYSTKIE = ["jasna", "tytan", "szklo", "grafit", "gen", "gen-j", "mat-metal", "mat-szklo"];
export const NAZWY_ZMIENNYCH = ["--b", "--a", "--a-rgb", "--a-tekst", "--na-a", "--ink", "--ink-rgb"];
