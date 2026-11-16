import { supabaseAdmin } from "@/lib/supabase";
import type { Feedback, Konfig } from "@/lib/bruno/db";
import { audioRozmowyEl } from "@/lib/bruno/elevenlabs";
import { KUBELEK_BRUNO } from "@/lib/bruno/nagrania";
import type { CelId, PostacId, PoziomId, TrybId } from "@/lib/bruno/postacie";

// 16.11 (USER_001): zakładka „Nagraj rozmowę” w panelu handlowca giełdy. 3 rozmowy sprzedażowe z Bruno po 3 minuty,
// te same 3 scenariusze dla każdego, a Bruno gra klienta z branży handlowca (z profilu). Nagranie i ocena trafiają do firm,
// które odblokowały kontakt. Tabela praca_rozmowy_testowe (lib/bruno/sql/2026-11-16-praca-rozmowy-testowe.sql).
// Koszt: 0,10 $ / min głosu (rachunek ElevenLabs 6.10) → 3 × 3 min = 0,90 $ na handlowca + ocena trenera.

export const ROZMOW_TESTOWYCH = 3;
/** 16.11 (USER_001: „dodaj tę zakładkę tylko u mnie, tam dopracuję”): zakładka widoczna tylko dla tych kont, każdego typu. */
const KONTA_NAGRAJ = ["chodak.job72@gmail.com"];
export const mozeNagrywac = (email: string | null | undefined) => KONTA_NAGRAJ.includes((email ?? "").toLowerCase());
/** Twarda długość rozmowy testowej. Bez dogrywki: firma dostaje 3 nagrania tej samej długości. */
export const SEKUND_TESTU = 180;
/** Sufit czasu po stronie serwera (opóźnienie rozłączenia). */
export const SEKUND_TESTU_MAX = SEKUND_TESTU + 15;
/** Ile razy handlowiec może w ogóle wystartować rozmowę (3 + 2 zapasowe na kłopoty z mikrofonem) = sufit kosztu 15 min. */
export const STARTOW_MAX = 5;

