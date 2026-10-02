"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// Układ panelu (USER_001 1.10): wąski pasek Z LEWEJ z logo i zakładkami
// (Panel, Historia, Dostosuj Bruno, Ustawienia), na górze po środku
// „Odblokuj pełen dostęp" z kłódką, z prawej „Wyloguj". Na telefonie pasek
// boczny chowa się, zakładki idą poziomo pod górną belką.

// Dwie najważniejsze zakładki (USER_001 2.10): TRENING = fiszki (nauka),
// TEST = rozmowa z Bruno (egzamin). FEEDBACK = oceny rozmów (dawniej Historia).
const LINKI = [
  { href: "/bruno/panel", nazwa: "Panel", ikona: "panel" },
  { href: "/bruno/trening", nazwa: "Trening", ikona: "trening" },
  { href: "/bruno/rozmowa", nazwa: "Test", ikona: "test" },
  { href: "/bruno/feedback", nazwa: "Feedback", ikona: "feedback" },
  { href: "/bruno/statystyki", nazwa: "Statystyki", ikona: "statystyki" },
  { href: "/bruno/dostosuj", nazwa: "Dostosuj Bruno", ikona: "dostosuj" },
  { href: "/bruno/ustawienia", nazwa: "Ustawienia", ikona: "ustawienia" },
] as const;

function Ikona({ nazwa }: { nazwa: (typeof LINKI)[number]["ikona"] | "klodka" | "wyjscie" }) {
  const wspolne = { viewBox: "0 0 24 24", width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, className: "shrink-0" };
  switch (nazwa) {
    case "panel":
      return <svg {...wspolne}><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="5" rx="2" /><rect x="13" y="11" width="8" height="10" rx="2" /><rect x="3" y="14" width="8" height="7" rx="2" /></svg>;
    case "trening":
      return <svg {...wspolne}><rect x="3" y="5" width="13" height="15" rx="2" /><path d="M8 3h11a2 2 0 0 1 2 2v11" /><path d="M7 12h5M7 15.5h3" /></svg>;
    case "test":
      return <svg {...wspolne}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>;
    case "feedback":
      return <svg {...wspolne}><path d="M21 12a8 8 0 0 1-8 8H8l-5 3 1.5-4.5A8 8 0 1 1 21 12z" /><path d="M9 11l2 2 4-4" /></svg>;
    case "statystyki":
      return <svg {...wspolne}><path d="M4 20h16" /><rect x="6" y="11" width="3.5" height="9" rx="1" /><rect x="12" y="6" width="3.5" height="14" rx="1" /><rect x="18" y="14" width="3.5" height="6" rx="1" transform="translate(-3 0)" /></svg>;
    case "dostosuj":
      return <svg {...wspolne}><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2.2" /><circle cx="10" cy="17" r="2.2" /></svg>;
    case "ustawienia":
      return <svg {...wspolne}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>;
    case "klodka":
      return <svg {...wspolne} width={15} height={15}><rect x="4" y="11" width="16" height="10" rx="2.5" /><path d="M8 11V7.5a4 4 0 0 1 8 0V11" /></svg>;
    case "wyjscie":
      return <svg {...wspolne} width={16} height={16}><path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" /><path d="M14 8l4 4-4 4M18 12H9" /></svg>;
  }
}

function Logo({ zalogowany }: { zalogowany: boolean }) {
  return (
    <Link href={zalogowany ? "/bruno/panel" : "/bruno"} className="bruno-h2 text-lg shrink-0">
      <span className="bruno-gradient-tekst">Bruno</span> AI
    </Link>
  );
}

/** Wąski pasek boczny (tylko od szerokości sm). */
export function BrunoPasek() {
  const sciezka = usePathname();
  return (
    <aside className="bruno-pasek-boczny hidden sm:flex flex-col w-52 bruno-szklo rounded-none border-y-0 border-l-0 px-3 py-4 gap-6">
      <div className="px-2">
        <Logo zalogowany />
      </div>
      <nav className="bruno-pasek flex flex-col gap-1" aria-label="Panel">
        {LINKI.map((l) => (
          <Link key={l.href} href={l.href} aria-current={sciezka?.startsWith(l.href) ? "page" : undefined}>
            <Ikona nazwa={l.ikona} />
            {l.nazwa}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

/** Górna belka: po środku „Odblokuj pełen dostęp", z prawej „Wyloguj". Na telefonie dodatkowo logo i zakładki. */
export default function BrunoNav({ zalogowany }: { zalogowany: boolean }) {
  const sciezka = usePathname();
  const router = useRouter();
  const wyloguj = async () => {
    await fetch("/api/bruno/wyloguj", { method: "POST" });
    router.push("/bruno");
    router.refresh();
  };

  if (!zalogowany) {
    return (
      <header className="sticky top-0 z-10 bruno-szklo border-x-0 border-t-0 rounded-none">
        <div className="h-14 flex items-center justify-center">
          <Logo zalogowany={false} />
        </div>
      </header>
    );
  }

  const odblokuj = sciezka?.startsWith("/bruno/odblokuj");
  return (
    <header className="sticky top-0 z-10 bruno-szklo border-x-0 border-t-0 rounded-none">
      <div className="relative h-14 px-4 sm:px-6 flex items-center justify-between sm:justify-center">
        <div className="sm:hidden">
          <Logo zalogowany />
        </div>
        {/* Środek całej szerokości strony, nie obszaru obok paska: na sm+ przesunięcie o pół szerokości paska (13rem / 2). */}
        <Link
          href="/bruno/odblokuj"
          aria-current={odblokuj ? "page" : undefined}
          className={`bruno-odblokuj inline-flex items-center gap-2 whitespace-nowrap sm:-translate-x-[6.5rem] ${odblokuj ? "bruno-odblokuj-aktywny" : ""}`}
        >
          <Ikona nazwa="klodka" />
          Odblokuj pełen dostęp
        </Link>
        <button type="button" onClick={wyloguj} className="bruno-wyloguj sm:absolute sm:right-6 inline-flex items-center gap-1.5">
          <Ikona nazwa="wyjscie" />
          <span className="hidden sm:inline">Wyloguj</span>
        </button>
      </div>
      <nav className="sm:hidden bruno-nav flex items-center gap-1 overflow-x-auto px-3 pb-2" aria-label="Panel">
        {LINKI.map((l) => (
          <Link key={l.href} href={l.href} aria-current={sciezka?.startsWith(l.href) ? "page" : undefined} className="whitespace-nowrap">
            {l.nazwa}
          </Link>
        ))}
      </nav>
    </header>
  );
}
