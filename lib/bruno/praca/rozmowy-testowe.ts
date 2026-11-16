import { supabaseAdmin } from "@/lib/supabase";
import type { Feedback, Konfig } from "@/lib/bruno/db";
import { audioRozmowyEl } from "@/lib/bruno/elevenlabs";
import { KUBELEK_BRUNO } from "@/lib/bruno/nagrania";
import type { CelId, PostacId, PoziomId, TrybId } from "@/lib/bruno/postacie";

// 16.11 (USER_001): zakładka „Rozmowa sprzedażowa z AI” w panelu handlowca giełdy. JEDNA rozmowa: spotkanie na żywo,
// klient zna ofertę i mówi, że jest za droga; w rozmowie Bruno podnosi 3 różne obiekcje. Handlowiec może ją powtórzyć
// do 2 razy (każde podejście do 3 min), a firmom, które odblokowały kontakt, pokazujemy NAJLEPSZE podejście (najwyższa ocena).
// Bruno gra klienta z branży handlowca (z profilu). Tabela praca_rozmowy_testowe, kolumna nr = numer podejścia.
// Koszt: 0,10 $ / min głosu (rachunek ElevenLabs 6.10) → 2 × 3 min = 0,60 $ na handlowca + ocena trenera.

// 16.11 wieczór (USER_001): 2 podejścia po 3 minuty. Koszt głosu: 2 × 3 min × 0,10 $ = 0,60 $ na handlowca (sufit 4 starty = 1,20 $).
export const ROZMOW_TESTOWYCH = 2;
/** 16.11 (USER_001): zakładkę mają wszyscy handlowcy (konta kandydata) + te konta do testów (administrator giełdy). */
const KONTA_NAGRAJ = ["chodak.job72@gmail.com"];
export const mozeNagrywac = (konto: { email: string; typ: string } | null | undefined) => !!konto && (konto.typ === "kandydat" || KONTA_NAGRAJ.includes(konto.email.toLowerCase()));
/** Twarda długość rozmowy testowej. Bez dogrywki: każde podejście ma tę samą długość. */
export const SEKUND_TESTU = 180;
/** 16.11 (USER_001): rozmowa liczy się (zapis nagrania i oceny) od 30 s; krótsza = przerwana, podejście nie przepada. */
export const MIN_SEKUND_TESTU = 30;
/** Sufit czasu po stronie serwera (opóźnienie rozłączenia). */
export const SEKUND_TESTU_MAX = SEKUND_TESTU + 15;
/** Ile razy handlowiec może w ogóle wystartować rozmowę (2 + 2 zapasowe na kłopoty z mikrofonem) = sufit kosztu 12 min. */
export const STARTOW_MAX = 4;

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

export type ScenariuszTestu = { tytul: string; zadanie: string; tryb: TrybId; cel: CelId; postac: PostacId; poziom: PoziomId; obiekcje: string[] };

/**
 * 16.11 (USER_001: „jak by się spotykali na żywo, ale system musi pamiętać, że oni siebie nie widzą”):
 * dla Bruno to spotkanie twarzą w twarz, na którym handlowiec zamyka sprzedaż, ale cała rozmowa idzie samym głosem.
 * Trafia do promptu jako „sytuacja” (nadrzędna wobec reszty), do pierwszej wypowiedzi i do trenera.
 */
export const SYTUACJA_TESTU =
  "Spotkanie na żywo w Twoim biurze. Handlowiec przyszedł, żeby zamknąć sprzedaż: znasz już ofertę i masz wątpliwości. " +
  "To rozmowa wyłącznie głosowa: nie widzicie się. Nie mówisz o niczym, co trzeba zobaczyć (wygląd, gesty, uśmiech, ulotka, ekran, umowa na stole, podpis). " +
  "Gdy handlowiec mówi „proszę spojrzeć” albo „pokażę panu”, prosisz, żeby powiedział to słowami. Decyzję i następny krok ustalacie tylko słowami. " +
  "Rozmowa trwa 3 minuty, więc od pierwszego zdania zmierzasz do decyzji. Jeśli handlowiec dobrze odpowie na Twoje obiekcje i wprost poprosi o decyzję, możesz się zgodzić.";
/** To samo dla trenera: czego nie oceniać (bez obrazu, bez dogrywki). */
export const SYTUACJA_TESTU_TRENER =
  "Test handlowca na giełdzie pracy: rozmowa głosowa z AI, do 3 minut, BEZ dogrywki. Klient gra spotkanie na żywo, na którym handlowiec ma zamknąć sprzedaż, ale nie widzą się. " +
  "Nie oceniaj niczego wizualnego. Jeśli rozmowa urywa się na ostatniej wypowiedzi klienta, to limit czasu aplikacji, nie błąd handlowca. Najważniejsze: odpowiedzi na obiekcje i prośba o decyzję.";

