"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// Nagłówek panelu (USER_001 1.10): logo wyśrodkowane, „Wyloguj" w prawym
// górnym rogu, zakładki równo rozstawione, „Odblokuj pełen dostęp" z kłódką.

const LINKI = [
  { href: "/bruno/panel", nazwa: "Panel" },
  { href: "/bruno/historia", nazwa: "Historia" },
  { href: "/bruno/dostosuj", nazwa: "Dostosuj Bruno" },
  { href: "/bruno/ustawienia", nazwa: "Ustawienia" },
  { href: "/bruno/odblokuj", nazwa: "Odblokuj pełen dostęp", klodka: true },
];

function Klodka() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
      <rect x="4" y="11" width="16" height="10" rx="2.5" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
    </svg>
  );
}

export default function BrunoNav({ zalogowany }: { zalogowany: boolean }) {
  const sciezka = usePathname();
  const router = useRouter();
  const wyloguj = async () => {
    await fetch("/api/bruno/wyloguj", { method: "POST" });
    router.push("/bruno");
    router.refresh();
  };
  return (
    <header className="sticky top-0 z-10 bruno-szklo border-x-0 border-t-0 rounded-none">
      {/* Jeden pasek (USER_001 1.10): logo z lewej, zakładki w środku, „Wyloguj" z prawej. */}
      <div className={`max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4 ${zalogowany ? "justify-between" : "justify-center"}`}>
        <Link href={zalogowany ? "/bruno/panel" : "/bruno"} className="bruno-h2 text-lg shrink-0">
          <span className="bruno-gradient-tekst">Bruno</span> AI
        </Link>
        {zalogowany && (
          <>
            <nav className="bruno-nav flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto min-w-0 flex-1" aria-label="Panel">
              {LINKI.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={sciezka?.startsWith(l.href) ? "page" : undefined}
                  className={`whitespace-nowrap inline-flex items-center gap-1.5 ${l.klodka ? "bruno-nav-klodka" : ""}`}
                >
                  {l.klodka && <Klodka />}
                  {l.nazwa}
                </Link>
              ))}
            </nav>
            <button
              type="button"
              onClick={wyloguj}
              className="shrink-0 text-[13px] text-slate-500 hover:text-slate-900 px-2.5 py-1 rounded-lg hover:bg-slate-900/5"
            >
              Wyloguj
            </button>
          </>
        )}
      </div>
    </header>
  );
}
