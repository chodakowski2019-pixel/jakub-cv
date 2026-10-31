import Link from "next/link";
import s from "./kursy.module.css";

// 30.10: rama wyszukiwarki i testu (ciemne tło, pasek z logo). Strona kursu ma własny układ (components/bruno/kurs-lp.tsx).
export default function Rama({ children }: { children: React.ReactNode }) {
  return (
    <main className={s.strona} style={{ fontFamily: 'var(--font-elm), "Poppins", system-ui, sans-serif' }}>
      <header className={s.nav}>
        <div className={s.navWnetrze}>
          <Link href="/kursy" className={s.logo}>
            <img src="/bruno/ikona-96.png" alt="" width={34} height={34} />
            <span>Bruno AI · Kursy sprzedaży</span>
          </Link>
        </div>
      </header>
      {children}
      <footer className={s.stopka}>Bruno AI · Jakub Chodakowski · salesbruno.pl</footer>
    </main>
  );
}
