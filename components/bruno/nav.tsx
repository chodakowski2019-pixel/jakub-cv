"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// Logo wyśrodkowane na każdej szerokości (USER_001 30.09): „Wyloguj" leży
// nad nim pozycją bezwzględną, a zakładki idą osobnym, też wyśrodkowanym
// wierszem, żeby nie przepychały logo w bok.

const LINKI = [
  { href: "/bruno/panel", nazwa: "Panel" },
  { href: "/bruno/historia", nazwa: "Historia" },
  { href: "/bruno/dostosuj", nazwa: "Dostosuj Bruno" },
  { href: "/bruno/odblokuj", nazwa: "Odblokuj pełen dostęp" },
];

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
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-center">
        <Link href={zalogowany ? "/bruno/panel" : "/bruno"} className="bruno-h2 text-lg">
          <span className="bruno-gradient-tekst">Bruno</span> AI
        </Link>
        {zalogowany && (
          <button
            type="button"
            onClick={wyloguj}
            className="absolute right-3 sm:right-5 text-[13px] text-slate-500 hover:text-slate-900 px-2 py-1"
          >
            Wyloguj
          </button>
        )}
      </div>
      {zalogowany && (
        <nav className="bruno-nav flex items-center justify-center gap-0.5 overflow-x-auto px-3 pb-2" aria-label="Panel">
          {LINKI.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={sciezka?.startsWith(l.href) ? "page" : undefined}
              className="whitespace-nowrap"
            >
              {l.nazwa}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
