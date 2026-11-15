import type { Metadata } from "next";
import BazaPasek from "@/components/bruno/praca/baza-pasek";
import KulaLimonka from "@/components/bruno/kula-limonka";
import { Pojawianie, PasekDolny } from "./ruch";
import d from "@/components/bruno/praca/dolacz.module.css";
import a from "./akademia.module.css";

// 14.11 (USER_001): salesbruno.pl/academy (15.11, było /akademia) = Akademia Sprzedaży dla handlowców, subskrypcja 50 zł / mies.
// 15.11 (USER_001): psychologia sprzedaży zamiast technik. Każdy kursant ma swoją ścieżkę od dnia dołączenia:
// lekcja odblokowuje się w sobotę, trening z Bruno w poniedziałek. Na górze koło 40 / 30 / 30
// (wg USER_001 koło Rafała Mazura; źródło niepotwierdzone, więc na stronie bez nazwiska).
// 15.11 LIVE na salesbruno.pl/academy, jeszcze bez płatności (przyciski prowadzą do #cena): link Stripe i dostęp do lekcji do zbudowania.
const tytul = "Akademia Sprzedaży";
const opis = "Psychologia sprzedaży: co sobotę lekcja, co poniedziałek trening rozmowy z Bruno AI. 50 zł miesięcznie.";

export const metadata: Metadata = {
  metadataBase: new URL("https://salesbruno.pl"),
  title: `${tytul} | SalesBruno.pl`,
  description: opis,
  alternates: { canonical: "/academy" },
  robots: { index: false, follow: false },
};

const CENA = 50;
// TODO: link Stripe (subskrypcja 50 zł / 30 dni), konto do decyzji USER_001.
const PLATNOSC = "#cena";

// Koło: kolor segmentu = kolor tagu przy lekcji.
const KOLO = [
  { klucz: "obraz", proc: 40, nazwa: "Twój obraz siebie", kolor: "var(--orange)" },
  { klucz: "mysli", proc: 30, nazwa: "To, w jaki sposób myślisz", kolor: "var(--czarny)" },
  { klucz: "techniki", proc: 30, nazwa: "Techniki sprzedaży", kolor: "#b9bcc3" },
] as const;
type Klucz = (typeof KOLO)[number]["klucz"];

// Pierwsze 4 tygodnie. Tydzień = lekcja (sobota) + trening z Bruno na tę samą rzecz (poniedziałek).
// 15.11 (USER_001): 3 miesiące szkolenia mentalnego, każdy miesiąc = psychologia sprzedaży (bez podziału na obszary koła).
// Tydzień = lekcja (sobota) + trening z Bruno na tę samą rzecz (poniedziałek). Tematy z badania 15.11 (stres przed telefonem,
// odmowa, cena, „muszę się zastanowić”, „wiem, ale zapominam w rozmowie”).
const MIESIACE: { tygodnie: [string, string][] }[] = [
  {
    tygodnie: [
      ["Kim jesteś, gdy dzwonisz", "Pierwsze 30 sekund rozmowy, bez przepraszania"],
      ["Zasługuję na tę cenę", "Podajesz cenę i milczysz"],
      ["Pewność siebie w głosie", "Rozmowa bez „chyba”, „może” i „przepraszam”"],
      ["Doradzasz, nie prosisz", "Klient chce rabatu, a Ty go nie dajesz"],
    ],
  },
  {
    tygodnie: [
      ["Odmowa to nie o Tobie", "Klient mówi „nie jestem zainteresowany”"],
      ["Co mówisz sobie przed telefonem", "Seria 3 rozmów jedna po drugiej"],
      ["Spokój, gdy klient naciska", "Zdenerwowany klient"],
      ["Albo wygrywasz, albo się uczysz", "Rozmowa, która nie kończy się sprzedażą, i jej ocena"],
    ],
  },
  {
    tygodnie: [
      ["Ciekawość zamiast przekonywania", "Rozmowa o potrzebach klienta"],
      ["„Za drogo” bez strachu", "Klient porównuje Cię z tańszą konkurencją"],
      ["„Muszę się zastanowić” bez paniki", "Dowiadujesz się, nad czym klient się zastanawia"],
      ["Odwaga, żeby poprosić o decyzję", "Prosisz o decyzję i umawiasz następny krok"],
    ],
  },
];

