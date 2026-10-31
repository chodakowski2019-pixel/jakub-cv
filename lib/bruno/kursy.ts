// 30.10 (USER_001): B2C = szkolenie sprzedaży 3 mies. z gwarancją pracy. Baza kursów = ten plik.
// Czyta go wyszukiwarka (salesbruno.pl/kursy, AI dobiera kurs), uniwersalna strona sprzedażowa (/kursy/<slug>)
// i agent /brunob2c. Nowy kurs = nowy wpis w KURSY, strona powstaje sama.
// Kurs = branża × poziom. Program 3 miesięcy: wspólny szkielet + wstawki branżowe.

export type Poziom = "start" | "pro";

export type Miesiac = { tytul: string; punkty: string[] };

export type Kurs = {
  slug: string;
  tytul: string;
  branza: string;
  poziom: Poziom;
  /** jedno zdanie na górze strony */
  obietnica: string;
  dlaKogo: string[];
  /** czego uczysz się konkretnie w tej branży (wchodzi do miesiąca 1 i 2) */
  branzowe: { produkt: string[]; obiekcje: string[] };
  /** klienci, których gra Bruno */
  klienciBruno: string[];
  /** typy firm, do których łączymy absolwentów */
  pracodawcy: string[];
  /** słowa do dopasowania bez AI */
  slowa: string[];
};

// 31.10 (USER_001): 1 200 zł z góry i 500 zł/mies. to ceny PO przecenie -50 %. Ceny bazowe: 2 400 i 1 000.
export const CENA = {
  miesiac: 1000,
  zGory: 2400,
  miesiecy: 3,
};

/** 30.10 (USER_001): przecena -50 % z zegarem 3 h 42 min 18 s, liczonym od pierwszego wejścia na stronę kursu.
 * Koniec zegara = cookie PROMO.cookie (ms), serwer liczy cenę w Stripe z tego samego cookie. */
export const PROMO = {
  rabatProcent: 50,
  sekund: 3 * 3600 + 42 * 60 + 18,
  cookie: "kurs_promo_do",
};

export type Plan = "miesiac" | "z-gory";

/** Cena w zł: pełna albo po rabacie. „miesiac” = jedna rata (1 z 3). */
export function cenaKursu(plan: Plan, promo: boolean): number {
  const pelna = plan === "z-gory" ? CENA.zGory : CENA.miesiac;
  return promo ? Math.round((pelna * (100 - PROMO.rabatProcent)) / 100) : pelna;
}

/** Czy cookie z końcem zegara daje dziś rabat. Koniec nie może być dalej niż jeden pełny zegar od teraz. */
export function promoAktywne(koniecMs: number | null, teraz = Date.now()): boolean {
  if (!koniecMs || !Number.isFinite(koniecMs)) return false;
  return koniecMs > teraz && koniecMs - teraz <= (PROMO.sekund + 60) * 1000;
}

export const GWARANCJA = {
  progCertyfikatu: 80,
  dniNaOferte: 30,
  /** odmowa oferty = szukamy kolejny miesiąc, łącznie 3 szanse */
  szans: 3,
};

export const POZIOMY: Record<Poziom, string> = {
  start: "Start: zaczynasz w sprzedaży",
  pro: "Pro: masz już doświadczenie",
};

const K = (k: Kurs) => k;

