import type { Metadata } from "next";
import { headers } from "next/headers";
import { DOMENA, SCIEZKI, jezykZHosta, type Jezyk } from "@/lib/bruno/domeny";

// 12.10 (USER_001, E11): strona „Security & Data” dla firm (B2B). Dział prawny / IT klienta ma w jednym
// miejscu: podwykonawcy z krajem i celem, gdzie leżą dane, retencja, uczenie modeli = NIE, dostęp,
// szyfrowanie, zgoda na nagrywanie, prawa z RODO, DPA (art. 28) do podpisu na życzenie.
// Adres: salesbruno.com/security (EN, rewrite w proxy), salesbruno.pl/bezpieczenstwo (PL).
// Układ jak /regulamin i /polityka-prywatnosci (biały, max-w-2xl), treść w tabelkach. Indeksowana.
// Fakty z polityki prywatności, regulaminu i PLAN.md (SalesAI). Pozycje „to be confirmed” = brak
// twardego źródła w kodzie / PLAN; nie zgadujemy.

const AKTUALIZACJA: Record<Jezyk, string> = { pl: "12 października 2026", en: "October 12, 2026" };
const MAIL = "hello@jakubchodakowski.com";

type Szukaj = Promise<Record<string, string | string[] | undefined>>;

/** Język: nagłówek z proxy, potem domena, potem ?pl. Domyślnie EN (strona dla firm, rynek UK / IE / USA). */
async function jezykStrony(searchParams?: Szukaj): Promise<Jezyk> {
  const h = await headers();
  const x = h.get("x-jezyk");
  if (x === "pl" || x === "en") return x;
  const zHosta = jezykZHosta(h.get("host"));
  if (zHosta) return zHosta;
  const q = (await searchParams) ?? {};
  return q.pl !== undefined || q.lang === "pl" ? "pl" : "en";
}

export async function generateMetadata({ searchParams }: { searchParams: Szukaj }): Promise<Metadata> {
  const j = await jezykStrony(searchParams);
  const sciezka = SCIEZKI[j].bezpieczenstwo;
  const tytul = j === "en" ? "Security & Data | Bruno AI" : "Bezpieczeństwo i dane | Bruno AI";
  const opis =
    j === "en"
      ? "Data protection"
      : "Ochrona danych";
  return {
    metadataBase: new URL(DOMENA[j]),
    title: tytul,
    description: opis,
    alternates: {
      canonical: sciezka,
      languages: {
        en: `${DOMENA.en}${SCIEZKI.en.bezpieczenstwo}`,
        pl: `${DOMENA.pl}${SCIEZKI.pl.bezpieczenstwo}`,
        "x-default": `${DOMENA.en}${SCIEZKI.en.bezpieczenstwo}`,
      },
    },
    openGraph: { title: tytul, description: opis, url: sciezka, siteName: "Bruno AI", locale: j === "pl" ? "pl_PL" : "en_US", type: "website", images: [{ url: "/bruno/og-bruno-2.png", width: 1200, height: 630, alt: "Bruno AI" }] },
    robots: { index: true, follow: true },
  };
}

type Wiersz = string[];
type Sekcja = { tytul: string; wstep?: React.ReactNode; naglowki?: string[]; wiersze?: Wiersz[]; punkty?: React.ReactNode[]; po?: React.ReactNode[] };
type Tresc = { naglowek: string; pod: string; aktualizacja: string; sekcje: Sekcja[]; dpa: { tytul: string; tekst: string; przycisk: string; temat: string; tresc: string } };

const link = (href: string, tekst: string) => (
  <a className="text-cyan-700 underline underline-offset-2" href={href}>
    {tekst}
  </a>
);

