"use client";

// Prezentacja INWESTORSKA Bruno AI (/materialy). Wersja 1 (2026-10-28):
// układ i klocki skopiowane z decku Gabi (zwiazki-lp, wersja 4), dodane
// brakujące slajdy: problem, rozwiązanie, produkt, wyniki, pozyskiwanie
// klientów, zespół. Budżet miesiąc po miesiącu zastąpiony jednym slajdem
// kwartalnym w załączniku na końcu.
//
// Liczby: 3 płacące firmy OZE (3 + 5 + 6 handlowców) × 399 zł netto/mc,
// rozmowy i minuty z bazy 27.10. Prognoza, kwota i % udziałów = założenia
// do potwierdzenia przez USER_001.

import { METAL, Naglowek, PokazSlajdow, SZKLO, Tabela } from "./ui";
import {
  Kolumny,
  KolumnyGrupowane,
  MacierzPorownania,
  PaskiWielkosci,
  PaskiZakresu,
  Statka,
} from "./wykresy";

const HASLO = "bruno2026";
const KLUCZ_SESJI = "prezentacja_bruno_odblokowana";

/* Pasek źródeł na dole slajdu. Źródło bez adresu = sam tekst. */
function Zrodla({ linki }: { linki: { nazwa: string; url?: string }[] }) {
  return (
    <p className="mx-auto mt-6 max-w-4xl text-center text-xs text-[var(--tekst-cichy)]">
      Źródła:{" "}
      {linki.map((z, i) => (
        <span key={z.nazwa}>
          {i > 0 && " · "}
          {z.url ? (
            <a
              href={z.url}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-[var(--ramka)] underline-offset-2 hover:text-[var(--tekst)]"
            >
              {z.nazwa}
            </a>
          ) : (
            z.nazwa
          )}
        </span>
      ))}
    </p>
  );
}

/* Karta z nagłówkiem i treścią (kroki, osoby, pozycje). */
function Karta({ tytul, children }: { tytul: string; children: React.ReactNode }) {
  return (
    <div className={`${SZKLO} overflow-hidden`}>
      <div className="border-b border-[var(--ramka)] bg-[rgba(233,245,66,0.35)] px-5 py-2.5 text-sm font-semibold text-[var(--tekst)]">
        {tytul}
      </div>
      <div className="px-5 py-3 text-sm text-[var(--tekst)]">{children}</div>
    </div>
  );
}

/* 1. Tytuł */
function SlajdTytul() {
  return (
    <div className="flex flex-col items-center text-center">
      <img
        src="/bruno/ikona-96.png"
        alt="Bruno AI"
        className="mb-8 h-20 w-20 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.10)]"
      />
      <h1 className="text-5xl font-bold tracking-tight text-[var(--tekst)] sm:text-7xl">
        <span style={METAL}>Bruno AI</span>
      </h1>
      <p className="mt-5 max-w-2xl text-xl text-[var(--tekst-cichy)] sm:text-2xl">
        Trening handlowców
      </p>
    </div>
  );
}

/* 2. Problem */
function SlajdProblem() {
  return (
    <div className="w-full max-w-5xl">
      <Naglowek kompakt nad="Problem">
        Handlowcy <span style={METAL}>nie ćwiczą</span>, uczą się na klientach
      </Naglowek>
      <div className="grid gap-4 sm:grid-cols-3">
        <Statka
          wartosc="35-50%"
          opis="handlowców w terenie odchodzi z firmy co rok"
          przypis="każdy nowy uczy się na prawdziwych klientach"
        />
        <Statka
          wartosc="1,5×"
          opis="rocznej pensji kosztuje zastąpienie jednego handlowca"
          przypis="rekrutacja, wdrożenie, utracona sprzedaż"
        />
        <Statka
          wartosc="93-185 tys. zł"
          opis="za jednorazowe szkolenie sprzedażowe dla firmy"
          przypis="raz w roku, potem nikt tego nie powtarza"
        />
      </div>
      <div className="mt-4">
        <Tabela
          kompakt
          naglowki={["Szef firmy z 5-50 handlowcami", "Skutek"]}
          wiersze={[
            ["Nie ma czasu ćwiczyć z każdym", "handlowcy ćwiczą na prawdziwych klientach"],
            ["Nie wie, kto przegrywa na obiekcji o cenę, a kto na zamknięciu", "szkoli wszystkich tak samo"],
            ["Widzi tylko wynik na koniec miesiąca", "reaguje, gdy sprzedaż już przepadła"],
          ]}
        />
      </div>
      <Zrodla
        linki={[
          { nazwa: "RepCard: rotacja handlowców w terenie", url: "https://repcard.com/glossary/sales-rep-turnover.md" },
          { nazwa: "Center for Sales Strategy: koszt rotacji", url: "https://blog.thecenterforsalesstrategy.com/5-ways-to-reduce-high-turnover-rates" },
          { nazwa: "cenniki trenerów (Jason Bay, Jeb Blount), research 10.10.2026" },
        ]}
      />
    </div>
  );
}