export const KURSY: Kurs[] = [
  K({
    slug: "podstawy-sprzedazy",
    tytul: "Handlowiec od zera",
    branza: "Każda branża",
    poziom: "start",
    obietnica: "Nigdy nie sprzedawałeś? W 3 miesiące nauczysz się prowadzić rozmowę od „dzień dobry” do podpisu.",
    dlaKogo: ["Chcesz zmienić pracę i wejść do sprzedaży", "Nie wiesz jeszcze, w jakiej branży", "Boisz się rozmów z obcymi ludźmi"],
    branzowe: {
      produkt: ["Jak w 1 dzień poznać każdy produkt", "Czym się różni sprzedaż firmom od sprzedaży ludziom"],
      obiekcje: ["„Za drogo”", "„Muszę się zastanowić”", "„Nie jestem zainteresowany”"],
    },
    klienciBruno: ["Klient, który mówi „za drogo”", "Klient, który nie ma czasu", "Klient, który porównuje z konkurencją"],
    pracodawcy: ["Biura nieruchomości", "Firmy OZE", "Salony samochodowe", "Firmy telekomunikacyjne", "Call center"],
    slowa: ["zero", "od zera", "początkujący", "nie wiem", "zmiana pracy", "pierwsza praca", "podstawy", "handlowiec", "sprzedawca"],
  }),
  K({
    slug: "nieruchomosci-start",
    tytul: "Agent nieruchomości",
    branza: "Nieruchomości",
    poziom: "start",
    obietnica: "Naucz się pozyskiwać mieszkania do sprzedaży i prowadzić prezentacje, które kończą się ofertą.",
    dlaKogo: ["Chcesz zostać agentem nieruchomości", "Lubisz ludzi i chcesz zarabiać z prowizji", "Zaczynasz bez doświadczenia"],
    branzowe: {
      produkt: ["Rynek pierwotny i wtórny", "Umowa pośrednictwa i wyłączność", "Prezentacja mieszkania krok po kroku"],
      obiekcje: ["„Sprzedam sam, bez agenta”", "„Prowizja jest za wysoka”", "„Dam ofertę kilku biurom”"],
    },
    klienciBruno: ["Właściciel mieszkania, który chce sprzedać sam", "Kupujący, który ogląda 20. mieszkanie", "Para, która nie może się zdecydować"],
    pracodawcy: ["Biura nieruchomości", "Deweloperzy (biura sprzedaży)", "Sieci franczyzowe nieruchomości"],
    slowa: ["nieruchomości", "mieszkania", "agent", "pośrednik", "deweloper", "dom", "wynajem"],
  }),
  K({
    slug: "nieruchomosci-pro",
    tytul: "Nieruchomości Pro: wyłączności i negocjacje",
    branza: "Nieruchomości",
    poziom: "pro",
    obietnica: "Już sprzedajesz nieruchomości? Zdobywaj więcej umów na wyłączność i broń swojej prowizji.",
    dlaKogo: ["Pracujesz jako agent, chcesz więcej transakcji", "Tracisz klientów na rzecz innych biur", "Chcesz przejść do lepszego biura"],
    branzowe: {
      produkt: ["Spotkanie pozyskowe na wyłączność", "Wycena, która nie straszy klienta", "Negocjacje ceny między stronami"],
      obiekcje: ["„Inne biuro bierze mniej”", "„Nie podpiszę wyłączności”", "„Obniżmy cenę o 50 tysięcy”"],
    },
    klienciBruno: ["Właściciel porównujący 3 biura", "Twardy kupujący, który zbija cenę", "Inwestor kupujący kilka mieszkań"],
    pracodawcy: ["Biura nieruchomości premium", "Deweloperzy", "Firmy inwestycyjne"],
    slowa: ["wyłączność", "prowizja", "negocjacje", "nieruchomości", "agent", "pośrednik"],
  }),
  K({
    slug: "oze-start",
    tytul: "Doradca OZE: fotowoltaika i pompy ciepła",
    branza: "OZE",
    poziom: "start",
    obietnica: "Naucz się sprzedawać fotowoltaikę i pompy ciepła u klienta w domu, uczciwie i z liczbami.",
    dlaKogo: ["Chcesz pracować w terenie, u klienta", "Interesuje Cię energia i oszczędności", "Zaczynasz bez doświadczenia"],
    branzowe: {
      produkt: ["Jak działa fotowoltaika, magazyn energii, pompa ciepła", "Dotacje i ulga termomodernizacyjna", "Liczenie zwrotu z inwestycji przy kliencie"],
      obiekcje: ["„Słyszałem, że to się nie opłaca”", "„Sąsiad ma i żałuje”", "„Poczekam na lepsze dotacje”"],
    },
    klienciBruno: ["Emeryt, który boi się kredytu", "Właściciel domu, który liczy każdą złotówkę", "Klient po złym doświadczeniu z inną firmą"],
    pracodawcy: ["Firmy fotowoltaiczne", "Instalatorzy pomp ciepła", "Firmy od magazynów energii"],
    slowa: ["oze", "fotowoltaika", "pv", "panele", "pompa ciepła", "pompy", "energia", "magazyn energii", "teren"],
  }),
  K({
    slug: "oze-pro",
    tytul: "OZE Pro: sprzedaż dla firm i duże instalacje",
    branza: "OZE",
    poziom: "pro",
    obietnica: "Sprzedajesz OZE domom? Wejdź do firm, gospodarstw i dużych instalacji z wyższą prowizją.",
    dlaKogo: ["Sprzedajesz OZE klientom indywidualnym", "Chcesz większych kontraktów", "Chcesz sprzedawać firmom"],
    branzowe: {
      produkt: ["Instalacje dla firm i rolników", "Finansowanie: leasing, kredyt, dotacje dla firm", "Kilka osób decyduje: jak ich zebrać"],
      obiekcje: ["„Musimy to przeliczyć z księgową”", "„Zarząd podejmie decyzję w przyszłym roku”", "„Mamy już ofertę taniej”"],
    },
    klienciBruno: ["Właściciel hali produkcyjnej", "Rolnik z dużym gospodarstwem", "Dyrektor finansowy, który liczy zwrot"],
    pracodawcy: ["Firmy OZE dla biznesu", "Wykonawcy farm fotowoltaicznych", "Dostawcy energii"],
    slowa: ["oze", "firmy", "b2b", "farmy", "duże instalacje", "rolnicy", "fotowoltaika"],
  }),
  K({
    slug: "ubezpieczenia-start",
    tytul: "Agent ubezpieczeniowy",
    branza: "Ubezpieczenia",
    poziom: "start",
    obietnica: "Naucz się rozmawiać o ubezpieczeniach tak, żeby klient sam chciał się zabezpieczyć.",
    dlaKogo: ["Chcesz pracować jako agent ubezpieczeniowy", "Lubisz pomagać i tłumaczyć", "Zaczynasz bez doświadczenia"],
    branzowe: {
      produkt: ["Ubezpieczenia na życie, majątek, samochód", "Jak pytać o rodzinę i ryzyko bez straszenia", "Porównanie ofert przy kliencie"],
      obiekcje: ["„Mam już ubezpieczenie w pracy”", "„Mnie się nic nie stanie”", "„Ubezpieczyciele nie wypłacają”"],
    },
    klienciBruno: ["Młody tata, który odkłada decyzję", "Klientka, która ufa tylko swojemu bankowi", "Przedsiębiorca bez czasu"],
    pracodawcy: ["Towarzystwa ubezpieczeniowe", "Multiagencje", "Brokerzy ubezpieczeniowi"],
    slowa: ["ubezpieczenia", "polisy", "agent ubezpieczeniowy", "ubezpieczenie na życie", "oc", "ac"],
  }),
  K({
    slug: "finanse-kredyty-start",
    tytul: "Doradca kredytowy",
    branza: "Finanse",
    poziom: "start",
    obietnica: "Naucz się prowadzić klienta przez kredyt hipoteczny od pierwszej rozmowy do podpisu w banku.",
    dlaKogo: ["Chcesz pracować w finansach", "Dobrze liczysz i lubisz porządek", "Zaczynasz bez doświadczenia"],
    branzowe: {
      produkt: ["Kredyt hipoteczny i gotówkowy krok po kroku", "Zdolność kredytowa: jak ją sprawdzić przy kliencie", "Dokumenty i współpraca z bankiem"],
      obiekcje: ["„Pójdę sam do swojego banku”", "„Ile mnie to będzie kosztować?”", "„Poczekam, aż spadną stopy”"],
    },
    klienciBruno: ["Para kupująca pierwsze mieszkanie", "Klient z niską zdolnością", "Klient, który ma ofertę ze swojego banku"],
    pracodawcy: ["Firmy pośrednictwa kredytowego", "Biura nieruchomości z działem kredytów", "Banki"],
    slowa: ["kredyt", "kredyty", "hipoteka", "finanse", "bank", "doradca kredytowy", "pożyczki"],
  }),
  K({
    slug: "samochody-start",
    tytul: "Doradca handlowy w salonie samochodowym",
    branza: "Motoryzacja",
    poziom: "start",
    obietnica: "Naucz się prowadzić klienta od jazdy próbnej do podpisu umowy, także w leasingu.",
    dlaKogo: ["Kochasz samochody", "Chcesz pracować w salonie", "Zaczynasz bez doświadczenia"],
    branzowe: {
      produkt: ["Jazda próbna, która sprzedaje", "Leasing, kredyt, wynajem długoterminowy", "Samochód w rozliczeniu"],
      obiekcje: ["„W innym salonie dają większy rabat”", "„Za mało za mój stary samochód”", "„Przyjdę z żoną w sobotę”"],
    },
    klienciBruno: ["Klient z ofertą z konkurencyjnego salonu", "Przedsiębiorca pytający tylko o ratę", "Rodzina, która zmienia auto pierwszy raz od 10 lat"],
    pracodawcy: ["Salony samochodowe", "Komisy i dealerzy aut używanych", "Firmy leasingowe"],
    slowa: ["samochody", "auta", "motoryzacja", "salon", "dealer", "leasing", "auto"],
  }),
  K({
    slug: "telekomunikacja-start",
    tytul: "Doradca w telekomunikacji",
    branza: "Telekomunikacja",
    poziom: "start",
    obietnica: "Naucz się sprzedawać abonamenty, internet i telefony w salonie, przez telefon i firmom.",
    dlaKogo: ["Chcesz pracować w salonie albo w sprzedaży telefonicznej", "Znasz się na telefonach i internecie", "Zaczynasz bez doświadczenia"],
    branzowe: {
      produkt: ["Abonamenty, internet, telewizja w pakiecie", "Przedłużenie umowy i przeniesienie numeru", "Oferta dla małych firm"],
      obiekcje: ["„U konkurencji mam taniej”", "„Mam umowę do końca roku”", "„Nie chcę się wiązać na 24 miesiące”"],
    },
    klienciBruno: ["Klient z umową u konkurencji", "Właściciel małej firmy z 5 telefonami", "Senior, który chce tylko dzwonić"],
    pracodawcy: ["Salony operatorów komórkowych", "Partnerzy sprzedaży operatorów", "Działy sprzedaży dla firm"],
    slowa: ["telekomunikacja", "telefony", "abonament", "internet", "operator", "salon", "gsm"],
  }),
  K({
    slug: "telesprzedaz-start",
    tytul: "Telesprzedaż i call center",
    branza: "Telesprzedaż",
    poziom: "start",
    obietnica: "Naucz się sprzedawać przez telefon: pierwsze 10 sekund, pytania i umówienie spotkania.",
    dlaKogo: ["Chcesz pracować zdalnie albo w call center", "Masz dobry głos i nie boisz się telefonu", "Zaczynasz bez doświadczenia"],
    branzowe: {
      produkt: ["Pierwsze 10 sekund rozmowy", "Skrypt, który nie brzmi jak skrypt", "Umawianie spotkań dla handlowców"],
      obiekcje: ["„Skąd ma pan mój numer?”", "„Proszę wysłać maila”", "„Nie mam czasu”"],
    },
    klienciBruno: ["Klient, który chce się rozłączyć", "Sekretarka, która nie przełącza do szefa", "Klient, który prosi o maila"],
    pracodawcy: ["Call center", "Firmy umawiające spotkania", "Działy sprzedaży telefonicznej"],
    slowa: ["telefon", "telesprzedaż", "call center", "zdalnie", "cold call", "dzwonienie", "praca zdalna", "umawianie spotkań"],
  }),
  K({
    slug: "b2b-sdr-start",
    tytul: "SDR: umawianie spotkań w firmach technologicznych",
    branza: "IT i oprogramowanie",
    poziom: "start",
    obietnica: "Wejdź do sprzedaży w IT: umawiaj spotkania dla handlowców przez telefon, maila i LinkedIn.",
    dlaKogo: ["Chcesz pracować w firmie technologicznej", "Chcesz pracować zdalnie, także dla firm z zagranicy", "Zaczynasz bez doświadczenia"],
    branzowe: {
      produkt: ["Jak działa sprzedaż programów dla firm", "Cold mail i wiadomość na LinkedIn", "Kwalifikacja: czy firma ma problem i budżet"],
      obiekcje: ["„Mamy już takie narzędzie”", "„To nie mój dział”", "„Odezwijcie się w przyszłym kwartale”"],
    },
    klienciBruno: ["Dyrektor sprzedaży bez czasu", "Szef IT, który ma już dostawcę", "Właściciel firmy, który pyta o cenę w 1. minucie"],
    pracodawcy: ["Firmy produkujące oprogramowanie", "Agencje umawiające spotkania", "Startupy technologiczne"],
    slowa: ["it", "sdr", "bdr", "saas", "technologia", "oprogramowanie", "linkedin", "b2b", "startup", "zdalnie"],
  }),
  K({
    slug: "b2b-pro",
    tytul: "Sprzedaż B2B Pro: duże kontrakty z firmami",
    branza: "Sprzedaż firmom",
    poziom: "pro",
    obietnica: "Sprzedajesz firmom? Docieraj do osoby, która decyduje, i zamykaj większe kontrakty.",
    dlaKogo: ["Sprzedajesz firmom od roku lub dłużej", "Utykasz na „wrócimy do tematu”", "Chcesz przejść na wyższe stanowisko"],
    branzowe: {
      produkt: ["Badanie potrzeb: cel, działania, problem", "Kilka osób decyduje: jak dotrzeć do szefa", "Oferta na jedno „tak”"],
      obiekcje: ["„Proszę przesłać ofertę”", "„Mamy dostawcę”", "„Za drogo w porównaniu z konkurencją”"],
    },
    klienciBruno: ["Kierownik, który nie decyduje", "Prezes, który ma 15 minut", "Dział zakupów, który zbija cenę"],
    pracodawcy: ["Firmy produkcyjne", "Hurtownie i dystrybutorzy", "Firmy usługowe dla biznesu"],
    slowa: ["b2b", "firmy", "kontrakty", "key account", "account manager", "przetargi", "decydent"],
  }),
  K({
    slug: "przedstawiciel-handlowy-start",
    tytul: "Przedstawiciel handlowy w terenie",
    branza: "Handel i dystrybucja",
    poziom: "start",
    obietnica: "Naucz się obsługiwać sklepy i hurtownie w swoim regionie: wizyta, zamówienie, lepsze miejsce na półce.",
    dlaKogo: ["Lubisz jeździć i być w ruchu", "Chcesz mieć samochód służbowy", "Zaczynasz bez doświadczenia"],
    branzowe: {
      produkt: ["Plan wizyt na tydzień", "Rozmowa z właścicielem sklepu", "Promocje, półka, zamówienie"],
      obiekcje: ["„Mam pełny magazyn”", "„Inny przedstawiciel daje lepsze warunki”", "„To się u mnie nie sprzedaje”"],
    },
    klienciBruno: ["Właściciel sklepu bez czasu", "Kierownik hurtowni, który negocjuje rabat", "Klient, który zalega z płatnością"],
    pracodawcy: ["Producenci żywności i napojów", "Hurtownie", "Firmy budowlane i ogrodnicze"],
    slowa: ["przedstawiciel", "teren", "fmcg", "sklepy", "hurtownie", "dystrybucja", "samochód służbowy", "regionalny"],
  }),
  K({
    slug: "przedstawiciel-medyczny-start",
    tytul: "Przedstawiciel medyczny",
    branza: "Medycyna i farmacja",
    poziom: "start",
    obietnica: "Naucz się prowadzić krótkie, rzeczowe rozmowy z lekarzami i farmaceutami.",
    dlaKogo: ["Masz wykształcenie medyczne, biologiczne albo chcesz wejść do farmacji", "Lubisz rzeczowe rozmowy", "Zaczynasz w sprzedaży"],
    branzowe: {
      produkt: ["Rozmowa z lekarzem w 3 minuty", "Jak mówić o produkcie zgodnie z przepisami", "Wizyty w aptekach"],
      obiekcje: ["„Mam 2 minuty”", "„Przepisuję lek, który znam”", "„Pacjentów na to nie stać”"],
    },
    klienciBruno: ["Lekarz z kolejką pacjentów", "Farmaceutka, która poleca tańszy zamiennik", "Ordynator, który wymaga badań"],
    pracodawcy: ["Firmy farmaceutyczne", "Firmy sprzętu medycznego", "Firmy suplementów"],
    slowa: ["medyczny", "farmacja", "lekarze", "apteki", "leki", "sprzęt medyczny", "rep"],
  }),
  K({
    slug: "zamykanie-pro",
    tytul: "Zamykanie sprzedaży Pro",
    branza: "Każda branża",
    poziom: "pro",
    obietnica: "Masz dużo rozmów, a mało umów? Naucz się zamykać i zarabiaj więcej z tych samych klientów.",
    dlaKogo: ["Sprzedajesz od roku lub dłużej", "Klienci mówią „pomyślę” i znikają", "Chcesz wyższej prowizji albo awansu"],
    branzowe: {
      produkt: ["Pętla: wracanie do zamknięcia po każdej obiekcji", "Pytanie o decyzję bez nacisku", "Follow-up, który nie jest przypominaniem"],
      obiekcje: ["„Muszę pomyśleć”", "„Zapytam żony / wspólnika”", "„Gdyby cena była niższa…”"],
    },
    klienciBruno: ["Klient, który mówi „pomyślę”", "Klient, który musi zapytać żonę", "Klient, który chce rabatu na koniec"],
    pracodawcy: ["Firmy, w których płaci się od wyniku", "Nieruchomości, OZE, motoryzacja, ubezpieczenia"],
    slowa: ["zamykanie", "domykanie", "closing", "pomyślę", "prowizja", "awans", "więcej zarabiać", "doświadczony"],
  }),
];