/** Sytuacja rozmowy: co handlowiec sprzedaje i komu. Jedna na branżę z profilu, klient = firma albo osoba (pole „Komu sprzedajesz?”). */
type Branza = { produkt: string; firma: string; osoba: string };
// 16.11 (USER_001: „Bruno będzie się wcielał w klienta na podstawie tego, w czym dana osoba ma doświadczenie”).
// Klucze = opcje pytania „Branże” z formularza profilu (profil-handlowca.ts), bez „Inna”.
const BRANZE_TESTU: Record<string, Branza> = {
  "Nieruchomości": { produkt: "Mieszkania od dewelopera w nowym osiedlu, 2 i 3 pokoje, od 520 000 zł.", firma: "Właściciel firmy, który chce kupić 2 mieszkania na wynajem. Porównuje 3 inwestycje.", osoba: "Para po trzydziestce, kupuje pierwsze mieszkanie na kredyt. Boi się raty." },
  "OZE i fotowoltaika": { produkt: "Fotowoltaika z magazynem energii. Instalacja 10 kW z magazynem za 58 000 zł, montaż w 3 tygodnie.", firma: "Właściciel zakładu stolarskiego, rachunki za prąd 6 000 zł miesięcznie. Miał już 2 oferty.", osoba: "Właściciel domu 160 m², rachunki za prąd 900 zł miesięcznie. Sąsiad odradzał fotowoltaikę." },
  "IT i oprogramowanie": { produkt: "System CRM dla zespołu sprzedaży, 149 zł netto miesięcznie za użytkownika, wdrożenie w 2 tygodnie.", firma: "Właściciel firmy handlowej, 12 handlowców. Klientów trzyma w Excelu i w głowach ludzi.", osoba: "Jednoosobowy doradca, klientów prowadzi w notesie i w telefonie. Nie lubi nowych programów." },
  "Finanse i ubezpieczenia": { produkt: "Ubezpieczenie na życie z ochroną na wypadek choroby, składka od 180 zł miesięcznie.", firma: "Właściciel firmy transportowej, 20 kierowców. Rozważa ubezpieczenie grupowe dla pracowników.", osoba: "Ojciec dwójki dzieci, jedyny żywiciel rodziny, ma kredyt hipoteczny. Uważa, że ubezpieczenia to strata pieniędzy." },
  "Motoryzacja": { produkt: "Nowe samochody w leasingu, auto miejskie od 1 400 zł netto miesięcznie, odbiór w 4 tygodnie.", firma: "Właściciel firmy remontowej, chce wymienić 3 auta dostawcze. Ma ofertę od innego dilera.", osoba: "Kierowca, który od 8 lat jeździ tym samym autem. Waha się między nowym a używanym." },
  "Budownictwo": { produkt: "Okna i drzwi z montażem. Komplet okien do domu 150 m² za 42 000 zł, montaż w 6 tygodni.", firma: "Kierownik budowy u dewelopera, szuka dostawcy okien na 24 mieszkania. Liczy każdy tydzień opóźnienia.", osoba: "Inwestor, który buduje dom. Ma 2 tańsze wyceny od lokalnych firm." },
  "Medycyna i farmacja": { produkt: "Aparat USG dla gabinetów, 89 000 zł albo leasing 2 100 zł miesięcznie, szkolenie w cenie.", firma: "Właścicielka przychodni z 4 gabinetami. Stary aparat działa, ale lekarze narzekają na obraz.", osoba: "Lekarz, który otwiera własny gabinet. Ma ograniczony budżet na start." },
  "Telekomunikacja": { produkt: "Internet światłowodowy i telefony komórkowe. Pakiet dla firmy: 10 numerów i internet 1 Gb za 690 zł netto miesięcznie.", firma: "Właściciel biura rachunkowego, 10 pracowników. Umowa u obecnego operatora kończy się za 2 miesiące.", osoba: "Klient, który od 6 lat jest u jednego operatora i płaci 180 zł miesięcznie za internet i 2 telefony." },
  "Produkty spożywcze": { produkt: "Soki i napoje od polskiego producenta, 40 pozycji, dostawa 2 razy w tygodniu, minimum zamówienia 800 zł.", firma: "Właściciel 3 sklepów osiedlowych. Półka z napojami jest pełna towaru od dużych marek.", osoba: "Właścicielka małej kawiarni, soki kupuje w hurtowni. Liczy każdą złotówkę." },
  "Przemysł": { produkt: "Sprężarki powietrza dla zakładów produkcyjnych, 64 000 zł za sztukę, serwis w 24 godziny.", firma: "Dyrektor produkcji w zakładzie metalowym, 60 pracowników. Stara sprężarka psuje się 2 razy w roku.", osoba: "Właściciel małego warsztatu, 4 pracowników. Kupuje sprzęt używany, bo jest tańszy." },
  "Usługi dla firm": { produkt: "Obsługa księgowa z doradcą podatkowym dla firm, od 900 zł netto miesięcznie.", firma: "Właściciel hurtowni budowlanej, 8 pracowników. Jest u tej samej księgowej od 10 lat.", osoba: "Osoba, która właśnie zakłada jednoosobową firmę. Chce płacić jak najmniej." },
};
export const BRANZA_DOMYSLNA = "Usługi dla firm";
export const BRANZE_DO_WYBORU = Object.keys(BRANZE_TESTU);

export type SytuacjaTestu = { branza: string; segment: "b2b" | "b2c"; produkt: string; klient: string };

/** Sytuacja z branży i segmentu (nieznana branża = domyślna). */
export function sytuacjaZ(branza: string | null | undefined, segment: string | null | undefined): SytuacjaTestu {
  const b = branza && branza in BRANZE_TESTU ? branza : BRANZA_DOMYSLNA;
  const seg = segment === "b2c" ? "b2c" : "b2b";
  return { branza: b, segment: seg, produkt: BRANZE_TESTU[b].produkt, klient: seg === "b2c" ? BRANZE_TESTU[b].osoba : BRANZE_TESTU[b].firma };
}

