import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Poppins, Open_Sans, Outfit } from "next/font/google";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { dostepKonta, kartyDoPowtorki, limitDzienny, pobierzKonfig, pobierzKonto, pobierzRozmowy, rozmowyDzis, stanFree } from "@/lib/bruno/db";
import { handlowcyFirmy, rozmowyZespolu } from "@/lib/bruno/firmy";
import { POSTACIE, postacLubDomyslna, type PostacId } from "@/lib/bruno/postacie";
import { etykiety } from "@/lib/bruno/etykiety";
import type { DaneKolumny } from "@/components/bruno/kolumna-rinesk";
import { ankietaWymagana } from "@/lib/bruno/ankieta-db";
import { kontekstFirmy } from "@/lib/bruno/firmy";
import UkladZloty from "@/components/bruno/uklad-zloty";
import CzatDymek from "@/components/bruno/czat-dymek";
import Kalkulator from "@/components/bruno/kalkulator";
import { JezykProvider } from "@/components/bruno/jezyk-kontekst";
import { DOMENA, jezykZHosta } from "@/lib/bruno/domeny";
import { tSerwer } from "@/lib/bruno/jezyk-serwer";
import { IKONY_BRUNO } from "@/components/podglad/bruno-lp/serwer";
import { motywAsset, motywRinesk } from "@/lib/bruno/motyw";
import "./bruno.css";
import "./motyw-asset.css";
import "./motyw-rinesk.css";

// Panel testowy Bruno AI (USER_001 30.09): logowanie stałym kodem, dostęp
// 7 dni od pierwszego logowania, 3 rozmowy po 3 minuty dziennie (1.10), feedback
// trenera, powtórki FSRS, „Dostosuj Bruno", „Ustawienia", „Odblokuj pełen dostęp".
// Na jakubchodakowski.com do czasu zakupu salesbruno.com.

