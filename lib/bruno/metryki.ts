import type { Wypowiedz } from "./db";

// Liczby z transkrypcji, liczone deterministycznie, zanim trener (Claude)
// zobaczy rozmowę. Progi z SalesAI/BRUNO-RUBRYKA.md. Trener dostaje gotowe
// liczby, żeby nie zgadywał ich z tekstu.

const WYPELNIACZE = /\b(y{2,}|e{2,}|hmm+|mmm+|no więc|jakby|w sensie|znaczy się|znaczy|tak jakby|no i)\b/giu;
const OSLABIACZE = /\b(chyba|może|wydaje mi się|spróbuję|spróbujemy|trochę|myślę,? że|nie wiem czy|w sumie|jakoś|właściwie)\b/giu;
const PRZEPROSINY = /\b(przepraszam|niestety|przeszkadzam|nie zajmę)\b/giu;
export const OTWARTE = /^\s*(jak|co|ile|kiedy|dlaczego|gdzie|kto|w jaki sposób|czym|który|która|od jak dawna)\b/iu;
const OBIEKCJA = /(za drog|drogo|pomyśl|zastanow|przemyśl|nie teraz|mamy już|budżet|nie mam czasu|prześlij|proszę wysłać|wyślij|nie jestem zainteresowan|nie potrzeb|zapytam|skonsultuj|wspólnik|szef)/iu;
const RABAT = /(rabat|taniej|zejść|zejdę|obniż|zniżk|promocj|upust)/iu;
export const PROSBA_O_DECYZJE = /(zaczynamy|umówmy|umówimy|od kiedy|podpis|startujemy|możemy zacząć|kiedy możemy|wchodzimy|zróbmy tak|proponuję termin|pasuje panu|pasuje pani|spotkajmy się)/iu;
const KWOTA = /(\d[\d\s.,]*\s*(zł|złotych|tys|tysięcy|procent|%|euro|eur|dolar))/iu;
const DATA = /(poniedziałek|wtorek|środ|czwartek|piątek|sobot|niedziel|jutro|pojutrze|o \d{1,2}(:\d{2})?|godzin|w przyszłym tygodniu|za tydzień)/iu;

function slowa(t: string) {
  return t.trim().split(/\s+/).filter(Boolean);
}
function ile(re: RegExp, t: string) {
  return (t.match(re) ?? []).length;
}

export type Metryki = {
  sekundy: number;
  slowa_handlowca: number;
  slowa_klienta: number;
  udzial_handlowca_proc: number;
  wypelniacze: number;
  wypelniacze_na_min: number;
  oslabiacze: number;
  oslabiacze_na_100: number;
  przeprosiny: number;
  pytania_handlowca: number;
  pytania_otwarte: number;
  zdania_przed_pierwszym_pytaniem: number;
  sekundy_do_pierwszego_pytania: number | null;
  sam_odpowiada_na_pytanie: number;
  obiekcje_klienta: number;
  obiekcje_z_pytaniem: number;
  obiekcje_z_rabatem: number;
  prosby_o_decyzje: number;
  kwota_padla: boolean;
  slowa_po_kwocie: number | null;
  cena_przed_pytaniem: boolean;
  data_w_koncowce: boolean;
  tempo_pierwsza_min: number | null;
  tempo_ostatnia_min: number | null;
  spadek_tempa_proc: number | null;
  zdania_ponad_25_slow: number;
};