/** Sytuacja z profilu handlowca: pierwsza jego branża, którą znamy; klient = osoba tylko wtedy, gdy sprzedaje wyłącznie osobom. */
export function sytuacjaZProfilu(odpowiedzi: Record<string, unknown> | null | undefined, wybranaBranza?: string | null): SytuacjaTestu {
  const branze = Array.isArray(odpowiedzi?.branze) ? odpowiedzi.branze.map(String) : [];
  // Konto bez profilu (testy USER_001) może wskazać branżę samo.
  const branza = branze.find((b) => b in BRANZE_TESTU) ?? (odpowiedzi ? null : wybranaBranza);
  return sytuacjaZ(branza, odpowiedzi?.rynek === "Klientom indywidualnym" ? "b2c" : "b2b");
}

/** Odpowiedzi z profilu handlowca albo null, gdy konto nie ma profilu. */
export async function odpowiedziProfilu(kontoId: string): Promise<Record<string, unknown> | null> {
  const { data } = await supabaseAdmin.from("praca_profile_handlowcow").select("odpowiedzi").eq("konto_id", kontoId).maybeSingle();
  return (data?.odpowiedzi as Record<string, unknown> | undefined) ?? null;
}

export type ScenariuszTestu = { nr: number; tytul: string; zadanie: string; tryb: TrybId; cel: CelId; postac: PostacId; poziom: PoziomId; obiekcja: string };

export const SCENARIUSZE_TESTU: ScenariuszTestu[] = [
  { nr: 1, tytul: "Pierwszy telefon", zadanie: "Dzwonisz do klienta pierwszy raz. Nie zna Cię. Umów spotkanie.", tryb: "cold", cel: "spotkanie", postac: "czerwony", poziom: "sredni", obiekcja: "Nie mam czasu, proszę wysłać ofertę mailem" },
  { nr: 2, tytul: "Za drogo", zadanie: "Spotkanie na żywo. Klient zna ofertę i mówi, że jest za droga. Doprowadź do sprzedaży.", tryb: "zywo", cel: "sprzedaz", postac: "niebieski", poziom: "sredni", obiekcja: "Za drogo, konkurencja daje to samo taniej" },
  { nr: 3, tytul: "Muszę się zastanowić", zadanie: "Spotkanie online po prezentacji. Klient odkłada decyzję. Uzyskaj decyzję albo następny krok z datą.", tryb: "online", cel: "decyzja", postac: "zielony", poziom: "sredni", obiekcja: "Muszę się zastanowić i z kimś to omówić" },
];

/** Konfiguracja Bruno na rozmowę testową (handlowiec giełdy nie ma własnego „Dostosuj Bruno”). */
export function konfigTestu(s: ScenariuszTestu, syt: SytuacjaTestu): Konfig {
  return { email: "", produkt: syt.produkt, klient: syt.klient, obiekcje: SCENARIUSZE_TESTU.map((x) => x.obiekcja).join("\n"), udana_rozmowa: "", skrypt: "", postac: s.postac, godzina_przypomnienia: 0, etap: s.tryb === "cold" ? "cold" : "oferta", rejestr: "pan", glos: "m", segment: syt.segment };
}

type Wiersz = { id: string; konto_id: string; nr: number; status: string; start: string; sekundy: number | null; feedback: Feedback | null; ocena: number | null; nagranie_sciezka: string | null; el_conversation_id: string | null; branza: string | null };
const POLA = "id,konto_id,nr,status,start,sekundy,feedback,ocena,nagranie_sciezka,el_conversation_id,branza";