const TRESC: Record<Jezyk, Tresc> = {
  en: {
    naglowek: "Security & Data",
    pod: "For companies that want to know what happens with their team's data in Bruno AI. Short version, in tables.",
    aktualizacja: "Last updated",
    sekcje: [
      {
        tytul: "1. Who we are and what we do with your data",
        naglowki: ["Question", "Answer"],
        wiersze: [
          ["Service provider", "Jakub Chodakowski, sole proprietor registered in Poland (EU), tax ID (NIP) 6711845485"],
          ["Role under GDPR for team accounts", "Processor. Your company is the controller of its sales reps' data."],
          ["Role for individual accounts", "Controller"],
          ["What the data is used for", "Running the practice call, scoring it, showing progress, solving support tickets. Nothing else."],
          ["Do we sell data or share it for ads", "No"],
          ["Contact for data matters", MAIL],
        ],
      },
      {
        tytul: "2. Sub-processors: who processes what",
        wstep: <>Every provider runs on our business account. Each one gets only the data it needs for its job.</>,
        naglowki: ["Provider", "Country", "What it does", "What data it gets"],
        wiersze: [
          ["ElevenLabs (Eleven Labs Poland sp. z o.o. for EEA users)", "Poland / USA (processing in USA, EU or Singapore)", "Bruno's voice, speech recognition, running the live call", "Audio of the call, transcript"],
          ["Anthropic PBC", "USA", "Scoring the call and the drill cards (the coach)", "Transcript, call settings, drill answers"],
          ["OpenAI, L.L.C.", "USA", "Backup voice provider when ElevenLabs is down, transcription", "Audio of the call, transcript"],
          ["Supabase Inc.", "USA (data region: us-east-1, N. Virginia)", "Database and private storage for recordings", "Account data, transcripts, scores, audio files"],
          ["Vercel Inc.", "USA", "Hosting of the website and the app", "Request logs, data passing through the app"],
          ["Resend Inc.", "USA", "Sending emails (login, reminders, reports)", "Email address, first name, email content"],
          ["Stripe, Inc.", "USA", "Payments", "Payment data. We never see card numbers."],
          ["Google LLC", "USA", "Sign in with Google, our mailbox", "First name and email address from your Google account; emails you send us"],
        ],
        po: [
          <>
            Transfers to the USA rely on the EU-US Data Privacy Framework or Standard Contractual Clauses. We give 14 days' notice before adding or changing a
            sub-processor. Your company may object and terminate the contract.
          </>,
        ],
      },
      {
        tytul: "3. Where the data is stored",
        naglowki: ["Data", "Where"],
        wiersze: [
          ["Accounts, transcripts, scores, stats", "Supabase database on our account (region: us-east-1, USA)"],
          ["Audio recordings", "Private Supabase storage bucket, no public links"],
          ["Copy of the call at the voice provider", "ElevenLabs, deleted after 1 day"],
          ["Copy at the AI coach", "Anthropic, deleted within 30 days"],
          ["Copy at the backup voice provider", "OpenAI, security logs deleted within 30 days"],
          ["Card data", "Stripe only"],
        ],
      },
      {
        tytul: "4. How long we keep it (retention)",
        naglowki: ["Data", "How long"],
        wiersze: [
          ["Account", "As long as the account is in use"],
          ["Recordings and transcripts of practice calls", "12 months from the call. When a company contract ends: 30 days after the end."],
          ["Scores and stats without audio", "As long as the service is in use (to show progress)"],
          ["Copy at ElevenLabs", "1 day"],
          ["Copies at Anthropic and OpenAI", "Up to 30 days"],
          ["Contact form data", "Up to 12 months from the last contact"],
          ["Test account with no contract", "Deleted within 3 months after access ends"],
          ["After a company contract ends", "All data deleted or returned to the company within 30 days, your choice"],
        ],
        po: [<>One email to {MAIL} deletes a single recording or all recordings of an account earlier.</>],
      },
      {
        tytul: "5. Model training: no",
        naglowki: ["Provider", "Trains on your data?", "Why"],
        wiersze: [
          ["Bruno AI (us)", "No", "Recordings are used only to score the call and show progress. Training would need your company's separate written consent."],
          ["ElevenLabs", "No", "Training on our data was switched off in the account settings on October 3, 2026."],
          ["Anthropic", "No", "Anthropic's commercial terms: no training on customer content sent through the API."],
          ["OpenAI", "No", "OpenAI API: data sent through the API is not used for training by default."],
        ],
      },
      {
        tytul: "6. Who can see the data",
        naglowki: ["Who", "What they see"],
        wiersze: [
          ["The sales rep", "Own calls, recordings, scores and drill cards"],
          ["The team lead named by the company (full access plan)", "Calls and scores of the team"],
          ["The service provider (Jakub Chodakowski)", "All data, only to run the service and solve tickets"],
          ["Sub-processors", "Only what is listed in section 2"],
          ["Anyone else", "Nobody, unless the law requires it"],
        ],
      },
      {
        tytul: "7. Encryption and security",
        naglowki: ["Area", "Measure"],
        wiersze: [
          ["Connection", "HTTPS everywhere. Voice calls over WebRTC or WebSocket on TLS."],
          ["Passwords", "Stored only as a scrypt hash with a random salt. Never in plain text."],
          ["Google sign-in", "We get only first name and email. Never your Google password."],
          ["Sessions", "Signed token in an httpOnly cookie, 30 days or until logout"],
          ["Login protection", "5 failed attempts lock the login for 15 minutes"],
          ["Recordings", "Private storage, no public links"],
          ["Data separation", "Every query is filtered by account. One account never sees another's data."],
          ["Limits", "Minute and call limits checked on the server, not in the browser"],
          ["Payments", "Card data goes to Stripe only"],
          ["Breach notification", "To your company within 48 hours of discovery. To the authority and the people affected within the GDPR deadlines (Art. 33-34)."],
        ],
      },
      {
        tytul: "8. Consent to recording",
        punkty: [
          <>Every practice call is recorded from start to end. The user agrees to this when accepting the {link("/regulamin", "Terms of Service")} (section 7).</>,
          <>Practice calls are fictional. Users must not say real customers' names or sensitive data (Terms, section 8).</>,
          <>We do not build a voice profile and do not use the voice to identify anyone.</>,
          <>If a user uploads a recording of a real call, they confirm they have consent from everyone heard on it.</>,
        ],
      },
      {
        tytul: "9. Your rights (GDPR)",
        naglowki: ["Right", "How"],
        wiersze: [
          ["Access and a copy of the data", `Email ${MAIL}`],
          ["Correction", `Email ${MAIL}`],
          ["Deletion (one recording, all recordings or the whole account)", `Email ${MAIL}`],
          ["Export (data portability)", `Email ${MAIL}. You get recordings, transcripts and scores.`],
          ["Restriction and objection", `Email ${MAIL}`],
          ["Complaint", "President of the Personal Data Protection Office (UODO), ul. Stawki 2, 00-193 Warsaw, Poland"],
          ["Response time", "Within 30 days"],
        ],
        po: [<>For team accounts, send the request through your company (the controller). We help the company answer it.</>],
      },
    ],
    dpa: {
      tytul: "10. Data Processing Agreement (Art. 28 GDPR)",
      tekst:
        "A standard DPA is already part of our Terms of Service (section 12): subject, duration, data types, our duties, sub-processors, deletion after the contract, audit once a year. If your legal team needs a separate, signed DPA, on your template or ours, ask for it. We sign before the first team account goes live.",
      przycisk: "Request a signed DPA",
      temat: "Bruno AI: signed DPA request",
      tresc: "Hi Jakub,\n\nWe would like to sign a Data Processing Agreement for Bruno AI.\n\nCompany:\nCountry:\nNumber of sales reps:\nOur template or yours:\n\nThanks,\n",
    },
  },

  pl: {
    naglowek: "Bezpieczeństwo i dane",
    pod: "Dla firm, które chcą wiedzieć, co dzieje się z danymi ich zespołu w Bruno AI. Krótko, w tabelkach.",
    aktualizacja: "Ostatnia aktualizacja",
    sekcje: [
      {
        tytul: "1. Kim jesteśmy i co robimy z danymi",
        naglowki: ["Pytanie", "Odpowiedź"],
        wiersze: [
          ["Usługodawca", "Jakub Chodakowski, jednoosobowa działalność gospodarcza w Polsce (UE), NIP 6711845485"],
          ["Rola wg RODO przy kontach zespołu", "Podmiot przetwarzający. Administratorem danych handlowców jest Twoja firma."],
          ["Rola przy kontach indywidualnych", "Administrator"],
          ["Do czego używamy danych", "Prowadzenie rozmowy treningowej, ocena, pokazanie postępu, rozwiązanie zgłoszeń. Nic więcej."],
          ["Czy sprzedajemy dane albo dajemy je reklamodawcom", "Nie"],
          ["Kontakt w sprawie danych", MAIL],
        ],
      },
      {
        tytul: "2. Podwykonawcy: kto przetwarza co",
        wstep: <>Każdy dostawca działa na naszym koncie firmowym. Każdy dostaje tylko te dane, których potrzebuje do swojego zadania.</>,
        naglowki: ["Dostawca", "Kraj", "Co robi", "Jakie dane dostaje"],
        wiersze: [
          ["ElevenLabs (dla EOG: Eleven Labs Poland sp. z o.o.)", "Polska / USA (przetwarzanie w USA, UE lub Singapurze)", "Głos Bruno, rozpoznawanie mowy, prowadzenie rozmowy", "Dźwięk rozmowy, transkrypcja"],
          ["Anthropic PBC", "USA", "Ocena rozmowy i fiszek (trener)", "Transkrypcja, ustawienia rozmowy, odpowiedzi na fiszki"],
          ["OpenAI, L.L.C.", "USA", "Zapasowy dostawca głosu, gdy ElevenLabs nie działa, transkrypcja", "Dźwięk rozmowy, transkrypcja"],
          ["Supabase Inc.", "USA (region danych: us-east-1, Wirginia Płn.)", "Baza danych i prywatny magazyn nagrań", "Dane konta, transkrypcje, oceny, pliki audio"],
          ["Vercel Inc.", "USA", "Hosting strony i aplikacji", "Logi żądań, dane przechodzące przez aplikację"],
          ["Resend Inc.", "USA", "Wysyłka maili (logowanie, przypomnienia, raporty)", "Adres e-mail, imię, treść maila"],
          ["Stripe, Inc.", "USA", "Płatności", "Dane płatności. Numerów kart nie widzimy."],
          ["Google LLC", "USA", "Logowanie przez Google, nasza skrzynka", "Imię i adres e-mail z konta Google; maile, które do nas piszesz"],
        ],
        po: [
          <>
            Przekazanie danych do USA opiera się na decyzji o Data Privacy Framework albo standardowych klauzulach umownych. O dodaniu lub zmianie
            podwykonawcy informujemy z 14-dniowym wyprzedzeniem. Firma może zgłosić sprzeciw i wypowiedzieć umowę.
          </>,
        ],
      },
      {
        tytul: "3. Gdzie leżą dane",
        naglowki: ["Dane", "Gdzie"],
        wiersze: [
          ["Konta, transkrypcje, oceny, statystyki", "Baza Supabase na naszym koncie (region: us-east-1, USA)"],
          ["Nagrania dźwiękowe", "Prywatny kubełek Supabase, bez publicznych odnośników"],
          ["Kopia rozmowy u dostawcy głosu", "ElevenLabs, kasowana po 1 dniu"],
          ["Kopia u trenera AI", "Anthropic, kasowana w ciągu 30 dni"],
          ["Kopia u zapasowego dostawcy głosu", "OpenAI, logi bezpieczeństwa kasowane w ciągu 30 dni"],
          ["Dane karty", "Tylko Stripe"],
        ],
      },
      {
        tytul: "4. Jak długo trzymamy dane (retencja)",
        naglowki: ["Dane", "Jak długo"],
        wiersze: [
          ["Konto", "Przez czas korzystania"],
          ["Nagrania i transkrypcje rozmów treningowych", "12 miesięcy od rozmowy. Po zakończeniu umowy z firmą: 30 dni od zakończenia."],
          ["Oceny i statystyki bez nagrania", "Przez czas korzystania (żeby pokazywać postęp)"],
          ["Kopia u ElevenLabs", "1 dzień"],
          ["Kopie u Anthropic i OpenAI", "Do 30 dni"],
          ["Dane z formularza kontaktowego", "Do 12 miesięcy od ostatniego kontaktu"],
          ["Konto testowe bez umowy", "Kasowane w ciągu 3 miesięcy od wygaśnięcia dostępu"],
          ["Po zakończeniu umowy z firmą", "Wszystkie dane usunięte albo zwrócone firmie w ciągu 30 dni, do wyboru"],
        ],
        po: [<>Jeden mail na {MAIL} kasuje wcześniej jedno nagranie albo wszystkie nagrania konta.</>],
      },
      {
        tytul: "5. Uczenie modeli: nie",
        naglowki: ["Dostawca", "Uczy się na Waszych danych?", "Dlaczego"],
        wiersze: [
          ["Bruno AI (my)", "Nie", "Nagrania służą tylko do oceny rozmowy i pokazania postępu. Uczenie wymagałoby osobnej pisemnej zgody firmy."],
          ["ElevenLabs", "Nie", "Uczenie na naszych danych wyłączone w ustawieniach konta 3 października 2026."],
          ["Anthropic", "Nie", "Warunki handlowe Anthropic: brak uczenia na treściach klientów przesyłanych przez API."],
          ["OpenAI", "Nie", "API OpenAI: dane przesyłane przez API domyślnie nie służą do uczenia."],
        ],
      },
      {
        tytul: "6. Kto ma dostęp do danych",
        naglowki: ["Kto", "Co widzi"],
        wiersze: [
          ["Handlowiec", "Własne rozmowy, nagrania, oceny i fiszki"],
          ["Szef zespołu wskazany przez firmę (pełen dostęp)", "Rozmowy i oceny zespołu"],
          ["Usługodawca (Jakub Chodakowski)", "Wszystkie dane, tylko do prowadzenia usługi i rozwiązywania zgłoszeń"],
          ["Podwykonawcy", "Tylko to, co w punkcie 2"],
          ["Ktokolwiek inny", "Nikt, chyba że wymaga tego prawo"],
        ],
      },
      {
        tytul: "7. Szyfrowanie i bezpieczeństwo",
        naglowki: ["Obszar", "Środek"],
        wiersze: [
          ["Połączenie", "HTTPS wszędzie. Rozmowy głosowe przez WebRTC albo WebSocket po TLS."],
          ["Hasła", "Tylko skrót scrypt z losową solą. Nigdy jawny tekst."],
          ["Logowanie Google", "Dostajemy tylko imię i e-mail. Nigdy hasła do Google."],
          ["Sesja", "Podpisany token w ciasteczku httpOnly, 30 dni albo do wylogowania"],
          ["Ochrona logowania", "5 nieudanych prób blokuje logowanie na 15 minut"],
          ["Nagrania", "Prywatny magazyn, bez publicznych odnośników"],
          ["Rozdzielenie danych", "Każde zapytanie filtrowane po koncie. Jedno konto nie widzi danych drugiego."],
          ["Limity", "Limity minut i rozmów sprawdzane na serwerze, nie w przeglądarce"],
          ["Płatności", "Dane karty idą tylko do Stripe"],
          ["Zgłaszanie naruszeń", "Firmie w ciągu 48 godzin od stwierdzenia. Urzędowi i osobom w terminach z RODO (art. 33-34)."],
        ],
      },
      {
        tytul: "8. Zgoda na nagrywanie",
        punkty: [
          <>Każda rozmowa treningowa jest nagrywana od startu do końca. Użytkownik zgadza się na to, przyjmując {link("/regulamin", "regulamin")} (pkt 7).</>,
          <>Rozmowy treningowe są fikcyjne. Nie wolno podawać danych prawdziwych klientów ani danych wrażliwych (regulamin, pkt 8).</>,
          <>Nie tworzymy profilu głosowego i nie używamy głosu do identyfikacji.</>,
          <>Wgrywając nagranie prawdziwej rozmowy, użytkownik potwierdza, że ma zgodę wszystkich osób, które na nim słychać.</>,
        ],
      },
      {
        tytul: "9. Prawa użytkownika (RODO)",
        naglowki: ["Prawo", "Jak"],
        wiersze: [
          ["Dostęp i kopia danych", `Mail na ${MAIL}`],
          ["Sprostowanie", `Mail na ${MAIL}`],
          ["Usunięcie (jedno nagranie, wszystkie nagrania albo całe konto)", `Mail na ${MAIL}`],
          ["Eksport (przeniesienie danych)", `Mail na ${MAIL}. Dostajesz nagrania, transkrypcje i oceny.`],
          ["Ograniczenie i sprzeciw", `Mail na ${MAIL}`],
          ["Skarga", "Prezes Urzędu Ochrony Danych Osobowych, ul. Stawki 2, 00-193 Warszawa"],
          ["Czas odpowiedzi", "Do 30 dni"],
        ],
        po: [<>Przy kontach zespołu zgłoszenie idzie przez firmę (administratora). Pomagamy firmie na nie odpowiedzieć.</>],
      },
    ],
    dpa: {
      tytul: "10. Umowa powierzenia (art. 28 RODO)",
      tekst:
        "Standardowa umowa powierzenia jest już częścią regulaminu (pkt 12): przedmiot, czas, rodzaj danych, nasze obowiązki, podwykonawcy, usunięcie po umowie, audyt raz w roku. Jeśli Twój dział prawny potrzebuje osobnej, podpisanej umowy, na Waszym albo naszym wzorze, poproś o nią. Podpisujemy przed uruchomieniem pierwszego konta zespołu.",
      przycisk: "Poproś o podpisaną umowę powierzenia",
      temat: "Bruno AI: umowa powierzenia do podpisu",
      tresc: "Cześć Jakub,\n\nchcemy podpisać umowę powierzenia danych dla Bruno AI.\n\nFirma:\nKraj:\nLiczba handlowców:\nNasz wzór czy Wasz:\n\nDzięki,\n",
    },
  },
};

