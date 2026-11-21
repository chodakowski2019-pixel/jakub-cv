import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { AUTOR, BAZA, STRONA_SZKOLEN } from "@/lib/blog-ai";
import { BAZA_NARZEDZI } from "@/lib/narzedzia-ai";
import "./blog-ai.css";

// Wspólna rama bloga i katalogu narzędzi: listwa górna, stopka, kroje i styl (blog-ai.css).
// Kroje te same co na stronie szkoleń, z polskimi znakami.
const geist = Geist({ subsets: ["latin", "latin-ext"], variable: "--sza-sans", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin", "latin-ext"], variable: "--sza-mono", display: "swap" });

export function Rama({ children, etykieta, start }: { children: React.ReactNode; etykieta: string; start: string }) {
  return (
    <div className={`bai ${geist.variable} ${geistMono.variable}`}>
      <header className="bai-nav">
        <div className="bai-nav-wnetrze">
          <Link href={start} className="bai-logo">
            <span>{AUTOR.imie}</span>
            <span className="bai-mono">{etykieta}</span>
          </Link>
          <nav className="bai-menu">
            <Link href={BAZA} className="bai-mono">
              Teksty
            </Link>
            <Link href={BAZA_NARZEDZI} className="bai-mono">
              Narzędzia AI
            </Link>
            <Link href={STRONA_SZKOLEN} className="bai-mono">
              Szkolenie AI
            </Link>
            <Link href={`${STRONA_SZKOLEN}#formularz`} className="bai-przycisk bai-przycisk-maly">
              Sprawdź wolny termin
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="bai-stopka">
        <div className="bai-stopka-wnetrze">
          <p>{AUTOR.imie}. Szkolenia AI dla firm.</p>
          <p className="bai-mono">
            <Link href={BAZA}>Blog</Link>
            <span> · </span>
            <Link href={BAZA_NARZEDZI}>Narzędzia AI</Link>
            <span> · </span>
            <Link href={STRONA_SZKOLEN}>Szkolenie AI</Link>
            <span> · </span>
            <Link href="/polityka-prywatnosci">Polityka prywatności</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
