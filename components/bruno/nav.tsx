"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-2">
        <Link href={zalogowany ? "/bruno/panel" : "/bruno"} className="bruno-h2 text-lg mr-auto">
          <span className="bruno-gradient-tekst">Bruno</span> AI
        </Link>
        {zalogowany && (
          <>
            <nav className="bruno-nav hidden sm:flex items-center gap-0.5" aria-label="Panel">
              {LINKI.map((l) => (
                <Link key={l.href} href={l.href} aria-current={sciezka?.startsWith(l.href) ? "page" : undefined}>
                  {l.nazwa}
                </Link>
              ))}
            </nav>
            <button type="button" onClick={wyloguj} className="text-[13px] text-slate-500 hover:text-slate-900 px-2 py-1">
              Wyloguj
            </button>
          </>
        )}
      </div>
      {zalogowany && (
        <nav className="bruno-nav sm:hidden flex items-center gap-0.5 overflow-x-auto px-3 pb-2" aria-label="Panel">
          {LINKI.map((l) => (
            <Link key={l.href} href={l.href} aria-current={sciezka?.startsWith(l.href) ? "page" : undefined} className="whitespace-nowrap">
              {l.nazwa}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