export function policzMetryki(tr: Wypowiedz[], sekundy: number): Metryki {
  const h = tr.filter((w) => w.rola === "handlowiec");
  const k = tr.filter((w) => w.rola === "klient");
  const tekstH = h.map((w) => w.tekst).join(" ");
  const slowaH = slowa(tekstH).length;
  const slowaK = slowa(k.map((w) => w.tekst).join(" ")).length;
  const minuty = Math.max(1, sekundy / 60);

  // Otwarcie
  let zdaniaPrzedPytaniem = 0;
  let sekundyDoPytania: number | null = null;
  for (const w of h) {
    if (w.tekst.includes("?")) {
      sekundyDoPytania = w.t;
      break;
    }
    zdaniaPrzedPytaniem += Math.max(1, (w.tekst.match(/[.!]+/g) ?? []).length);
  }

  // Pytania
  const wypowiedziZPytaniem = h.filter((w) => w.tekst.includes("?"));
  const pytaniaHandlowca = h.reduce((s, w) => s + ile(/\?/g, w.tekst), 0);
  const pytaniaOtwarte = wypowiedziZPytaniem.filter((w) =>
    w.tekst
      .split(/[.!?]/)
      .some((z) => OTWARTE.test(z)),
  ).length;

  // Sam odpowiada: po wypowiedzi handlowca z „?" znów mówi handlowiec.
  let samOdpowiada = 0;
  let obiekcje = 0;
  let obiekcjeZPytaniem = 0;
  let obiekcjeZRabatem = 0;
  for (let i = 0; i < tr.length - 1; i++) {
    const a = tr[i];
    const b = tr[i + 1];
    if (a.rola === "handlowiec" && a.tekst.includes("?") && b.rola === "handlowiec") samOdpowiada++;
    if (a.rola === "klient" && OBIEKCJA.test(a.tekst)) {
      obiekcje++;
      const odp = tr.slice(i + 1).find((w) => w.rola === "handlowiec");
      if (odp) {
        if (odp.tekst.includes("?")) obiekcjeZPytaniem++;
        if (RABAT.test(odp.tekst)) obiekcjeZRabatem++;
      }
    }
  }

  // Kwota i usprawiedliwianie ceny
  let kwotaPadla = false;
  let slowaPoKwocie: number | null = null;
  let cenaPrzedPytaniem = false;
  for (let i = 0; i < tr.length; i++) {
    const w = tr[i];
    if (w.rola !== "handlowiec") continue;
    const m = w.tekst.match(KWOTA);
    if (!m || m.index === undefined) continue;
    kwotaPadla = true;
    cenaPrzedPytaniem = sekundyDoPytania === null || w.t < sekundyDoPytania;
    let licznik = slowa(w.tekst.slice(m.index + m[0].length)).length;
    for (let j = i + 1; j < tr.length && tr[j].rola === "handlowiec"; j++) licznik += slowa(tr[j].tekst).length;
    slowaPoKwocie = licznik;
    break;
  }

  // Zamknięcie
  const prosbyODecyzje = h.filter((w) => PROSBA_O_DECYZJE.test(w.tekst)).length;
  const odKiedy = sekundy * 0.8;
  const dataWKoncowce = tr.some((w) => w.t >= odKiedy && DATA.test(w.tekst));

  // Tempo: słowa handlowca w pierwszej i ostatniej pełnej minucie
  const tempoW = (od: number, doS: number) => {
    const s = h.filter((w) => w.t >= od && w.t < doS).reduce((a, w) => a + slowa(w.tekst).length, 0);
    return s;
  };
  const tempoPierwsza = sekundy >= 60 ? tempoW(0, 60) : null;
  const tempoOstatnia = sekundy >= 120 ? tempoW(Math.max(60, sekundy - 60), sekundy + 1) : null;
  const spadek =
    tempoPierwsza && tempoOstatnia ? Math.round(((tempoPierwsza - tempoOstatnia) / tempoPierwsza) * 100) : null;

  const zdaniaDlugie = h.reduce(
    (s, w) => s + w.tekst.split(/[.!?]+/).filter((z) => slowa(z).length > 25).length,
    0,
  );

  const wypelniacze = ile(WYPELNIACZE, tekstH);
  const oslabiacze = ile(OSLABIACZE, tekstH);

  return {
    sekundy,
    slowa_handlowca: slowaH,
    slowa_klienta: slowaK,
    udzial_handlowca_proc: slowaH + slowaK ? Math.round((slowaH / (slowaH + slowaK)) * 100) : 0,
    wypelniacze,
    wypelniacze_na_min: Math.round((wypelniacze / minuty) * 10) / 10,
    oslabiacze,
    oslabiacze_na_100: slowaH ? Math.round((oslabiacze / slowaH) * 1000) / 10 : 0,
    przeprosiny: ile(PRZEPROSINY, tekstH),
    pytania_handlowca: pytaniaHandlowca,
    pytania_otwarte: pytaniaOtwarte,
    zdania_przed_pierwszym_pytaniem: zdaniaPrzedPytaniem,
    sekundy_do_pierwszego_pytania: sekundyDoPytania,
    sam_odpowiada_na_pytanie: samOdpowiada,
    obiekcje_klienta: obiekcje,
    obiekcje_z_pytaniem: obiekcjeZPytaniem,
    obiekcje_z_rabatem: obiekcjeZRabatem,
    prosby_o_decyzje: prosbyODecyzje,
    kwota_padla: kwotaPadla,
    slowa_po_kwocie: slowaPoKwocie,
    cena_przed_pytaniem: cenaPrzedPytaniem,
    data_w_koncowce: dataWKoncowce,
    tempo_pierwsza_min: tempoPierwsza,
    tempo_ostatnia_min: tempoOstatnia,
    spadek_tempa_proc: spadek,
    zdania_ponad_25_slow: zdaniaDlugie,
  };
}
