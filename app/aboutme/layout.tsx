import { Inter, Poppins } from "next/font/google";

// /aboutme (USER_001 24.09.2026): ten sam jasny design co oferta PHC
// (app/wspolpracampphc): Poppins na nagłówki, Inter na tekst. Kroje ładowane
// tylko dla tej ścieżki, reszta serwisu zostaje na Geist i ciemnym tle.

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
