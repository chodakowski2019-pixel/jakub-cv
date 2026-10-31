import type { Viewport } from "next";
import Link from "next/link";
import { Poppins } from "next/font/google";
import s from "./blog.module.css";

// 31.10 (USER_001): blog Bruno na salesbruno.pl/blog (proxy: rewrite na /brunoblog, lokalnie też /blog).
// Układ jak czytelnia lovemyself, kolory Bruno (blog.module.css).
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

const poppins = Poppins({ variable: "--font-elm", subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"] });

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${s.strona} ${poppins.variable}`}>
      <header className={s.nav}>
        <div className={s.navWnetrze}>
          <Link href="/blog" className={s.logo}>
            <img src="/bruno/ikona-96.png" alt="" width={32} height={32} />
            <span>Bruno AI</span>
          </Link>
          <nav className={s.menu}>
            <Link href="/blog">Blog</Link>
            <Link href="/kursy">Kursy</Link>
            <Link href="/kursy/test">Test</Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className={s.stopka}>Bruno AI · Jakub Chodakowski · salesbruno.pl</footer>
    </div>
  );
}
