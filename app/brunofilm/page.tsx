import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import s from "./film.module.css";

// 30.10 (USER_001): salesbruno.pl/demo = film o korzyściach (dla Mauricio i jego firm). 30.10: bez podtytułu i przycisku (USER_001).
// Strona NIE indeksowana (USER_001 30.10), bez wpisu w sitemap. Lokalnie /brunofilm (proxy robi rewrite tylko na .pl).
// Film: Remotion `Projekty/bruno-film`, wersja końcowa v11 w `SalesAI/filmy/`.
const poppins = Poppins({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"] });

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export const metadata: Metadata = {
  title: "Bruno AI w 75 sekund",
  description: "Zobacz, jak Bruno AI trenuje Twoich handlowców i co widzisz jako szef.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function Page() {
  return (
    <main className={`${s.strona} ${poppins.className}`}>
      <header className={s.nav}>
        <img src="/bruno/ikona-96.png" alt="" width={36} height={36} />
        <span>Bruno AI</span>
      </header>
      <section className={s.srodek}>
        <h1 className={s.tytul}>Zobacz, jak działa Bruno AI</h1>
        <div className={s.ramka}>
          <video className={s.film} src="/bruno/demo-film-v11.mp4" poster="/bruno/demo-film-v11.jpg" controls playsInline preload="metadata" />
        </div>
      </section>
    </main>
  );
}