// 15.11 (USER_001): pierwsza sekcja = ile mogą zarobić najlepsi handlowcy, a ile reszta. Tylko B2B / zlecenie (bez umowy o pracę).
// Źródło: RocketJobs.pl, listopad 2026, strony wklejone przez USER_001: 85 ofert dla handlowców (bez kierowników, stawek godzinowych,
// niepełnego etatu; powtórki tej samej firmy, stanowiska i widełek liczone raz). Kwota = górna granica widełek, netto + VAT / mies.
// Percentyle: mediana 14 000, top 20 % od 20 000, top 10 % od 25 000, top 5 % od 30 000, max 45 000.
// 15.11 (USER_001): jeden pasek (skala 0-32 000 zł) z 4 znacznikami; podpisy na zmianę nad i pod paskiem, żeby nie nachodziły na telefonie.
const SKALA = 32000;
const ZAROBKI = [
  { kto: "Połowa handlowców", krotko: "Połowa", kwota: 14000, od: false, gora: false, kolor: "#b9bcc3" },
  { kto: "Top 20% handlowców", krotko: "Top 20%", kwota: 20000, od: true, gora: true, kolor: "#f7c597" },
  { kto: "Top 10% handlowców", krotko: "Top 10%", kwota: 25000, od: true, gora: false, kolor: "#f4a865" },
  { kto: "Top 5% handlowców", krotko: "Top 5%", kwota: 30000, od: true, gora: true, kolor: "var(--orange)" },
];
// Spacja (twarda) co 3 cyfry także przy 4 cyfrach: „8 100 zł” obok „14 733 zł” (pl-PL zostawia „8100”).
const zl = (n: number) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} zł`;

const W_CENIE = [
  "Lekcja psychologii sprzedaży co sobotę",
  "Trening rozmowy z Bruno AI co poniedziałek",
  "Ocena każdej rozmowy i wskazówki, co poprawić",
  "Twoja ścieżka od dnia dołączenia",
  "Rezygnacja w każdej chwili",
];

const PYTANIA: [string, string][] = [
  ["Dla kogo jest Akademia?", "Dla handlowców, którzy znają techniki, ale w rozmowie blokuje ich stres, odmowa albo cena. I dla osób, które zaczynają w sprzedaży."],
  ["Kiedy dostanę pierwszą lekcję?", "W pierwszą sobotę po dołączeniu. Pierwszy trening z Bruno w poniedziałek po niej. Każdy idzie swoim tempem od dnia dołączenia."],
  ["Czym jest Bruno?", "To AI, które gra klienta w rozmowie głosowej. Mówisz do niego jak do prawdziwego klienta, a po rozmowie dostajesz ocenę."],
  ["Ile czasu to zajmuje?", "Około 10 minut w sobotę na lekcję i kilka minut w poniedziałek na trening."],
  ["Jak zrezygnować?", "W każdej chwili. Opłacony miesiąc trwa do końca, kolejny nie zostanie pobrany."],
];

// 15.11 (USER_001): opis przy każdym pasku koła. Kreska od środka paska do karty: obraz siebie w prawo,
// to, co myślisz w dół, techniki w lewo (karty w siatce .scena). Procent stoi też na samym pasku (telefon).
const KRESKA: Record<Klucz, (x: number, y: number) => [number, number]> = {
  obraz: (_, y) => [334, y],
  mysli: (x) => [x, 334],
  techniki: (_, y) => [-34, y],
};

// Koło jako pierścień: każdy segment to ten sam okrąg z przesuniętym kreskowaniem.
// 15.11 (USER_001: „polepsz wizualnie”): gradient na każdym pasku, zaokrąglone końce z przerwą,
// biały środek z cieniem, paski rysują się po kolei (CSS, pauza dopóki koło jest poza ekranem; „ogranicz ruch” = bez animacji).
const GRADIENTY: Record<Klucz, [string, string]> = {
  obraz: ["#ffb36b", "#e2541b"],
  mysli: ["#45454b", "#08080a"],
  techniki: ["#e6e8ec", "#aeb2ba"],
};

function Kolo() {
  const r = 108;
  const gr = 38;
  const obw = 2 * Math.PI * r;
  const przerwa = 6;
  let start = 0;
  return (
    <svg className={a.kolo} viewBox="0 0 300 300" role="img" aria-label="Sprzedaż: 40 % obraz siebie, 30 % to, w jaki sposób myślisz, 30 % techniki sprzedaży">
      <defs>
        {KOLO.map((s) => (
          <linearGradient key={s.klucz} id={`kolo-${s.klucz}`} x1="40" y1="20" x2="260" y2="280" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={GRADIENTY[s.klucz][0]} />
            <stop offset="1" stopColor={GRADIENTY[s.klucz][1]} />
          </linearGradient>
        ))}
        <filter id="kolo-cien" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#08080a" floodOpacity="0.14" />
        </filter>
      </defs>
      <g filter="url(#kolo-cien)">
        {KOLO.map((s, i) => {
          const dl = (s.proc / 100) * obw;
          // Okrągłe końce wystają o pół grubości, więc kreska jest krótsza o grubość + przerwę.
          const rysowane = dl - przerwa - gr;
          const el = (
            <circle
              key={s.klucz}
              className={a.koloPasek}
              cx="150"
              cy="150"
              r={r}
              fill="none"
              stroke={`url(#kolo-${s.klucz})`}
              strokeWidth={gr}
              strokeLinecap="round"
              strokeDasharray={`${rysowane} ${obw}`}
              strokeDashoffset={-(start + przerwa / 2 + gr / 2)}
              transform="rotate(-90 150 150)"
              style={{ "--obw": obw, animationDelay: `${i * 220}ms` } as React.CSSProperties}
            />
          );
          start += dl;
          return el;
        })}
      </g>
      <circle cx="150" cy="150" r={r - gr / 2 - 10} fill="#fff" filter="url(#kolo-cien)" />
      {(() => {
        let st = 0;
        return KOLO.map((s) => {
          const dl = (s.proc / 100) * obw;
          // Środek paska: kąt liczony od góry zgodnie z ruchem wskazówek.
          const kat = ((st + dl / 2) / obw) * 2 * Math.PI;
          st += dl;
          const pkt = (rr: number) => [150 + rr * Math.sin(kat), 150 - rr * Math.cos(kat)] as const;
          const [tx, ty] = pkt(r);
          const [kx, ky] = pkt(r + gr / 2 + 6);
          const [ex, ey] = KRESKA[s.klucz](kx, ky);
          return (
            <g key={s.klucz} className={a.koloOpis}>
              <polyline className={a.kreska} points={`${kx},${ky} ${ex},${ey}`} style={{ stroke: GRADIENTY[s.klucz][1] }} />
              <circle className={a.kreskaKropka} cx={kx} cy={ky} r="3.5" style={{ stroke: GRADIENTY[s.klucz][1] }} />
              <text x={tx} y={ty + 5} textAnchor="middle" className={a.koloProc} style={{ fill: s.klucz === "techniki" ? "var(--ink)" : "#fff" }}>
                {s.proc}%
              </text>
            </g>
          );
        });
      })()}
      <text x="150" y="148" textAnchor="middle" className={a.koloSrodek}>
        Sprzedaż
      </text>
      <text x="150" y="170" textAnchor="middle" className={a.koloPod}>
        zaczyna się w głowie
      </text>
    </svg>
  );
}