/** Stan handlowca: które rozmowy ma zaliczone i czy może wystartować kolejną. */
export async function stanTestu(kontoId: string): Promise<{ zaliczone: number[]; startow: number; nastepna: ScenariuszTestu | null }> {
  const { data } = await supabaseAdmin.from("praca_rozmowy_testowe").select("nr,status").eq("konto_id", kontoId);
  const zaliczone = [...new Set((data ?? []).filter((x) => x.status === "zakonczona").map((x) => x.nr as number))].sort();
  const startow = (data ?? []).length;
  const wolny = SCENARIUSZE_TESTU.find((s) => !zaliczone.includes(s.nr)) ?? null;
  return { zaliczone, startow, nastepna: startow >= STARTOW_MAX ? null : wolny };
}

/** Ściąga nagranie z konta ElevenLabs do naszego kubełka (plik bywa gotowy kilka sekund po rozłączeniu). */
export async function sciagnijNagranieTestu(a: { id: string; kontoId: string; elId: string; proby?: number }): Promise<string | null> {
  for (let i = 0; i < (a.proby ?? 1); i += 1) {
    if (i > 0) await new Promise((r) => setTimeout(r, 4000));
    try {
      const audio = await audioRozmowyEl(a.elId);
      if (!audio) continue;
      const sciezka = `gielda/${a.kontoId}/${a.id}.mp3`;
      const { error } = await supabaseAdmin.storage.from(KUBELEK_BRUNO).upload(sciezka, audio.bajty, { contentType: audio.typ, upsert: true });
      if (error) throw new Error(error.message);
      await supabaseAdmin.from("praca_rozmowy_testowe").update({ nagranie_sciezka: sciezka }).eq("id", a.id);
      return sciezka;
    } catch (e) {
      console.error("[praca rozmowa testowa] nagranie", a.id, e);
    }
  }
  return null;
}

export type RozmowaTestowa = { nr: number; tytul: string; zadanie: string; /** Branża, z której Bruno grał klienta. */ branza: string; kiedy: string; sekundy: number; ocena: number | null; wygrana: string; poprawka: string; /** Link do mp3 podpisany na godzinę albo null, gdy pliku jeszcze nie ma. */ nagranie: string | null };

/** Zaliczone rozmowy testowe handlowców (ostatnia zaliczona na każdy scenariusz), z linkami do nagrań. id konta → lista. */
export async function rozmowyTestowe(kontoIds: string[]): Promise<Record<string, RozmowaTestowa[]>> {
  if (!kontoIds.length) return {};
  const { data, error } = await supabaseAdmin.from("praca_rozmowy_testowe").select(POLA).in("konto_id", kontoIds).eq("status", "zakonczona").order("start", { ascending: false });
  if (error) console.error("[praca rozmowy testowe]", error.message);
  const wynik: Record<string, RozmowaTestowa[]> = {};
  for (const w of (data ?? []) as Wiersz[]) {
    const lista = (wynik[w.konto_id] ??= []);
    const s = SCENARIUSZE_TESTU.find((x) => x.nr === w.nr);
    if (!s || lista.some((x) => x.nr === w.nr)) continue;
    // Siatka bezpieczeństwa: plik nie zdążył się ściągnąć po rozmowie → próba przy pierwszym wyświetleniu.
    const sciezka = w.nagranie_sciezka ?? (w.el_conversation_id ? await sciagnijNagranieTestu({ id: w.id, kontoId: w.konto_id, elId: w.el_conversation_id }) : null);
    const nagranie = sciezka ? (await supabaseAdmin.storage.from(KUBELEK_BRUNO).createSignedUrl(sciezka, 3600)).data?.signedUrl ?? null : null;
    lista.push({ nr: w.nr, tytul: s.tytul, zadanie: s.zadanie, branza: w.branza ?? "", kiedy: w.start, sekundy: w.sekundy ?? 0, ocena: w.ocena, wygrana: w.feedback?.wygrana ?? "", poprawka: w.feedback?.poprawka ?? "", nagranie });
  }
  for (const l of Object.values(wynik)) l.sort((a, b) => a.nr - b.nr);
  return wynik;
}