/* 3. Rozwiązanie: jak działa w 3 krokach */
function SlajdRozwiazanie() {
  const kroki = [
    {
      tytul: "1. Rozmowa głosem",
      opis: "Handlowiec dzwoni do Bruno. Bruno gra klienta firmy: ten sam produkt, te same obiekcje, ta sama branża. 5-10 minut dziennie.",
    },
    {
      tytul: "2. Ocena od trenera AI",
      opis: "Po rozmowie ocena 1-10 w 5 kryteriach i konkretne zdania do poprawy. Na technikach Negacza, Rackhama (SPIN), Vossa, Sandlera.",
    },
    {
      tytul: "3. Powtórki i panel szefa",
      opis: "Fiszki z błędów wracają, aż wejdą w nawyk. Szef widzi średnią zespołu, trend i kto w czym potrzebuje treningu.",
    },
  ];
  return (
    <div className="w-full max-w-5xl">
      <Naglowek kompakt nad="Rozwiązanie">
        Sparingpartner <span style={METAL}>na każdy dzień</span>
      </Naglowek>
      <div className="grid gap-4 sm:grid-cols-3">
        {kroki.map((k) => (
          <Karta key={k.tytul} tytul={k.tytul}>
            {k.opis}
          </Karta>
        ))}
      </div>
      <p className="mx-auto mt-6 max-w-3xl text-center text-base text-[var(--tekst-cichy)]">
        Trener uczy raz. Bruno ćwiczy codziennie. Nie zastępuje szkolenia,
        robi z niego nawyk.
      </p>
    </div>
  );
}