// 11.10: tytuł karty w języku konta (niezalogowany: domena / ?pl).
export async function generateMetadata(): Promise<Metadata> {
  const { t, jezyk } = await tSerwer();
  return {
    metadataBase: new URL(DOMENA[jezyk]),
    title: t("Bruno AI: Sales Practice", "Bruno AI: panel treningowy"),
    description: t("Train your sales", "Trenuj sprzedaż"),
    robots: { index: false, follow: false },
    icons: IKONY_BRUNO,
    // 21.10 (USER_001): ta sama miniaturka co na stronach publicznych, bo linki do panelu idą SMS-em i na WhatsApp.
    openGraph: { siteName: "Bruno AI", images: [{ url: "/bruno/og-bruno-2.png", width: 1200, height: 630, alt: "Bruno AI" }] },
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin", "latin-ext"], weight: ["600", "700", "800"] });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600"] });
const openSans = Open_Sans({ variable: "--font-open-sans", subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"] });

/** 10.10: po 3 darmowych rozmowach konto free widzi tylko te ekrany (reszta → Bruno Pro). */
// 18.10 (USER_001): po rozmowie demo przewodnik idzie jeszcze przez fiszki, więc Trening zostaje otwarty.
const PO_BLOKADZIE = ["/bruno/odblokuj", "/bruno/feedback", "/bruno/ustawienia", "/bruno/trening"];

export default async function BrunoLayout({ children }: { children: React.ReactNode }) {
  const email = await zalogowanyEmail();
  const konto = email ? await pobierzKonto(email) : null;
  // 9.10: zakładka „Ogień" tylko w pełnym dostępie; 10.10: „Statystyki" nie dla free.
  const dostep = dostepKonta(konto);
  const fonty = `${poppins.variable} ${openSans.variable} ${outfit.variable}`;
  // 9.10 (USER_001): niezalogowany widzi logowanie Aurora na cały ekran, bez paska, tła i stopki panelu.
  // 11.10: język panelu = język konta; niezalogowany = domena (salesbruno.pl) albo ?pl (nagłówek x-jezyk z proxy).
  const h = await headers();
  const jezyk = konto?.jezyk === "pl" || konto?.jezyk === "en" ? konto.jezyk : ((h.get("x-jezyk") as "pl" | "en" | null) ?? jezykZHosta(h.get("host")) ?? "en");
  if (!email) return <JezykProvider jezyk={jezyk}><div className={`bruno-tlo ${fonty}`}>{children}</div></JezykProvider>;

  // Blokada free po 3 rozmowach na pierwszym wejściu (twarde wejście z adresu). Przejścia między
  // zakładkami pilnuje UkladZloty w przeglądarce, bo układ nie renderuje się przy nich od nowa.
  const sciezka = h.get("x-sciezka") ?? "";
  const free = dostep.free ? await stanFree(konto) : null;
  if (free?.zablokowane && sciezka && !PO_BLOKADZIE.some((p) => sciezka === p || sciezka.startsWith(`${p}/`))) {
    redirect("/bruno/odblokuj");
  }
  // 11.10 (USER_001): po rejestracji (e-mail + hasło) najpierw profil, dopiero potem panel.
  const profilBrak = Boolean(konto && !konto.profil_at);
  if (profilBrak && sciezka && sciezka !== "/bruno/start") redirect("/bruno/start");
  // 21.10 (USER_001): po profilu ankieta Mazura (przed 1. treningiem i co 30 dni). Bez konta demo
  // (szef firmy testuje) i bez konta free po blokadzie (ono idzie do „Odblokuj”, inaczej pętla).
  // 25.10: konto demo (firma z skryptu bruno-demo-firma) bez ankiety: szef loguje się na spotkaniu i od razu widzi zespół.
  const demo = Boolean(konto?.demo);
  const ankietaBrak = Boolean(konto && !profilBrak && !free?.zablokowane && (await ankietaWymagana(email, free?.pula === 1 || demo)));
  if (ankietaBrak && sciezka && sciezka !== "/bruno/ankieta") redirect("/bruno/ankieta");

  // 25.10 (USER_001): firma konta (logo w pasku) i czy to szef (zakładka „Zespół”, przełącznik widoku).
  const { szef, logo } = await kontekstFirmy(konto);

  // 10.10 (USER_001: „cały ten Bruno się zmienia”): wszystkie ekrany czarno-złote. Panel ma własny pasek,
  // reszta wspólny; o tym decyduje UkladZloty po adresie w przeglądarce.
  const inicjal = (konto?.imie?.trim()?.[0] ?? email[0] ?? "B").toUpperCase();

  // 27.10 (USER_001: pasek z lewej jak Vaulto, kolumna z prawej jak Alexatel): dane do paska (plan dnia, fiszki)
  // i do prawej kolumny (postać, wiadomości = ostatnie ocenione rozmowy, żetony = typy klienta). Tylko w motywie Rinesk.
  let plan: { dzis: number; dziennie: number } | null = null;
  let fiszki = 0;
  let kolumna: DaneKolumny | null = null;
  if (motywRinesk() && konto) {
    const E = etykiety(jezyk);
    const [dzis, karty, konfig] = await Promise.all([rozmowyDzis(email), kartyDoPowtorki(email, 50, konto.jezyk), pobierzKonfig(email)]);
    plan = { dzis, dziennie: limitDzienny(konto) };
    fiszki = karty.length;
    const postacId = postacLubDomyslna(konfig.postac);
    const nazwaKlienta = (id: string | null) => E.POSTACIE[postacLubDomyslna(id)].nazwa.toLowerCase();
    const kiedy = (iso: string) => new Date(iso).toLocaleDateString(jezyk === "pl" ? "pl-PL" : "en-US", { day: "numeric", month: "short", timeZone: "Europe/Warsaw" });
    const klient = (id: string | null) => (jezyk === "pl" ? `klient ${nazwaKlienta(id)}` : `${nazwaKlienta(id)} customer`);
    let wiadomosci: DaneKolumny["wiadomosci"] = [];
    if (szef && konto.firma_id) {
      const handlowcy = (await handlowcyFirmy(konto.firma_id)).filter((h) => h.email !== email);
      const rozmowy = await rozmowyZespolu(handlowcy.map((h) => h.email), 30);
      // 28.10 (USER_001): pod imieniem TYLKO „śr. rozmów 8,42/10” (średnia ocen z 30 dni, 2 miejsca po przecinku).
      wiadomosci = handlowcy
        .map((h) => {
          const oceny = rozmowy.filter((x) => x.email === h.email && typeof x.ocena === "number").map((x) => x.ocena as number);
          if (!oceny.length) return null;
          const sr = (oceny.reduce((a, b) => a + b, 0) / oceny.length).toLocaleString(jezyk === "pl" ? "pl-PL" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          return { imie: h.imie ?? h.email, zdjecie: h.zdjecie_url ?? null, tekst: jezyk === "pl" ? `śr. rozmów ${sr}/10` : `avg. calls ${sr}/10`, href: `/bruno/szef/${encodeURIComponent(h.email)}` };
        })
        .filter((x): x is NonNullable<typeof x> => Boolean(x))
        .slice(0, 5);
    } else {
      const rozmowy = (await pobierzRozmowy(email, 20)).filter((r) => typeof r.ocena === "number").slice(0, 5);
      wiadomosci = rozmowy.map((r) => ({ imie: `${kiedy(r.start)} · ${klient(r.postac)} · ${r.ocena}/10`, zdjecie: null, tekst: r.feedback?.poprawka || r.feedback?.wygrana || klient(r.postac), href: `/bruno/feedback/${r.id}` }));
    }
    kolumna = {
      postac: klient(postacId),
      zdjecie: konto.zdjecie_url ?? logo?.url ?? null,
      inicjal,
      wiadomosci,
      zetony: (Object.keys(POSTACIE) as PostacId[]).map((id) => ({ nazwa: jezyk === "pl" ? `Klient ${E.POSTACIE[id].nazwa.toLowerCase()}` : `${E.POSTACIE[id].nazwa} customer`, kolor: POSTACIE[id].kolor, href: `/bruno/rozmowa?postac=${id}` })),
    };
  }
  return (
    <JezykProvider jezyk={jezyk}>
    <div className={`bruno zloty ${motywRinesk() ? "rinesk" : motywAsset() ? "asset" : ""} ${fonty} font-[var(--font-open-sans)]`}>
      <UkladZloty dostep={{ ...dostep, szef }} inicjal={inicjal} free={free} profilBrak={profilBrak} ankietaBrak={ankietaBrak} logo={logo} rinesk={motywRinesk()} plan={plan} fiszki={fiszki} kolumna={kolumna}>
        {children}
      </UkladZloty>
      {/* 25.10 (USER_001): dymek czatu zostaje; obok niego kalkulator sprzedażowy (szef i konta demo). */}
      {/* 27.10 (USER_001): kółka (kalkulator + dymek czatu) ZOSTAJĄ; z prawej kolumny wylatują „Zapytaj Bruno” i „Trenuj z”. */}
      {!profilBrak && !ankietaBrak && (
        <>
          {(szef || demo) && <Kalkulator handlowcy={konto?.handlowcy} />}
          <CzatDymek />
        </>
      )}
    </div>
    </JezykProvider>
  );
}
