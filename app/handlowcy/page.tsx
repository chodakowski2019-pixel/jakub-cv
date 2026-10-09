import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "@/components/podglad/glowna/glowna.css";

// Podstrona „Znajdź handlowca" (9.10): przycisk ze strony głównej. Wyszukiwarka jeszcze nie istnieje (E23).
const inter = Inter({ subsets: ["latin", "latin-ext"], weight: ["400", "500"], variable: "--pgg-inter" });
const serif = Instrument_Serif({ subsets: ["latin", "latin-ext"], weight: "400", style: ["normal", "italic"], variable: "--pgg-serif" });

export const metadata: Metadata = {
  title: "Znajdź handlowca | Jakub Chodakowski",
  description: "Handlowcy z całego świata.",
  alternates: { canonical: "/handlowcy" },
  openGraph: { title: "Znajdź handlowca | Jakub Chodakowski", description: "Handlowcy z całego świata.", url: "/handlowcy", images: [{ url: "/profilowe_jakub.png" }] },
};

export default function Page() {
  return (
    <div className={`pgg ${inter.variable} ${serif.variable}`} lang="pl">
      <main>
        <section className="sec" style={{ minHeight: "70vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <span className="sec-label">Wkrótce</span>
          <h2>Znajdź <em>handlowca</em></h2>
          <p className="lead">Handlowcy z całego świata. Pracujemy nad tym. Chcesz wiedzieć pierwszy? Napisz: hello@jakubchodakowski.com</p>
          <div className="bruno-cta">
            <a className="btn solid" href="mailto:hello@jakubchodakowski.com?subject=Szukam%20handlowca">Napisz do mnie</a>
            <a className="btn" href="/" style={{ marginLeft: 10 }}>Strona główna</a>
          </div>
        </section>
      </main>
    </div>
  );
}
