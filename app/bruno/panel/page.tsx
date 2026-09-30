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
  zuzyteSekundy,
} from "@/lib/bruno/db";
import { NAZWY } from "@/lib/bruno/kryteria";
import { POSTACIE, postacLubDomyslna } from "@/lib/bruno/postacie";

export const dynamic = "force-dynamic";

function Kafelek({ liczba, opis, uwaga }: { liczba: string; opis: string; uwaga?: string }) {
  return (
    <div className="bruno-szklo rounded-2xl p-4 sm:p-5">
      <div className="bruno-h2 text-[1.9rem] bruno-gradient-tekst leading-none">{liczba}</div>
      <div className="text-sm text-slate-700 mt-1.5">{opis}</div>
      {uwaga && <div className="text-[11px] text-slate-400 mt-1">{uwaga}</div>}
    </div>
  );
}

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

  const [zuzyte, dzis, karty, konfig, rozmowy] = await Promise.all([
    zuzyteSekundy(email),
    rozmowyDzis(email),
    kartyDoPowtorki(email, 6),
    pobierzKonfig(email),
    pobierzRozmowy(email, 5),
  ]);
  const minutZostalo = Math.max(0, Math.floor((konto.limit_sekund - zuzyte) / 60));
  const postac = postacLubDomyslna(konfig.postac);
  const skonfigurowany = Boolean(konfig.produkt.trim() || konfig.klient.trim());
  const pierwszaKarta = karty[0] ?? null;
  const ostatnia = rozmowy.find((r) => r.status === "zakonczona" && r.ocena);
  const planZrobiony = dzis >= ROZMOW_DZIENNIE;
  const linkRozmowy = pierwszaKarta ? `/bruno/rozmowa?karta=${pierwszaKarta.id}` : "/bruno/rozmowa";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="bruno-h1 text-[1.9rem] sm:text-[2.4rem]">
          {konto.imie ? `Cześć, ${konto.imie}.` : "Cześć."}{" "}
          {planZrobiony ? <span className="bruno-gradient-tekst">Plan na dziś zrobiony.</span> : <span className="bruno-gradient-tekst">Dziś: {ROZMOW_DZIENNIE - dzis} {ROZMOW_DZIENNIE - dzis === 1 ? "rozmowa" : "rozmowy"}.</span>}
        </h1>
        <p className="text-slate-600 mt-2">
          {ROZMOW_DZIENNIE} rozmowy po {ROZMOWA_SEKUND / 60} minut dziennie. Po każdej dostajesz ocenę, jeden cytat na kryterium i jedną rzecz do poprawy.
        </p>
      </div>

      {!skonfigurowany && (
        <div className="bruno-szklo rounded-2xl p-5 border-amber-200/80 bg-amber-50/70">
          <p className="text-sm text-amber-900">
            Bruno nie wie jeszcze, co sprzedajesz. <Link href="/bruno/dostosuj" className="font-semibold underline">Dostosuj Bruno</Link> (2 minuty), inaczej gra klienta ogólnego.
          </p>
        </div>
      )}

      <div className="bruno-szklo rounded-3xl p-6 sm:p-8 text-center">
        <div className="text-xs font-semibold text-slate-500 tracking-wide uppercase mb-2">Następna rozmowa</div>
        <div className="bruno-h2 text-xl sm:text-2xl mb-1">{POSTACIE[postac].nazwa}</div>
        <p className="text-sm text-slate-600 mb-5">
          {pierwszaKarta
            ? pierwszaKarta.typ === "obiekcja"
              ? <>Powtórka obiekcji: <b className="text-slate-900">„{pierwszaKarta.tresc}”</b></>
              : <>Powtórka: <b className="text-slate-900">{NAZWY[pierwszaKarta.tresc as keyof typeof NAZWY] ?? pierwszaKarta.tresc}</b></>
            : POSTACIE[postac].opis}
        </p>
        {planZrobiony ? (
          <p className="text-slate-500 text-sm">Wróć jutro. Przypomnimy mailem o {konfig.godzina_przypomnienia}:00.</p>
        ) : minutZostalo < 1 ? (
          <p className="text-slate-500 text-sm">Limit minut testu wyczerpany.</p>
        ) : (
          <Link href={linkRozmowy} className="bruno-przycisk text-base px-8 py-4">Rozmawiaj z Bruno</Link>
        )}
        <div className="mt-4 text-xs text-slate-400">
          Inna postać? <Link href="/bruno/rozmowa" className="underline">Wybierz przed rozmową</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kafelek liczba={`${dzis}/${ROZMOW_DZIENNIE}`} opis="rozmów dziś" />
        <Kafelek liczba={`${minutZostalo}`} opis="minut zostało" uwaga={`z ${Math.round(konto.limit_sekund / 60)} w teście`} />
        <Kafelek liczba={`${stan.dniZostalo}`} opis={stan.dniZostalo === 1 ? "dzień dostępu" : "dni dostępu"} uwaga={stan.koniec ? `do ${stan.koniec.toLocaleDateString("pl-PL")}` : "od pierwszego logowania"} />
        <Kafelek liczba={ostatnia?.ocena ? `${ostatnia.ocena}/10` : "–"} opis="ostatnia ocena" />
      </div>

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

      {rozmowy.length > 0 && (
        <section className="bruno-szklo rounded-3xl p-6">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="bruno-h2 text-lg">Ostatnie rozmowy</h2>
            <Link href="/bruno/historia" className="text-sm text-cyan-800 hover:underline">Cała historia</Link>
          </div>
          <ul className="divide-y divide-slate-200/70">
            {rozmowy.map((r) => (
              <li key={r.id} className="py-2.5 flex items-center gap-3 text-sm">
                <span className="text-slate-500 w-28 shrink-0">{new Date(r.start).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                <span className="flex-1 text-slate-800 truncate">{POSTACIE[postacLubDomyslna(r.postac)].nazwa}{r.sekundy ? `, ${Math.round(r.sekundy / 60)} min` : ""}</span>
                {r.status === "zakonczona" && r.ocena ? (
                  <Link href={`/bruno/historia/${r.id}`} className="font-semibold bruno-gradient-tekst">{r.ocena}/10</Link>
                ) : (
                  <span className="text-slate-400 text-xs">{r.status === "trwa" ? "w toku" : "przerwana"}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
