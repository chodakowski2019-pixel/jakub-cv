import Link from "next/link";
import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import {
  ROZMOWA_SEKUND,
  ROZMOW_DZIENNIE,
  kartyDoPowtorki,
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

export const dynamic = "force-dynamic";

export default async function BrunoPanelPage() {
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
  const rozmowy = wszystkie.slice(0, 5);
  const minutZostalo = Math.max(0, Math.floor((konto.limit_sekund - zuzyte) / 60));
  const postac = postacLubDomyslna(konfig.postac);
  const skonfigurowany = Boolean(konfig.produkt.trim() || konfig.klient.trim());
  const pierwszaKarta = karty[0] ?? null;
  const zostaloDzis = Math.max(0, ROZMOW_DZIENNIE - dzis);
  const planZrobiony = zostaloDzis === 0;
  const linkRozmowy = pierwszaKarta ? `/bruno/rozmowa?karta=${pierwszaKarta.id}` : "/bruno/rozmowa";

  const moznaRozmawiac = !planZrobiony && minutZostalo >= 1;
  const dniUplynelo = Math.max(0, konto.dni - stan.dniZostalo);
  const slupki = rozmowyNaDni(wszystkie, 7);

  return (
    <div className="flex flex-col gap-6">
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

      <div className="grid md:grid-cols-2 gap-4 md:gap-6 items-stretch">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Pierscien wartosc={dniUplynelo} max={konto.dni} liczba={`${stan.dniZostalo}`} opis={stan.dniZostalo === 1 ? "dzień dostępu" : "dni dostępu"} uwaga={stan.koniec ? `do ${stan.koniec.toLocaleDateString("pl-PL")}` : `z ${konto.dni}, od pierwszego logowania`} />
            <Pierscien wartosc={dzis} max={ROZMOW_DZIENNIE} liczba={`${dzis}/${ROZMOW_DZIENNIE}`} opis="rozmów dziś" uwaga={planZrobiony ? "plan dnia zrobiony" : `zostało ${zostaloDzis}, każda ${ROZMOWA_SEKUND / 60} min`} />
          </div>
          <Slupki dni={slupki} cel={ROZMOW_DZIENNIE} tytul="Rozmowy w ostatnich 7 dniach" />
        </div>

        <div className="bruno-szklo rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center justify-center gap-3">
          {moznaRozmawiac ? (
            <Link href={linkRozmowy} aria-label={`Rozmawiaj z Bruno: ${POSTACIE[postac].nazwa}`} className="relative size-44 sm:size-52 grid place-items-center group">
              <span className="bruno-kula absolute inset-0 rounded-full blur-2xl transition-transform duration-200 group-hover:scale-105" style={{ background: "radial-gradient(circle at 45% 40%, #67e8f9 0%, #0e7490 48%, rgba(14,116,144,0) 74%)" }} aria-hidden />
              <span className="relative text-white bruno-h2 text-base sm:text-lg drop-shadow-[0_2px_8px_rgba(14,116,144,0.6)]">Rozmawiaj</span>
            </Link>
          ) : (
            <div className="relative size-44 sm:size-52 grid place-items-center">
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

      <div className="grid md:grid-cols-2 gap-4 md:gap-6 items-start">
      <section className="bruno-szklo rounded-3xl p-6">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="bruno-h2 text-lg">Do powtórki</h2>
          <span className="text-xs text-slate-400">plan powtórek układa się sam po każdej rozmowie</span>
        </div>
        {karty.length === 0 ? (
          <p className="text-sm text-slate-600">Nic nie czeka. Po pierwszej rozmowie Bruno zaplanuje, do czego wrócić i kiedy.</p>
        ) : (
          <ul className="divide-y divide-slate-200/70">
            {karty.map((k) => (
              <li key={k.id} className="py-2.5 flex items-center gap-3">
                <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md ${k.typ === "obiekcja" ? "bg-cyan-700/10 text-cyan-800" : "bg-slate-200/70 text-slate-600"}`}>
                  {k.typ === "obiekcja" ? "obiekcja" : "umiejętność"}
                </span>
                <span className="text-sm text-slate-800 flex-1 truncate">{k.typ === "kryterium" ? NAZWY[k.tresc as keyof typeof NAZWY] ?? k.tresc : k.tresc}</span>
                {!planZrobiony && minutZostalo >= 1 && (
                  <Link href={`/bruno/rozmowa?karta=${k.id}`} className="bruno-przycisk-2 py-1.5 px-3 text-[13px]">Trenuj</Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bruno-szklo rounded-3xl p-6">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="bruno-h2 text-lg">Ostatnie rozmowy</h2>
          <Link href="/bruno/historia" className="text-sm text-cyan-800 hover:underline">Cała historia</Link>
        </div>
        {rozmowy.length === 0 ? (
          <p className="text-sm text-slate-600">Jeszcze nic. Pierwsza rozmowa pojawi się tutaj z oceną.</p>
        ) : (
          <ul className="divide-y divide-slate-200/70">
            {rozmowy.map((r) => (
              <li key={r.id} className="py-2.5 flex items-center gap-3 text-sm">
                <span className="text-slate-500 w-24 shrink-0">{new Date(r.start).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                <span className="flex-1 text-slate-800 truncate">{POSTACIE[postacLubDomyslna(r.postac)].nazwa}{r.sekundy ? `, ${Math.round(r.sekundy / 60)} min` : ""}</span>
                {r.status === "zakonczona" && r.ocena ? (
                  <Link href={`/bruno/historia/${r.id}`} className="font-semibold bruno-gradient-tekst">{r.ocena}/10</Link>
                ) : (
                  <span className="text-slate-400 text-xs">{r.status === "trwa" ? "w toku" : "przerwana"}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      </div>
    </div>
  );
}