// Nagłówek karty miesiąca: sam numer miesiąca (wszystkie miesiące = psychologia sprzedaży).
function MiesiacGlowa({ nr }: { nr: number }) {
  return (
    <div className={a.miesiacGlowa}>
      <span className={a.dzien}>Psychologia sprzedaży</span>
      <h3 className={a.miesiacTytul}>Miesiąc {nr}</h3>
    </div>
  );
}

function Ptaszek() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10" cy="10" r="8.5" strokeWidth="1.4" />
      <path d="M6.5 10.2l2.4 2.4 4.6-4.8" />
    </svg>
  );
}

export default function Page() {
  const cta = { href: PLATNOSC, tekst: "Dołącz do Academy" };
  return (
    <div className={d.v} lang="pl">
      <BazaPasek cta={cta} />
      <main className={a.glowna}>
        <section className={a.zarobki}>
          <div className={a.poswiata} aria-hidden="true" />
          <div className={d.szer}>
            <h1 className={a.zarobkiH1}>
              <span>
                Najlepsi handlowcy zarabiają od <em className={a.kwotaWyrozniona}>{zl(30000)}</em> miesięcznie.
              </span>
              <span className={a.szary}>Połowa: do {zl(14000)}.</span>
            </h1>
            <p className={a.podH1}>Na podstawie danych z ofert o pracę</p>
            <div className={a.skalaKarta}>
            <div className={a.skala}>
              {/* Pasek z odcinków: od 0 do pierwszego progu szary, dalej coraz mocniejszy pomarańcz. */}
              <div className={a.skalaTor}>
                {ZAROBKI.map((z, i) => {
                  const od = i ? ZAROBKI[i - 1].kwota : 0;
                  const doK = i === ZAROBKI.length - 1 ? SKALA : z.kwota;
                  return <i key={z.kto} style={{ left: `${(od / SKALA) * 100}%`, width: `${((doK - od) / SKALA) * 100}%`, background: z.kolor }} />;
                })}
              </div>
              {ZAROBKI.map((z) => {
                const x = (z.kwota / SKALA) * 100;
                return (
                  <div key={z.kto} className={`${a.znacznik} ${z.gora ? a.znacznikGora : a.znacznikDol} ${x > 88 ? a.znacznikPrawy : ""}`} style={{ left: `${x}%` }}>
                    {/* Na telefonie krótsze podpisy (bez „ponad / do” i „handlowców”), inaczej nachodzą na siebie. */}
                    <b>
                      <em className={a.dlugi}>{z.od ? "ponad " : "do "}</em>
                      {zl(z.kwota)}
                    </b>
                    <span>
                      <em className={a.dlugi}>{z.kto}</em>
                      <em className={a.krotki}>{z.krotko}</em>
                    </span>
                  </div>
                );
              })}
            </div>
            <p className={a.zrodlo}>Górna granica widełek w 85 ofertach pracy dla handlowców na B2B i umowie zlecenie, netto + VAT miesięcznie. Źródło: RocketJobs.pl, listopad 2026.</p>
            </div>
            <p className={a.zarobkiDalej} data-pojaw>Ta sama praca, 2 razy więcej pieniędzy. Różnica nie bierze się z technik.</p>
          </div>
          {/* 15.11 (USER_001): paski i koło = jedna sekcja, koło zaraz pod paskami. */}
          <div className={`${d.szer} ${a.heroSiatka} ${a.koloSekcja}`} data-pojaw>
            <div className={a.scena}>
              <div className={a.scenaKolo}>
                <Kolo />
              </div>
              {KOLO.map((s) => (
                <div key={s.klucz} className={`${a.opis} ${a[`opis_${s.klucz}`]}`}>
                  <b style={{ color: s.klucz === "techniki" ? "var(--grey)" : s.kolor }}>{s.proc}%</b>
                  <h3>{s.nazwa}</h3>
                </div>
              ))}
            </div>
            <div className={a.heroTekst}>
              <span className={d.mono}>Skąd ta różnica</span>
              <h2 className={a.h1}>Techniki to tylko 30% sprzedaży.</h2>
              <p className={a.lead}>Reszta dzieje się w Twojej głowie.</p>
              <div className={a.przyciski}>
                <a className={d.cta} href={PLATNOSC}>
                  Dołącz do Academy
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className={`${d.sekcja} ${d.srodek}`} id="tydzien">
          <div className={d.szer}>
            <span className={d.mono}>Twój tydzień</span>
            <h2 className={`${d.h2} ${a.h2}`}>
              <span>Sobota uczysz się.</span>
              <span>Poniedziałek ćwiczysz.</span>
            </h2>
            <p className={`${d.podH2} ${a.dwieLinie}`}>
              <span>Lekcje odblokowują się od dnia, w którym dołączysz.</span>
              <span>Każdy ma swoją ścieżkę.</span>
            </p>
            <ol className={a.dni} data-pojaw>
              <li>
                <span className={a.dzien}>Sobota</span>
                <div className={a.ikonaLekcji} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5z" />
                    <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5z" />
                  </svg>
                </div>
                <h3>Lekcja</h3>
                <p>Krótki tekst o jednej rzeczy w Twojej głowie: stres przed telefonem, odmowa, cena, pewność siebie. Około 10 minut.</p>
              </li>
              <li className={a.ciemna}>
                <span className={a.dzien}>Poniedziałek</span>
                {/* 15.11 (USER_001): kula Bruno (ta sama co w czacie panelu) zamiast fali głosu. */}
                <div className={a.kula} aria-hidden="true">
                  <KulaLimonka tempo="mowi" />
                </div>
                <h3>Trening z Bruno</h3>
                <p>Rozmowa głosowa z AI, które gra klienta. Ćwiczysz to, czego uczyła sobotnia lekcja. Po rozmowie ocena i wskazówki.</p>
              </li>
            </ol>
          </div>
        </section>

        <section className={`${d.sekcja} ${d.srodek}`} style={{ paddingTop: 0 }}>
          <div className={d.szer}>
            <span className={d.mono}>Program</span>
            <h2 className={`${d.h2} ${a.h2}`}>3 miesiące szkolenia mentalnego</h2>
            <ol className={a.miesiace} data-pojaw>
              {MIESIACE.map((m, mi) => (
                <li key={mi} className={a.miesiac}>
                  <MiesiacGlowa nr={mi + 1} />
                  <ol className={a.miesiacTygodnie}>
                    {m.tygodnie.map(([lekcja, trening], ti) => (
                      <li key={lekcja}>
                        <span className={d.numer}>{mi * 4 + ti + 1}</span>
                        <div>
                          <h3>{lekcja}</h3>
                          <p>
                            <b>Trening z Bruno:</b> {trening}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={d.sekcja} style={{ paddingTop: 0 }} id="cena">
          <div className={`${d.szer} ${a.cenaSiatka}`} data-pojaw>
            <div className={a.cenaTekst}>
              <span className={d.mono}>Cena</span>
              <h2 className={`${d.h2} ${a.h2}`}>Mniej niż jedna książka o sprzedaży.</h2>
              <p className={d.podH2}>Co tydzień lekcja i trening z Bruno. Rezygnujesz, kiedy chcesz.</p>
            </div>
            <div className={a.cena}>
              <span className={d.mono}>Subskrypcja</span>
              <div className={a.kwota}>
                <b>{CENA} zł</b>
                <span>/ mies. (30 dni)</span>
              </div>
              <ul className={a.cenaLista}>
                {W_CENIE.map((w) => (
                  <li key={w}>
                    <Ptaszek />
                    {w}
                  </li>
                ))}
              </ul>
              <a className={`${d.cta} ${a.cenaCta}`} href={PLATNOSC}>
                Dołącz do Academy
              </a>
              <p className={a.drobne}>Cena brutto. Płatność kartą co 30 dni.</p>
            </div>
          </div>
        </section>

        <section className={d.sekcja} style={{ paddingTop: 0 }}>
          <div className={`${d.szer} ${a.pytania}`} data-pojaw>
            <span className={d.mono}>Pytania</span>
            <div className={d.faq}>
              {PYTANIA.map(([q, o]) => (
                <details key={q}>
                  <summary>{q}</summary>
                  <p>{o}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className={d.stopka}>
        <div className={d.szer}>
          <div className={d.stopkaGora}>
            <div>
              <p>
                <span>Sobota uczysz się.</span>
                <span>Poniedziałek ćwiczysz.</span>
              </p>
              <a className={d.cta} href={PLATNOSC}>
                Dołącz do Academy
              </a>
            </div>
            <nav className={d.stopkaLinki} aria-label="Stopka">
              <a href="/praca">Profil handlowca</a>
              <a href="/praca/regulamin">Regulamin</a>
              <a href="/praca/polityka-prywatnosci">Polityka prywatności</a>
            </nav>
          </div>
          <div className={d.stopkaDol}>
            <span className={d.mono}>SalesBruno.pl · Akademia</span>
            <span className={d.mono}>© 2026</span>
          </div>
        </div>
      </footer>
      <Pojawianie />
      <PasekDolny cena={CENA} href={PLATNOSC} />
    </div>
  );
}