/* 4. Produkt: zrzuty ekranu */
function SlajdProdukt() {
  const zrzuty = [
    { src: "/bruno/zrzuty/rinesk-szef.jpg", podpis: "Panel szefa: średnia zespołu i trend" },
    { src: "/bruno/zrzuty/rinesk-profil.jpg", podpis: "Profil handlowca: umiejętności" },
    { src: "/bruno/zrzuty/rinesk-panel.jpg", podpis: "Panel handlowca: rozmowy i ocena" },
  ];
  return (
    <div className="w-full max-w-6xl">
      <Naglowek kompakt nad="System">
        Produkt <span style={METAL}>SaaS</span>
      </Naglowek>
      <div className="grid gap-4 sm:grid-cols-3">
        {zrzuty.map((z) => (
          <div key={z.src} className={`${SZKLO} overflow-hidden`}>
            <img src={z.src} alt={z.podpis} className="aspect-[16/10] w-full object-cover object-left-top" />
            <div className="border-t border-[var(--ramka)] px-4 py-2.5 text-center text-sm font-medium text-[var(--tekst)]">
              {z.podpis}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <Tabela
          kompakt
          naglowki={["Część", "Technologia"]}
          wiersze={[
            ["Głos klienta AI", "ElevenLabs"],
            ["Trener oceniający rozmowy", "Claude (Anthropic)"],
            ["Powtórki", "fiszki FSRS"],
            ["Dane", "w UE, nagrania kasowane wg umowy powierzenia"],
            ["Demo na żywo", "salesbruno.pl"],
          ]}
        />
      </div>
    </div>
  );
}

/* 5. Wyniki: najważniejszy slajd */
function SlajdWyniki() {
  return (
    <div className="w-full max-w-5xl">
      <Naglowek kompakt nad="Wyniki">
        <span style={METAL}>3 płacące firmy</span> w 4 tygodnie
      </Naglowek>
      <div className="grid gap-4 sm:grid-cols-4">
        <Statka wartosc="3" opis="płacące firmy (branża OZE)" przypis="z networkingu, 0 zł reklam" />
        <Statka wartosc="14" opis="płacących handlowców" przypis="zespoły 3, 5 i 6 osób" />
        <Statka wartosc="5 586 zł" opis="MRR netto" przypis="14 × 399 zł/mc" />
        <Statka wartosc="67 tys. zł" opis="ARR netto" przypis="przy obecnych klientach" />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Statka wartosc="445" opis="rozmów z Bruno w systemie" przypis="1 258 minut treningu" />
        <Statka wartosc="3" opis="umówione dema z nowymi firmami" przypis="do 12.11.2026" />
        <Statka wartosc="v1.0" opis="aplikacja iOS prawie gotowa" przypis="październik 2026" />
      </div>
      <PaskiWielkosci
        tytul="Płacący handlowcy w firmach"
        wiersze={[
          { nazwa: "Firma OZE nr 1", wartosc: 6, etykieta: "6 handlowców · 2 394 zł/mc" },
          { nazwa: "Firma OZE nr 2", wartosc: 5, etykieta: "5 handlowców · 1 995 zł/mc" },
          { nazwa: "Ewatex", wartosc: 3, etykieta: "3 handlowców · 1 197 zł/mc" },
        ]}
      />
    </div>
  );
}

/* 6. Rynek */
function SlajdRynek() {
  return (
    <div className="w-full max-w-5xl">
      <Naglowek kompakt nad="Rynek">
        Szkolenia sprzedaży <span style={METAL}>podwoją się</span> do 2032
      </Naglowek>
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Statka
          wartosc="31,3 mld zł"
          opis="rynek szkoleń sprzedażowych na świecie (2025)"
          delta="62,5 mld zł w 2032"
        />
        <Statka
          wartosc="11,8 mld zł"
          opis="oprogramowanie do szkoleń sprzedaży, świat"
          przypis="38,5% Ameryka Północna"
        />
        <Statka
          wartosc="87%"
          opis="firm sprzedażowych używa AI"
          przypis="Salesforce, State of Sales 2026"
        />
      </div>
      <Tabela
        kompakt
        naglowki={["Rynek", "Ludzie w sprzedaży", "Co liczone", "Dla Bruno"]}
        wiersze={[
          ["🇬🇧 Wielka Brytania", "952 tys.", "sprzedaż i marketing", "rynek nr 1 za granicą"],
          ["🇺🇸 USA", "13,4 mln", "sprzedaż (z handlem detalicznym)", "największy rynek, najwyższa cena"],
        ]}
      />
      <Zrodla
        linki={[
          { nazwa: "Coherent Market Insights" },
          { nazwa: "MarketIntelo" },
          { nazwa: "Salesforce State of Sales 2026" },
          { nazwa: "Statista UK Q1 2025" },
          { nazwa: "BLS: sprzedawcy w USA, V 2024", url: "https://www.bls.gov/opub/ted/2025/recognizing-sales-workers-on-salesperson-day.htm" },
          { nazwa: "kurs 1 $ ≈ 3,7 zł" },
        ]}
      />
    </div>
  );
}

/* 7. Konkurencja: ceny za handlowca miesięcznie */
function SlajdKonkurencja() {
  return (
    <div className="w-full max-w-5xl">
      <Naglowek kompakt nad="Konkurencja">
        Firmy już płacą, <span style={METAL}>tylko więcej</span>
      </Naglowek>
      <PaskiZakresu
        max={1100}
        osie={[
          { wartosc: 0, etykieta: "0 zł" },
          { wartosc: 250, etykieta: "250" },
          { wartosc: 500, etykieta: "500" },
          { wartosc: 750, etykieta: "750" },
          { wartosc: 1100, etykieta: "1 100 zł / handlowca / mc" },
        ]}
        wiersze={[
          { nazwa: "Bruno AI", opis: "klient AI + trener + fiszki, PL", od: 380, do_: 399, etykieta: "399 zł netto/mc", akcent: true },
          { nazwa: "Hyperbound (USA)", opis: "AI do ćwiczenia rozmów, EN", od: 370, do_: 925, etykieta: "370-925 zł/mc" },
          { nazwa: "Szkolenie stacjonarne", opis: "trener w firmie, raz w roku", od: 515, do_: 1030, etykieta: "515-1 030 zł/mc (93-185 tys. zł / 15 osób / rok)" },
          { nazwa: "John Barrows", opis: "kursy wideo, bez AI", od: 145, do_: 160, etykieta: "ok. 155 zł/mc" },
        ]}
      />
      <p className="mx-auto mt-6 max-w-3xl text-center text-base text-[var(--tekst-cichy)]">
        Najbliższy konkurent: AskJeremy.ai (Jeremy Miner + Soar). Tylko po
        angielsku, jedna metoda (NEPQ). W Polsce nikt nie sprzedaje
        ćwiczenia rozmów z AI.
      </p>
      <Zrodla
        linki={[
          { nazwa: "Hyperbound: AI sales roleplay 2026", url: "https://www.hyperbound.ai/blog/ai-sales-roleplay-tools-2026" },
          { nazwa: "30MPC / John Barrows, cenniki" },
          { nazwa: "kurs 1 $ ≈ 3,7 zł" },
        ]}
      />
    </div>
  );
}

/* 8. Gdzie wygrywamy: macierz porównania */
function SlajdPrzewagi() {
  return (
    <div className="w-full max-w-5xl">
      <Naglowek kompakt nad="Przewagi">
        Gdzie <span style={METAL}>wygrywamy</span>
      </Naglowek>
      <MacierzPorownania
        kolumny={["", "Bruno AI", "AskJeremy.ai", "Hyperbound", "Szkolenie"]}
        wyrozniona={1}
        wiersze={[
          ["Klient AI pod produkt i branżę firmy", "✅", "brak danych", "✅", "—"],
          ["Po polsku", "✅", "— (EN)", "— (EN)", "✅"],
          ["Ocena każdej rozmowy", "✅ 5 kryteriów", "✅", "✅", "—"],
          ["Wiele metod (Negacz, SPIN, Voss, Sandler)", "✅", "— (tylko NEPQ)", "brak danych", "— (1 trener)"],
          ["Fiszki z błędów, powtórki", "✅", "brak danych", "brak danych", "—"],
          ["Panel szefa: kto w czym słaby", "✅", "brak danych", "✅", "—"],
          ["Ćwiczenie codziennie", "✅", "✅", "✅", "— (raz w roku)"],
        ]}
      />
      <p className="mx-auto mt-6 max-w-3xl text-center text-base text-[var(--tekst-cichy)]">
        Polska = rynek bez konkurencji, na którym uczymy produkt. Za granicą
        wchodzimy z gotowymi case'ami i ceną niższą od Hyperbound.
      </p>
    </div>
  );
}

/* 9. Model biznesowy */
function SlajdOferta() {
  return (
    <div className="w-full max-w-5xl">
      <Naglowek kompakt nad="Model biznesowy">
        Abonament <span style={METAL}>za handlowca</span>
      </Naglowek>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={`${SZKLO} overflow-hidden text-center`}>
          <div className="border-b border-[var(--ramka)] bg-[rgba(20,20,22,0.04)] px-6 py-2.5 text-xs uppercase tracking-[0.2em] text-[var(--tekst-cichy)]">Pilot</div>
          <div className="px-6 py-4 text-4xl font-bold text-[var(--tekst)]">3 × 399 zł<span className="text-lg font-normal text-[var(--tekst-cichy)]">/mc</span></div>
          <div className="border-t border-[var(--ramka)] px-6 py-2.5 text-sm text-[var(--tekst-cichy)]">3 handlowców, 3 miesiące, 3 591 zł netto</div>
        </div>
        <div className={`${SZKLO} overflow-hidden border-2 border-[var(--akcent)] text-center`}>
          <div className="border-b border-[var(--ramka)] bg-[rgba(233,245,66,0.35)] px-6 py-2.5 text-xs uppercase tracking-[0.2em] text-[var(--tekst)]">Zespół</div>
          <div className="px-6 py-4 text-4xl font-bold text-[var(--tekst)]">399 zł<span className="text-lg font-normal text-[var(--tekst-cichy)]"> / handlowca / mc</span></div>
          <div className="border-t border-[var(--ramka)] px-6 py-2.5 text-sm text-[var(--tekst-cichy)]">cały zespół po 8 tygodniach pilota + panel szefa</div>
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Statka wartosc="249 zł" opis="zostaje z 1 handlowca miesięcznie" przypis="399 zł minus 150 zł na AI = 62% marży" />
        <Statka wartosc="4,8 tys. zł" opis="rocznie z 1 handlowca" przypis="firma 10 osób = 48 tys. zł/rok" />
        <Statka wartosc="370-925 zł" opis="za handlowca w USA" przypis="ta sama usługa, wyższa cena" />
      </div>
    </div>
  );
}

/* 10. Pozyskiwanie klientów */
function SlajdPozyskiwanie() {
  const etapy = [
    { tytul: "1. Event", opis: "networking (BNI, grupy biznesowe), webinar dla właścicieli firm, LinkedIn: 6 branż" },
    { tytul: "2. Demo 20 min", opis: "online, z decydentem, Bruno gra klienta firmy na żywo, na jej obiekcji" },
    { tytul: "3. Pilot", opis: "3 handlowców × 3 mies." },
    { tytul: "4. Zespół", opis: "po 8 tygodniach cały zespół, raport dla szefa z liczbami" },
  ];
  return (
    <div className="w-full max-w-5xl">
      <Naglowek kompakt nad="Pozyskiwanie klientów">
        Jak <span style={METAL}>pozyskujemy firmy</span>
      </Naglowek>
      <div className="grid gap-4 sm:grid-cols-4">
        {etapy.map((e) => (
          <Karta key={e.tytul} tytul={e.tytul}>
            {e.opis}
          </Karta>
        ))}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Statka wartosc="0 zł" opis="wydane na reklamy do dziś" przypis="koszt = czas założyciela" />
        <Statka wartosc="6" opis="branż na start" przypis="OZE, motoryzacja, nieruchomości, ubezpieczenia, kredyty i leasing, call center" />
        <Statka wartosc="UK" opis="za granicą: cold mail + LinkedIn" przypis="po 10 case'ach z Polski" />
      </div>
    </div>
  );
}

/* 12. Plan wzrostu: płacący handlowcy */
function SlajdPlanKlientow() {
  return (
    <div className="w-full max-w-5xl">
      <Naglowek kompakt nad="Plan wzrostu">
        <span style={METAL}>8 000 handlowców</span> do 2030
      </Naglowek>
      <Kolumny
        dane={[
          { wartosc: 14, etykieta: "14", podpisy: ["dziś", "5,6 tys. zł MRR", "3 firmy"] },
          { wartosc: 60, etykieta: "60", podpisy: ["XII 2026", "24 tys. zł MRR", "10 firm"] },
          { wartosc: 300, etykieta: "300", podpisy: ["VI 2027", "120 tys. zł MRR", "45 firm"] },
          { wartosc: 800, etykieta: "800", podpisy: ["XII 2027", "320 tys. zł MRR", "start UK"] },
          { wartosc: 1600, etykieta: "1 600", podpisy: ["VI 2028", "640 tys. zł MRR", "UK + IE"] },
          { wartosc: 2500, etykieta: "2 500", podpisy: ["XII 2028", "1 mln zł MRR", "start USA"] },
          { wartosc: 5000, etykieta: "5 000", podpisy: ["XII 2029", "2 mln zł MRR", "ok. 600 firm"] },
          { wartosc: 8000, etykieta: "8 000", podpisy: ["XII 2030", "3,2 mln zł MRR", "ok. 1 000 firm"] },
        ]}
      />
      <p className="mx-auto mt-5 max-w-3xl text-center text-sm text-[var(--tekst-cichy)]">
        MRR = handlowcy × 399 zł miesięcznie. Średnia firma rośnie z 5 do 8 handlowców.
      </p>
    </div>
  );
}

/* 13. Przychód i zysk */
function SlajdFinanse() {
  return (
    <div className="w-full max-w-5xl">
      <Naglowek kompakt nad="Finanse">
        Przychód <span style={METAL}>i zysk</span>
      </Naglowek>
      <KolumnyGrupowane
        legenda={{ a: "Przychód (mln zł)", b: "Koszty (mln zł)" }}
        grupy={[
          {
            tytul: "2027",
            a: { wartosc: 1.9, etykieta: "1,9" },
            b: { wartosc: 3.6, etykieta: "3,6" },
            wynik: { tekst: "-1,7 mln zł", ton: "zly" },
            podpisy: ["handlowcy na koniec roku: 800", "średnio płacących: ~400"],
          },
          {
            tytul: "2028",
            a: { wartosc: 8.1, etykieta: "8,1" },
            b: { wartosc: 8.7, etykieta: "8,7" },
            wynik: { tekst: "-0,6 mln zł", ton: "zly" },
            podpisy: ["handlowcy na koniec roku: 2 500", "średnio płacących: ~1 700"],
          },
          {
            tytul: "2029",
            a: { wartosc: 18.4, etykieta: "18,4" },
            b: { wartosc: 16.4, etykieta: "16,4" },
            wynik: { tekst: "+2,0 mln zł", ton: "dobry" },
            podpisy: ["handlowcy na koniec roku: 5 000", "średnio płacących: ~3 850"],
          },
          {
            tytul: "2030",
            a: { wartosc: 31.6, etykieta: "31,6" },
            b: { wartosc: 27.1, etykieta: "27,1" },
            wynik: { tekst: "+4,5 mln zł", ton: "dobry" },
            podpisy: ["handlowcy na koniec roku: 8 000", "średnio płacących: ~6 600"],
          },
        ]}
      />
    </div>
  );
}

/* 14. Ile chcemy i co dostaje inwestor */
function SlajdZwrot() {
  return (
    <div className="w-full max-w-5xl">
      <Naglowek kompakt nad="Inwestycja">
        3 mln zł za <span style={METAL}>5% udziałów</span>
      </Naglowek>
      <div className="grid gap-4 sm:grid-cols-[1fr_1.6fr]">
        <Kolumny
          wysokosc={230}
          dane={[
            { wartosc: 0.1, etykieta: "100 tys. zł", podpisy: ["2029", "zysk firmy +2,0 mln zł"] },
            { wartosc: 0.225, etykieta: "225 tys. zł", podpisy: ["2030", "zysk firmy +4,5 mln zł"] },
          ]}
        />
        <div className="flex flex-col gap-4">
          <Statka wartosc="38,3 mln zł" opis="ARR na koniec 2030" przypis="8 000 handlowców × 399 zł × 12" />
          <Statka wartosc="192-307 mln zł" opis="wycena firmy w 2030" przypis="mnożnik 5-8× ARR dla SaaS" />
          <Statka wartosc="9,6-15,3 mln zł" opis="wartość pakietu 5%" przypis="3,2-5,1× zwrotu w 4 lata" />
        </div>
      </div>
      <p className="mx-auto mt-4 max-w-3xl text-center text-sm text-[var(--tekst-cichy)]">
        Po lewej: 5% zysku firmy (cały zysk na dywidendę). Wycena przed inwestycją: 57 mln zł.
      </p>
      <Zrodla
        linki={[
          { nazwa: "Aventis Advisors: mnożniki wycen SaaS", url: "https://aventis-advisors.com/saas-valuation-multiples/" },
        ]}
      />
    </div>
  );
}

/* 15. Wypłata w 3 transzach za kamienie milowe */
function SlajdTransze() {
  const punkty = [
    { kwota: "1 mln zł", kamien: "Podpisanie umowy", termin: "XI 2026", opis: "zespół w Polsce, 300 handlowców do VI 2027" },
    { kwota: "1 mln zł", kamien: "300 handlowców", termin: "VI 2027", opis: "wejście do UK i Irlandii, szef sprzedaży UK" },
    { kwota: "1 mln zł", kamien: "800 handlowców", termin: "XII 2027", opis: "skalowanie UK, przygotowanie USA" },
    { kwota: "🎯", kamien: "8 000 handlowców", termin: "2030", opis: "31,6 mln zł przychodu" },
  ];
  return (
    <div className="w-full max-w-5xl">
      <Naglowek kompakt nad="Wypłata inwestycji">
        3 mln zł w <span style={METAL}>trzech transzach</span>
      </Naglowek>
      <div className="relative">
        {/* linia łącząca kółka (tylko na szerokim ekranie) */}
        <div
          aria-hidden
          className="absolute left-[12%] right-[12%] top-9 hidden h-0.5 bg-[var(--akcent)] sm:block"
        />
        <div className="grid gap-4 sm:grid-cols-4">
          {punkty.map((p) => (
            <div key={p.kamien} className="relative flex flex-col items-center text-center">
              <div className="relative z-10 flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-[var(--akcent)] bg-[#e9f542] text-sm font-bold text-[var(--tekst)] shadow-[0_8px_24px_var(--akcent-cien)]">
                {p.kwota}
              </div>
              <div className={`${SZKLO} mt-4 w-full px-4 py-4`}>
                <div className="text-sm font-semibold text-[var(--tekst)]">{p.kamien}</div>
                <div className="mt-0.5 text-xs font-medium text-[var(--tekst)]">{p.termin}</div>
                <div className="mt-1.5 text-xs text-[var(--tekst-cichy)]">{p.opis}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="mx-auto mt-6 max-w-3xl text-center text-base text-[var(--tekst-cichy)]">
        Udziały obejmowane proporcjonalnie do wpłaconych transz.
      </p>
    </div>
  );
}

/* 16. Budżet pierwszej transzy: podział na kategorie */
function SlajdBudzet() {
  const pozycje = [
    { nazwa: "Marketing i sprzedaż", procent: 56, etykieta: "56%", kwota: "560 tys. zł", opis: "eventy, webinary, LinkedIn, treści wideo, remarketing" },
    { nazwa: "Zespół", procent: 24, etykieta: "24%", kwota: "240 tys. zł", opis: "założyciel, wdrożenia, handlowiec B2B" },
    { nazwa: "Technologia", procent: 11, etykieta: "11%", kwota: "110 tys. zł", opis: "serwery w UE, aplikacja iOS i Android, rozwój produktu (minuty AI płacone z abonamentów)" },
    { nazwa: "Prawne i administracja", procent: 5, etykieta: "5%", kwota: "50 tys. zł", opis: "sp. z o.o., umowa inwestycyjna, RODO, znak towarowy" },
    { nazwa: "Bufor", procent: 4, etykieta: "4%", kwota: "40 tys. zł", opis: "rezerwa bezpieczeństwa" },
  ];
  return (
    <div className="w-full max-w-4xl">
      <Naglowek kompakt nad="Budżet: 1. transza">
        Na co idzie <span style={METAL}>1 mln zł</span>
      </Naglowek>
      <div className={`${SZKLO} px-6 py-6`}>
        <div className="flex flex-col divide-y divide-[var(--ramka)]">
          {pozycje.map((p) => (
            <div key={p.nazwa} className="py-3 first:pt-0 last:pb-0">
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold text-[var(--tekst)]">
                  {p.nazwa}
                  <span className="ml-2 font-normal text-[var(--tekst-cichy)]">{p.opis}</span>
                </span>
                <span className="whitespace-nowrap text-base font-bold text-[var(--tekst)]">
                  {p.kwota} <span className="font-semibold text-[var(--tekst-cichy)]">· {p.etykieta}</span>
                </span>
              </div>
              <div className="h-2.5 w-full rounded-r-[4px] bg-[rgba(20,20,22,0.08)]">
                <div
                  className="h-2.5 rounded-r-[4px] bg-[var(--akcent)]"
                  style={{ width: `${p.procent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="mx-auto mt-4 max-w-3xl text-center text-sm text-[var(--tekst-cichy)]">
        Listopad 2026 - czerwiec 2027, do kamienia 300 handlowców.
        Rozpiska kwartalna w załączniku.
      </p>
    </div>
  );
}

/* 17. Ekspansja */
function SlajdEkspansja() {
  const kraje = [
    { flaga: "🇵🇱", kraj: "Polska", kiedy: "teraz", co: "laboratorium produktu, pierwsze case'y, networking" },
    { flaga: "🇬🇧", kraj: "Wielka Brytania", kiedy: "II poł. 2027", co: "952 tys. osób w sprzedaży, cold mail B2B legalny" },
    { flaga: "🇮🇪", kraj: "Irlandia", kiedy: "2028", co: "europejskie centra Google, Salesforce, HubSpot, tysiące SDR-ów" },
    { flaga: "🇺🇸", kraj: "USA", kiedy: "koniec 2028", co: "największy rynek, 370-925 zł za handlowca" },
  ];
  return (
    <div className="w-full max-w-5xl">
      <Naglowek kompakt nad="Ekspansja">
        Polska <span style={METAL}>→ świat</span>
      </Naglowek>
      <div className="grid gap-3 sm:grid-cols-4">
        {kraje.map((k) => (
          <div key={k.kraj} className={`${SZKLO} overflow-hidden text-center`}>
            <div className="border-b border-[var(--ramka)] bg-[rgba(20,20,22,0.04)] px-3 py-2 text-sm font-semibold text-[var(--tekst)]">
              {k.flaga} {k.kraj}
            </div>
            <div className="px-3 pt-3 text-lg font-bold text-[var(--tekst)]">{k.kiedy}</div>
            <div className="px-3 pb-3 pt-1 text-xs text-[var(--tekst-cichy)]">{k.co}</div>
          </div>
        ))}
      </div>
      <Zrodla linki={[{ nazwa: "Statista UK Q1 2025" }, { nazwa: "research rynków Bruno 08.10.2026" }]} />
    </div>
  );
}

/* 18. Załącznik: budżet 1. transzy kwartał po kwartale */
function SlajdZalacznik() {
  return (
    <div className="w-full max-w-5xl">
      <Naglowek kompakt nad="Załącznik">
        Budżet 1. transzy <span style={METAL}>kwartał po kwartale</span>
      </Naglowek>
      <Tabela
        kompakt
        wyroznionyWiersz={5}
        naglowki={["tys. zł", "XI-XII 2026", "I-III 2027", "IV-VI 2027", "Razem"]}
        wiersze={[
          ["Marketing i sprzedaż", "120", "200", "240", "560"],
          ["Zespół", "30", "105", "105", "240"],
          ["Technologia", "20", "40", "50", "110"],
          ["Prawne i administracja", "30", "10", "10", "50"],
          ["Bufor", "0", "20", "20", "40"],
          ["Razem", "200", "375", "425", "1 000"],
        ]}
      />
      <p className="mx-auto mt-4 max-w-3xl text-center text-sm text-[var(--tekst-cichy)]">
        Zespół od I 2027: założyciel 15 tys. zł/mc, wdrożenia 8 tys. zł/mc,
        handlowiec B2B 12 tys. zł/mc. Kamień na koniec okresu: 300 płacących
        handlowców.
      </p>
    </div>
  );
}

const SLAJDY = [
  SlajdTytul,
  SlajdProblem,
  SlajdRozwiazanie,
  SlajdProdukt,
  SlajdWyniki,
  SlajdRynek,
  SlajdKonkurencja,
  SlajdPrzewagi,
  SlajdOferta,
  SlajdPozyskiwanie,
  SlajdPlanKlientow,
  SlajdFinanse,
  SlajdZwrot,
  SlajdTransze,
  SlajdBudzet,
  SlajdEkspansja,
  SlajdZalacznik,
];

export function PrezentacjaInwestorBruno() {
  return <PokazSlajdow haslo={HASLO} kluczSesji={KLUCZ_SESJI} slajdy={SLAJDY} />;
}