function Sekcja({ tytul, children }: { tytul: string; children: React.ReactNode }) {
  return (
    <section className="mb-9">
      <h2 className="text-lg sm:text-xl font-bold tracking-[-0.01em] mb-3">{tytul}</h2>
      <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}

function Tabela({ naglowki, wiersze }: { naglowki: string[]; wiersze: Wiersz[] }) {
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {naglowki.map((n) => (
              <th key={n} className="text-left font-semibold text-slate-900 border-b border-slate-300 px-2 py-2 align-bottom">
                {n}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {wiersze.map((w, i) => (
            <tr key={i} className="border-b border-slate-200 align-top">
              {w.map((k, j) => (
                <td key={j} className={`px-2 py-2 ${j === 0 ? "font-medium text-slate-900" : ""}`}>
                  {k}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function BezpieczenstwoPage({ searchParams }: { searchParams: Szukaj }) {
  const jezyk = await jezykStrony(searchParams);
  const tresc = TRESC[jezyk];
  const mailto = `mailto:${MAIL}?subject=${encodeURIComponent(tresc.dpa.temat)}&body=${encodeURIComponent(tresc.dpa.tresc)}`;
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <main className="max-w-2xl mx-auto px-6 py-14 sm:py-20">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.02em] mb-2">{tresc.naglowek}</h1>
        <p className="text-sm text-slate-500 mb-3">
          {tresc.aktualizacja}: {AKTUALIZACJA[jezyk]}
        </p>
        <p className="text-[15px] leading-relaxed text-slate-700 mb-10">{tresc.pod}</p>

        {tresc.sekcje.map((s) => (
          <Sekcja key={s.tytul} tytul={s.tytul}>
            {s.wstep && <p>{s.wstep}</p>}
            {s.naglowki && s.wiersze && <Tabela naglowki={s.naglowki} wiersze={s.wiersze} />}
            {s.punkty && (
              <ul className="list-disc pl-5 flex flex-col gap-1.5">
                {s.punkty.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            )}
            {s.po?.map((a, i) => (
              <p key={`p${i}`}>{a}</p>
            ))}
          </Sekcja>
        ))}

        <Sekcja tytul={tresc.dpa.tytul}>
          <p>{tresc.dpa.tekst}</p>
          <p>
            <a
              href={mailto}
              className="inline-block rounded-full bg-slate-900 text-white text-sm font-semibold px-5 py-2.5 hover:bg-slate-700 transition-colors"
            >
              {tresc.dpa.przycisk}
            </a>
          </p>
          <p className="text-sm text-slate-500">
            {jezyk === "en" ? "See also: " : "Zobacz też: "}
            {link("/regulamin", jezyk === "en" ? "Terms of Service" : "Regulamin")}
            {", "}
            {link("/polityka-prywatnosci", jezyk === "en" ? "Privacy Policy" : "Polityka prywatności")}
          </p>
        </Sekcja>
      </main>
    </div>
  );
}
