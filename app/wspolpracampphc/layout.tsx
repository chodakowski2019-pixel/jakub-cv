import { Inter, Poppins } from "next/font/google";

// Oferta strategii dla Perfect Hair Clinic (USER_001 24.09) przeniesiona
// z lovemyself.pl na jakubchodakowski.com. Strona jest JASNA i używa
// Poppins (nagłówki) + Inter (tekst), czyli innych krojów niż reszta serwisu
// (Geist na ciemnym tle). Kroje ładujemy tu, tylko dla tej ścieżki, a zmienne
// CSS wystawiamy na wrapperze, żeby nie ruszać globalnego layoutu.

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["500", "600", "700"],
  subsets: ["latin", "latin-ext"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${poppins.variable} ${inter.variable} min-h-screen bg-white`}
      style={{ fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif" }}
    >
      {children}
    </div>
  );
}