/** Jedyna rozmowa testu. Pierwsza obiekcja pada na otwarcie, dwie kolejne w trakcie. */
export const SCENARIUSZ_TESTU: ScenariuszTestu = {
  tytul: "Spotkanie na żywo",
  zadanie: "Klient zna ofertę i mówi, że jest za droga. Zamknij sprzedaż.",
  tryb: "zywo",
  cel: "sprzedaz",
  postac: "niebieski",
  poziom: "sredni",
  obiekcje: ["Za drogo, konkurencja daje to samo taniej", "Nie jestem pewien, czy tego teraz potrzebuję", "Muszę się zastanowić i z kimś to omówić"],
};

/** Konfiguracja Bruno na rozmowę testową (handlowiec giełdy nie ma własnego „Dostosuj Bruno”). */
export function konfigTestu(syt: SytuacjaTestu): Konfig {
  const s = SCENARIUSZ_TESTU;
  return { email: "", produkt: syt.produkt, klient: syt.klient, obiekcje: s.obiekcje.join("\n"), udana_rozmowa: "", skrypt: "", postac: s.postac, godzina_przypomnienia: 0, etap: "oferta", rejestr: "pan", glos: "m", segment: syt.segment };
}

type Wiersz = { id: string; konto_id: string; nr: number; status: string; start: string; sekundy: number | null; feedback: Feedback | null; ocena: number | null; nagranie_sciezka: string | null; el_conversation_id: string | null; branza: string | null };
const POLA = "id,konto_id,nr,status,start,sekundy,feedback,ocena,nagranie_sciezka,el_conversation_id,branza";

/** Stan handlowca: ile podejść ma zaliczonych i numer kolejnego (null = 3 zaliczone albo wyczerpane starty). */
export async function stanTestu(kontoId: string): Promise<{ zaliczone: number; startow: number; nastepna: number | null }> {
  const { data } = await supabaseAdmin.from("praca_rozmowy_testowe").select("status").eq("konto_id", kontoId);
  const zaliczone = (data ?? []).filter((x) => x.status === "zakonczona").length;
  const startow = (data ?? []).length;
  return { zaliczone, startow, nastepna: zaliczone >= ROZMOW_TESTOWYCH || startow >= STARTOW_MAX ? null : zaliczone + 1 };
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

export type RozmowaTestowa = { /** Numer podejścia (1-3). */ nr: number; /** Branża, z której Bruno grał klienta. */ branza: string; kiedy: string; sekundy: number; ocena: number | null; wygrana: string; poprawka: string; /** Link do mp3 podpisany na godzinę albo null, gdy pliku jeszcze nie ma. */ nagranie: string | null; /** Najwyżej ocenione podejście: tylko to widzi firma. */ najlepsza: boolean };

/** Zaliczone podejścia handlowców z linkami do nagrań, id konta → lista od 1. podejścia. `tylkoNajlepsza` = widok firmy. */
export async function rozmowyTestowe(kontoIds: string[], tylkoNajlepsza = false): Promise<Record<string, RozmowaTestowa[]>> {
  if (!kontoIds.length) return {};
  const { data, error } = await supabaseAdmin.from("praca_rozmowy_testowe").select(POLA).in("konto_id", kontoIds).eq("status", "zakonczona").order("start", { ascending: true });
  if (error) console.error("[praca rozmowy testowe]", error.message);
  const poKoncie: Record<string, Wiersz[]> = {};
  for (const w of (data ?? []) as Wiersz[]) (poKoncie[w.konto_id] ??= []).push(w);
  const wynik: Record<string, RozmowaTestowa[]> = {};
  for (const [kontoId, wiersze] of Object.entries(poKoncie)) {
    // Najlepsza = najwyższa ocena; przy remisie (albo bez ocen) ostatnie podejście.
    const top = wiersze.reduce((a, b) => ((b.ocena ?? -1) >= (a.ocena ?? -1) ? b : a));
    const lista: RozmowaTestowa[] = [];
    for (const [i, w] of wiersze.entries()) {
      if (tylkoNajlepsza && w !== top) continue;
      // Siatka bezpieczeństwa: plik nie zdążył się ściągnąć po rozmowie → próba przy pierwszym wyświetleniu.
      const sciezka = w.nagranie_sciezka ?? (w.el_conversation_id ? await sciagnijNagranieTestu({ id: w.id, kontoId, elId: w.el_conversation_id }) : null);
      const nagranie = sciezka ? (await supabaseAdmin.storage.from(KUBELEK_BRUNO).createSignedUrl(sciezka, 3600)).data?.signedUrl ?? null : null;
      lista.push({ nr: i + 1, branza: w.branza ?? "", kiedy: w.start, sekundy: w.sekundy ?? 0, ocena: w.ocena, wygrana: w.feedback?.wygrana ?? "", poprawka: w.feedback?.poprawka ?? "", nagranie, najlepsza: w === top });
    }
    wynik[kontoId] = lista;
  }
  return wynik;
}
