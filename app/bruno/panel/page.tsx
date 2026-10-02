import Link from "next/link";
import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import {
  ROZMOWA_SEKUND,
  kartyDoPowtorki,
  limitDzienny,
  pobierzKonfig,
  pobierzKonto,
  pobierzRozmowy,
  rozmowyDzis,
  stanDostepu,
  zamknijPorzucone,
  zuzyteSekundy,
} from "@/lib/bruno/db";
import { NAZWY } from "@/lib/bruno/kryteria";
import { POSTACIE, postacLubDomyslna } from "@/lib/bruno/postacie";
import { Pierscien, Slupki, rozmowyNaDni } from "@/components/bruno/statystyki";
import TourPopup from "@/components/bruno/tour-popup";

/** Film oprowadzający (2.10): plik statyczny w public/. Wersja w nazwie = nowy plik przy zmianie filmu. */
const FILM_OPROWADZAJACY = "/bruno/oprowadzanie-v8.mp4";

export const dynamic = "force-dynamic";

export default async function BrunoPanelPage({ searchParams }: { searchParams: Promise<{ tour?: string }> }) {
  const { tour } = await searchParams;
  const email = await zalogowanyEmail();
  if (!email) redirect("/bruno");
  const konto = await pobierzKonto(email);
  const stan = stanDostepu(konto);
  if (!konto || !stan.aktywny) {
    return (
      <div className="bruno-szklo rounded-3xl p-8 text-center">
        <h1 className="bruno-h1 text-2xl mb-3">Dostęp testowy wygasł</h1>
        <p className="text-slate-600 mb-6">7 dni minęło. Jeśli chcesz dalej trenować z Bruno, napisz do nas.</p>
        <Link href="/bruno/odblokuj" className="bruno-przycisk">Odblokuj pełen dostęp</Link>
      </div>
    );
  }

  await zamknijPorzucone(email);
  const [zuzyte, dzis, karty, konfig, wszystkie] = await Promise.all([
    zuzyteSekundy(email),
    rozmowyDzis(email),
    kartyDoPowtorki(email, 6),
    pobierzKonfig(email),
    pobierzRozmowy(email, 200),
  ]);
  const minutZostalo = Math.max(0, Math.floor((konto.limit_sekund - zuzyte) / 60));
  const postac = postacLubDomyslna(konfig.postac);
  const skonfigurowany = Boolean(konfig.produkt.trim() || konfig.klient.trim());
  // Do Testu tylko karty umiejętności i obiekcji; poprawki i wiedza żyją w Treningu (2.10).
  const pierwszaKarta = karty.find((k) => k.typ === "kryterium" || k.typ === "obiekcja") ?? null;
  const dziennie = limitDzienny(konto);
  const zostaloDzis = Math.max(0, dziennie - dzis);
  const planZrobiony = zostaloDzis === 0;
  const linkRozmowy = pierwszaKarta ? `/bruno/rozmowa?karta=${pierwszaKarta.id}` : "/bruno/rozmowa";

  const moznaRozmawiac = !planZrobiony && minutZostalo >= 1;
  const dniUplynelo = Math.max(0, konto.dni - stan.dniZostalo);
  const slupki = rozmowyNaDni(wszystkie, 7);

  // Popup z filmem: przy pierwszym wejściu (tour_obejrzany_at puste) albo na życzenie (?tour=1 z Ustawień).
  const pokazTour = tour === "1" || !konto.tour_obejrzany_at;

  return (
    <div className="flex flex-col gap-6">
      {pokazTour && <TourPopup src={FILM_OPROWADZAJACY} />}
      {/* Układ v3 (USER_001 1.10): nagłówek na środku, lewa połowa = wykresy, prawa = pulsująca kula jako następna rozmowa. */}
      <h1 className="bruno-h1 text-[1.9rem] sm:text-[2.4rem] text-center">
        {konto.imie ? `Cześć, ${konto.imie}.` : "Cześć."}{" "}
        {planZrobiony ? <span className="bruno-gradient-tekst">Plan na dziś zrobiony.</span> : <span className="bruno-gradient-tekst">Dziś: {zostaloDzis} {zostaloDzis === 1 ? "rozmowa" : "rozmowy"}.</span>}
      </h1>

      {!skonfigurowany && (
        <div className="bruno-szklo rounded-2xl p-5 border-amber-200/80 bg-amber-50/70">
          <p className="text-sm text-amber-900">
            Bruno nie wie jeszcze, co sprzedajesz. <Link href="/bruno/dostosuj" className="font-semibold underline">Dostosuj Bruno</Link> (2 minuty), inaczej gra klienta ogólnego.
          </p>
        </div>
      )}

      {/* Dwa symetryczne panele (USER_001 2.10): lewy = statystyki w jednej karcie, prawy = kula. Bez list pod spodem. */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-6 items-stretch">
        <div className="bruno-szklo rounded-3xl p-6 sm:p-8 flex flex-col gap-4 min-h-[30rem]">
          <div className="grid grid-cols-2 gap-3">
            <Pierscien goly wartosc={dniUplynelo} max={konto.dni} liczba={`${stan.dniZostalo}`} opis={stan.dniZostalo === 1 ? "dzień dostępu" : "dni dostępu"} uwaga={stan.koniec ? `do ${stan.koniec.toLocaleDateString("pl-PL")}` : `z ${konto.dni}, od pierwszego logowania`} />
            <Pierscien goly wartosc={dzis} max={dziennie} liczba={`${dzis}/${dziennie}`} opis="rozmów dziś" uwaga={planZrobiony ? "plan dnia zrobiony" : `zostało ${zostaloDzis}, każda ${ROZMOWA_SEKUND / 60} min`} />
          </div>
          <Slupki goly wysoki dni={slupki} cel={dziennie} tytul="Rozmowy w ostatnich 7 dniach" />
        </div>

        <div className="bruno-szklo rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center justify-center gap-3 min-h-[30rem]">
          {moznaRozmawiac ? (
            <Link href={linkRozmowy} aria-label={`Rozmawiaj z Bruno: ${POSTACIE[postac].nazwa}`} className="relative size-52 sm:size-60 grid place-items-center group">
              <span className="bruno-kula absolute inset-0 rounded-full blur-2xl transition-transform duration-200 group-hover:scale-105" style={{ background: "radial-gradient(circle at 45% 40%, #67e8f9 0%, #0e7490 48%, rgba(14,116,144,0) 74%)" }} aria-hidden />
              <span className="relative text-white bruno-h2 text-base sm:text-lg drop-shadow-[0_2px_8px_rgba(14,116,144,0.6)]">Rozmawiaj</span>
            </Link>
          ) : (
            <div className="relative size-52 sm:size-60 grid place-items-center">
              <span className="bruno-kula bruno-kula-czeka absolute inset-0 rounded-full blur-2xl" style={{ background: "radial-gradient(circle at 45% 40%, #a5f3fc 0%, #64748b 48%, rgba(100,116,139,0) 74%)" }} aria-hidden />
              <span className="relative text-sm text-slate-600 max-w-[9rem]">{planZrobiony ? "Wróć jutro. Przypomnimy mailem rano." : "Limit minut testu wyczerpany."}</span>
            </div>
          )}
          <div className="bruno-h2 text-xl sm:text-2xl flex items-center justify-center gap-2">
            <span className="size-3.5 rounded-full shrink-0" style={{ background: POSTACIE[postac].kolor }} aria-hidden />
            Klient {POSTACIE[postac].nazwa.toLowerCase()}
          </div>
          <p className="text-sm text-slate-600">
            {pierwszaKarta
              ? pierwszaKarta.typ === "obiekcja"
                ? <>Powtórka obiekcji: <b className="text-slate-900">„{pierwszaKarta.tresc}”</b></>
                : <>Powtórka: <b className="text-slate-900">{NAZWY[pierwszaKarta.tresc as keyof typeof NAZWY] ?? pierwszaKarta.tresc}</b></>
              : POSTACIE[postac].opis}
          </p>
          {moznaRozmawiac && <Link href={linkRozmowy} className="bruno-przycisk text-base px-8 py-3.5 mt-1">Rozmawiaj z Bruno</Link>}
          <div className="text-xs text-slate-400">Rodzaj rozmowy, obiekcję, cel i typ klienta wybierasz przed startem.</div>
        </div>
      </div>
    </div>
  );
}