export function kursPoSlugu(slug: string): Kurs | null {
  return KURSY.find((k) => k.slug === slug) ?? null;
}

export function programKursu(k: Kurs): Miesiac[] {
  return [
    {
      tytul: k.poziom === "start" ? "Fundamenty i Twoja branża" : "Diagnoza i nowe techniki",
      punkty: [
        k.poziom === "start" ? "Jak wygląda dobra rozmowa sprzedażowa od początku do końca" : "Bruno ocenia Twoje 5 pierwszych rozmów i pokazuje 3 najsłabsze punkty",
        ...k.branzowe.produkt,
        "Codziennie 5 rozmów z Bruno, po każdej ocena i wskazówki",
      ],
    },
    {
      tytul: "Obiekcje i zamykanie",
      punkty: [
        ...k.branzowe.obiekcje.map((o) => `Odpowiedź na ${o}`),
        "Pytanie o decyzję bez nacisku",
        "Fiszki z technikami, powtarzane, aż wejdą w nawyk",
      ],
    },
    {
      tytul: "Egzamin i przygotowanie do pracy",
      punkty: [
        "Trudni klienci na najwyższym poziomie",
        `Egzamin z Bruno: certyfikat od ${GWARANCJA.progCertyfikatu} %`,
        "Rozmowa rekrutacyjna przećwiczona z Bruno",
        "Łączymy Cię z pracodawcami",
      ],
    },
  ];
}

/** Dopasowanie bez AI (zapas, gdy model nie odpowie): punkty za słowa z zapytania. */
const bezOgonkow = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l");

export function dopasujBezAI(zapytanie: string, poziom: Poziom | null, ile = 3): Kurs[] {
  const q = bezOgonkow(zapytanie);
  const wynik = KURSY.map((k) => {
    let pkt = 0;
    for (const s of k.slowa) if (q.includes(bezOgonkow(s))) pkt += 2;
    if (q.includes(bezOgonkow(k.branza))) pkt += 2;
    if (poziom && k.poziom === poziom) pkt += 3;
    return { k, pkt };
  })
    .filter((x) => x.pkt > (poziom ? 3 : 0))
    .sort((a, b) => b.pkt - a.pkt)
    .map((x) => x.k);
  if (wynik.length) return wynik.slice(0, ile);
  return KURSY.filter((k) => k.slug === (poziom === "pro" ? "zamykanie-pro" : "podstawy-sprzedazy"));
}
