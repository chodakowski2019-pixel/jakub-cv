import type { Metadata } from "next";
import { headers } from "next/headers";
import { jezykZHosta, type Jezyk } from "@/lib/bruno/domeny";

// Regulamin Bruno AI (USER_001 2.10). Powstał, bo produkt urósł z dwóch formularzy
// do działającego panelu z kontami, rozmowami głosowymi i nagraniami, a jedynym
// dokumentem była polityka prywatności z 29.09.
//
// Zawiera też sekcję POWIERZENIA (art. 28 RODO): przy sprzedaży firmie to firma
// jest administratorem danych swoich handlowców, a my podmiotem przetwarzającym.
// Bez tej sekcji żaden dział prawny w firmie 15+ osób nie podpisze umowy.
//
// 12.10 (USER_001): pkt 4-5 po nowemu (hasło zamiast kodu, 3 bezpłatne rozmowy zamiast 7 dni)
// + wersja EN. Język z domeny: salesbruno.com = EN, salesbruno.pl i jakubchodakowski.com = PL.
// Dwie wersje jako dane (TRESC), jeden układ. Treść EN = tłumaczenie PL, bez zmian merytorycznych.

const AKTUALIZACJA: Record<Jezyk, string> = { pl: "12 października 2026", en: "October 12, 2026" };

async function jezykStrony(): Promise<Jezyk> {
  const h = await headers();
  const x = h.get("x-jezyk");
  if (x === "pl" || x === "en") return x;
  return jezykZHosta(h.get("host")) ?? "pl";
}

export async function generateMetadata(): Promise<Metadata> {
  const j = await jezykStrony();
  const canonical = j === "en" ? "https://salesbruno.com/regulamin" : "https://salesbruno.pl/regulamin";
  return j === "en"
    ? {
        title: "Terms of Service | Bruno AI",
        description: "Rules for using Bruno AI: account, free calls, Bruno Pro, call recordings, data processing agreement, complaints.",
        alternates: { canonical },
        robots: { index: false, follow: false },
      }
    : {
        title: "Regulamin Bruno AI | Jakub Chodakowski",
        description: "Zasady korzystania z Bruno AI: konto, bezpłatne rozmowy, Bruno Pro, nagrania rozmów, powierzenie przetwarzania danych, reklamacje.",
        alternates: { canonical },
        robots: { index: false, follow: false },
      };
}

const MAIL = (
  <a className="text-cyan-700 underline underline-offset-2" href="mailto:hello@jakubchodakowski.com">
    hello@jakubchodakowski.com
  </a>
);

type Sekcja = { tytul: string; akapity?: React.ReactNode[]; punkty?: React.ReactNode[]; po?: React.ReactNode[] };
type Tresc = { naglowek: string; aktualizacja: string; sekcje: Sekcja[] };

const TRESC: Record<Jezyk, Tresc> = {
  pl: {
    naglowek: "Regulamin Bruno AI",
    aktualizacja: "Ostatnia aktualizacja",
    sekcje: [
      {
        tytul: "1. Kto świadczy usługę",
        akapity: [
          <>
            Usługę świadczy Jakub Chodakowski, prowadzący jednoosobową działalność gospodarczą, NIP 6711845485 (dalej:
            „Usługodawca”). Kontakt: {MAIL}.
          </>,
        ],
      },
      {
        tytul: "2. Czym jest Bruno AI",
        akapity: [
          <>
            Bruno AI to narzędzie do treningu rozmów sprzedażowych. Użytkownik prowadzi rozmowę głosową ze sztuczną
            inteligencją, która gra klienta, a po rozmowie dostaje ocenę według stałej rubryki oraz zestaw fiszek do
            powtórek. Bruno nie jest człowiekiem i nie jest doradcą: jego wypowiedzi i oceny są generowane przez model
            językowy i mogą zawierać błędy.
          </>,
          <>
            Usługa jest narzędziem treningowym. <b>Usługodawca nie gwarantuje wzrostu sprzedaży</b> ani żadnego innego
            wyniku biznesowego. Ocena wystawiona przez Bruno nie jest oceną pracowniczą w rozumieniu prawa pracy i nie
            może być jedyną podstawą decyzji kadrowej.
          </>,
        ],
      },
      {
        tytul: "3. Dla kogo",
        akapity: [
          <>
            Z usługi korzystają firmy z zespołem sprzedaży (konta dla zespołu na podstawie zamówienia lub umowy) oraz
            handlowcy, którzy zakładają konto sami i kupują Bruno Pro dla siebie.
          </>,
          <>
            Jeżeli użytkownik jest konsumentem albo osobą fizyczną prowadzącą działalność gospodarczą, dla której umowa
            nie ma charakteru zawodowego, stosuje się do niego przepisy o ochronie konsumentów, w tym prawo odstąpienia
            od umowy w 14 dni (pkt 6).
          </>,
        ],
      },
      {
        tytul: "4. Konto i logowanie",
        punkty: [
          "Handlowiec zakłada konto sam na stronie rejestracji: adres e-mail i hasło (co najmniej 8 znaków) albo logowanie kontem Google. Konta dla zespołu firmy zakłada Usługodawca na wskazane adresy e-mail i wysyła do nich dostęp mailem.",
          "Jedno konto służy jednej osobie. Hasła nie wolno udostępniać innym osobom.",
          "W bazie przechowywany jest wyłącznie zaszyfrowany skrót hasła (scrypt), nie samo hasło. Przy logowaniu Google Usługodawca nie otrzymuje hasła do konta Google.",
          "Po 5 nieudanych próbach logowanie zostaje zablokowane na 15 minut.",
          "„Nie pamiętasz hasła?” wysyła na adres konta hasło tymczasowe, które należy zmienić w Ustawieniach. Z tej funkcji można skorzystać najwyżej raz na 2 minuty.",
          "Utratę kontroli nad kontem lub hasłem należy zgłosić natychmiast na hello@jakubchodakowski.com.",
        ],
      },
      {
        tytul: "5. Bezpłatne rozmowy",
        punkty: [
          "Każde nowe konto założone na stronie rejestracji dostaje 3 bezpłatne rozmowy z Bruno. Nie wymagają podania karty płatniczej.",
          "Za rozmowę wykorzystaną uznaje się rozmowę zakończoną albo trwającą co najmniej 60 sekund. Jedna rozmowa trwa najwyżej kilka minut (limit widoczny przed startem).",
          "W planie bezpłatnym dostępne są: rozmowy (3), ocena rozmowy, fiszki do powtórek i konfiguracja Bruno (w tym wczytanie oferty ze strony lub pliku PDF). Statystyki, kalendarz, „Ogień przed rozmową” i „Rozmowa, którą masz jutro” wymagają Bruno Pro.",
          "Po wykorzystaniu 3 rozmów konto pozostaje aktywne, ale dalsze rozmowy wymagają zakupu Bruno Pro. Dotychczasowe oceny i fiszki zostają.",
          "Dopóki użytkownik nie wykorzysta 3 rozmów, Usługodawca może wysyłać na adres konta jedno przypomnienie dziennie. Konto, na którym przez 30 dni nie odbyła się żadna rozmowa, może zostać wyłączone.",
          "Limity są sprawdzane po stronie serwera przed startem rozmowy. W planie bezpłatnym Usługodawca może wprowadzać zmiany w działaniu narzędzia bez wcześniejszego powiadomienia i nie gwarantuje dostępności ani czasu reakcji na zgłoszenia.",
        ],
      },
      {
        tytul: "6. Bruno Pro i pełen dostęp",
        punkty: [
          "Bruno Pro dla jednej osoby kupuje się płatnością jednorazową przez Stripe: 250 zł za 30 dni albo 2 500 zł za 365 dni (ceny brutto).",
          "Płatność nie odnawia się sama. Po upływie okresu konto wraca do planu bezpłatnego, a historia rozmów zostaje.",
          "Kolejna płatność przed końcem okresu przedłuża dostęp od dnia, w którym kończy się obecny okres.",
          "Bruno Pro obejmuje 5 rozmów każdego dnia oraz wszystkie funkcje panelu. Niewykorzystane rozmowy nie przechodzą na kolejny dzień.",
          "Konsument może odstąpić od umowy w 14 dni od zakupu. Kupując Bruno Pro, użytkownik prosi o rozpoczęcie usługi od razu; przy odstąpieniu zwrot jest pomniejszany proporcjonalnie o dni, w których dostęp był aktywny.",
        ],
        po: [
          <>
            Pełen dostęp dla firmy (konta dla zespołu, konfiguracja pod produkt klienta, raport dla szefa sprzedaży)
            jest płatny i uruchamiany na podstawie odrębnego zamówienia lub umowy, która określa zakres, cenę, okres
            rozliczeniowy i okres wypowiedzenia. W razie rozbieżności pierwszeństwo ma umowa, a ten regulamin stosuje
            się uzupełniająco.
          </>,
        ],
      },
      {
        tytul: "7. Co jest zapisywane podczas rozmowy",
        akapity: [<>Każda rozmowa treningowa jest nagrywana i zapisywana. Zapisujemy:</>],
        punkty: [
          "nagranie dźwiękowe rozmowy (głos użytkownika i głos Bruno),",
          "transkrypcję rozmowy,",
          "ocenę, komentarze trenera i metryki rozmowy (czas, liczba pytań, proporcje wypowiedzi),",
          "ustawienia wybrane przed rozmową: tryb, cel, obiekcje, typ klienta, poziom trudności,",
          "dane wpisane w „Dostosuj Bruno”: opis produktu, opis klienta, obiekcje, skrypt.",
        ],
        po: [
          <>
            Nagranie i transkrypcja służą do wystawienia oceny, pokazania postępu i rozwiązywania zgłoszeń
            technicznych. Szczegóły, w tym listę dostawców i okresy przechowywania, opisuje{" "}
            <a className="text-cyan-700 underline underline-offset-2" href="/polityka-prywatnosci">
              polityka prywatności
            </a>
            .
          </>,
        ],
      },
      {
        tytul: "8. Czego nie wolno",
        punkty: [
          "Podawać w rozmowie ani wpisywać w konfigurację danych osobowych osób trzecich, w szczególności imion, nazwisk, numerów telefonów i adresów prawdziwych klientów. Scenariusze mają być fikcyjne.",
          "Podawać danych szczególnych kategorii (zdrowie, poglądy, wyznanie, dane biometryczne) ani danych objętych tajemnicą zawodową.",
          "Wgrywać nagrań prawdziwych rozmów bez zgody wszystkich osób, które na nich słychać, i bez podstawy prawnej.",
          "Udostępniać, odsprzedawać ani współdzielić dostępu do konta. Zakładać wielu kont, żeby obejść limit bezpłatnych rozmów.",
          "Podejmować prób obejścia limitów, wyciągnięcia instrukcji systemowych, automatycznego generowania ruchu ani obciążania usługi.",
          "Używać narzędzia do celów niezgodnych z prawem, w tym do trenowania praktyk wprowadzających klientów w błąd.",
        ],
        po: [
          <>
            Naruszenie tych zasad uprawnia Usługodawcę do zablokowania konta ze skutkiem natychmiastowym, a w razie
            pełnego dostępu, do wypowiedzenia umowy po bezskutecznym wezwaniu do zaprzestania naruszeń.
          </>,
        ],
      },
      {
        tytul: "9. Dostępność i dostawcy zewnętrzni",
        akapity: [
          <>
            Usługa działa w oparciu o dostawców zewnętrznych: głos i rozmowa (ElevenLabs, zapasowo OpenAI), ocena
            rozmowy i fiszek (Anthropic), płatności (Stripe), baza danych i magazyn nagrań (Supabase), hosting (Vercel),
            poczta (Resend, Google). Awaria lub zmiana warunków po stronie dostawcy może czasowo ograniczyć działanie
            usługi. Usługodawca informuje o dłuższych przerwach mailem.
          </>,
          <>Do rozmów zalecana jest aktualna przeglądarka i słuchawki.</>,
        ],
      },
      {
        tytul: "10. Reklamacje",
        akapity: [
          <>
            Reklamacje przyjmujemy na {MAIL}. Reklamacja powinna zawierać adres e-mail konta, opis problemu i datę oraz
            godzinę rozmowy, której dotyczy. Odpowiadamy w ciągu 14 dni.
          </>,
        ],
      },
      {
        tytul: "11. Odpowiedzialność",
        punkty: [
          "Usługodawca odpowiada za szkodę rzeczywistą, z wyłączeniem utraconych korzyści.",
          "W relacjach z przedsiębiorcami odpowiedzialność jest ograniczona do wysokości opłat zapłaconych przez klienta w ciągu 3 miesięcy poprzedzających zdarzenie, a w planie bezpłatnym do 1 000 zł.",
          "Ograniczenia nie dotyczą szkody wyrządzonej umyślnie ani przypadków, w których wyłączenie odpowiedzialności jest niedopuszczalne z mocy prawa.",
          "Usługodawca nie odpowiada za decyzje biznesowe podjęte na podstawie ocen wystawionych przez Bruno.",
        ],
      },
      {
        tytul: "12. Powierzenie przetwarzania danych (art. 28 RODO)",
        akapity: [
          <>
            Gdy z usługi korzysta zespół firmy, to firma jest administratorem danych swoich handlowców, a Usługodawca
            przetwarza te dane na jej polecenie. Przyjęcie tego regulaminu jest równoznaczne z zawarciem umowy
            powierzenia o treści poniżej.
          </>,
        ],
        punkty: [
          <>
            <b>Przedmiot i cel:</b> świadczenie treningu rozmów sprzedażowych w Bruno AI.
          </>,
          <>
            <b>Czas:</b> na czas korzystania z usługi.
          </>,
          <>
            <b>Rodzaj danych:</b> imię, służbowy adres e-mail, nagrania głosu, transkrypcje rozmów treningowych, oceny i
            statystyki treningu.
          </>,
          <>
            <b>Kategorie osób:</b> pracownicy i współpracownicy klienta korzystający z kont.
          </>,
          <>
            <b>Obowiązki Usługodawcy:</b> przetwarzanie wyłącznie na udokumentowane polecenie klienta, zachowanie
            poufności, stosowanie środków bezpieczeństwa z pkt 13, pomoc w realizacji praw osób i w obowiązkach z art.
            32-36 RODO, zgłoszenie naruszenia ochrony danych bez zbędnej zwłoki, nie później niż w 48 godzin od jego
            stwierdzenia.
          </>,
          <>
            <b>Dalsi przetwarzający:</b> klient wyraża ogólną zgodę na korzystanie z dostawców wymienionych w pkt 9 i w
            polityce prywatności. O zmianie na liście Usługodawca informuje z 14-dniowym wyprzedzeniem, a klient może
            zgłosić sprzeciw i wypowiedzieć umowę.
          </>,
          <>
            <b>Po zakończeniu:</b> dane zostają usunięte albo zwrócone klientowi w ciągu 30 dni od zakończenia
            współpracy, zgodnie z jego wyborem, z wyjątkiem danych, które Usługodawca musi zachować na podstawie
            przepisów.
          </>,
          <>
            <b>Kontrola:</b> klient ma prawo do audytu nie częściej niż raz w roku, po uzgodnieniu terminu, albo do
            otrzymania pisemnej informacji o zastosowanych środkach.
          </>,
        ],
        po: [
          <>
            Klient, który potrzebuje odrębnej, podpisanej umowy powierzenia na własnym wzorze, może o nią wystąpić na
            adres kontaktowy. Aktualna lista podwykonawców z krajem i celem, miejsca przechowywania i okresy
            retencji są na stronie{" "}
            <a className="text-cyan-700 underline underline-offset-2" href="/bezpieczenstwo">
              Bezpieczeństwo i dane
            </a>
            .
          </>,
        ],
      },
      {
        tytul: "13. Bezpieczeństwo",
        punkty: [
          "Połączenie ze stroną i rozmowa głosowa są szyfrowane (HTTPS, WebRTC albo WebSocket po TLS).",
          "Hasło jest przechowywane wyłącznie jako skrót scrypt z losową solą.",
          "Sesja jest podpisanym tokenem w ciasteczku httpOnly, niedostępnym dla skryptów w przeglądarce.",
          "Nagrania leżą w prywatnym magazynie bez publicznych odnośników. Dostęp do danych konta ma tylko to konto oraz Usługodawca.",
          "Limity minut i rozmów są egzekwowane po stronie serwera, nie w przeglądarce.",
          "Dane karty płatniczej trafiają wyłącznie do Stripe. Usługodawca ich nie widzi i nie przechowuje.",
          "Dostawcy modeli i głosu działają na kontach firmowych Usługodawcy z ustawieniami opisanymi w polityce prywatności.",
        ],
      },
      {
        tytul: "14. Zmiany regulaminu",
        akapity: [
          <>
            O zmianie regulaminu informujemy mailem na adres konta z 14-dniowym wyprzedzeniem. Korzystanie z usługi po
            tym terminie oznacza przyjęcie zmian. Jeżeli klient nie zgadza się na zmianę, może wypowiedzieć umowę przed
            jej wejściem w życie.
          </>,
        ],
      },
      {
        tytul: "15. Prawo i spory",
        akapity: [
          <>
            Do umowy stosuje się prawo polskie. Spory z przedsiębiorcami rozstrzyga sąd właściwy dla miejsca
            prowadzenia działalności Usługodawcy. Nie dotyczy to sporów z osobami, do których stosuje się przepisy o
            ochronie konsumentów.
          </>,
        ],
      },
    ],
  },

  en: {
    naglowek: "Bruno AI Terms of Service",
    aktualizacja: "Last updated",
    sekcje: [
      {
        tytul: "1. Who provides the service",
        akapity: [
          <>
            The service is provided by Jakub Chodakowski, a sole proprietor registered in Poland, tax ID (NIP)
            6711845485 (the “Provider”). Contact: {MAIL}.
          </>,
        ],
      },
      {
        tytul: "2. What Bruno AI is",
        akapity: [
          <>
            Bruno AI is a tool for practicing sales calls. You have a voice call with an AI that plays your customer.
            After the call you get a score based on a fixed rubric and a set of drill cards to review. Bruno is not a
            human and not an advisor: what it says and how it scores you comes from a language model and may contain
            mistakes.
          </>,
          <>
            The service is a training tool. <b>The Provider does not guarantee higher sales</b> or any other business
            result. A score from Bruno is not an employee evaluation under labor law and must not be the only basis
            for an HR decision.
          </>,
        ],
      },
      {
        tytul: "3. Who it is for",
        akapity: [
          <>
            The service is used by companies with a sales team (team accounts under an order or a contract) and by
            sales reps who sign up on their own and buy Bruno Pro for themselves.
          </>,
          <>
            If you are a consumer, or a sole trader for whom this contract is not of a professional nature, consumer
            protection law applies to you, including the right to withdraw within 14 days (section 6).
          </>,
        ],
      },
      {
        tytul: "4. Account and login",
        punkty: [
          "A sales rep creates an account on the sign-up page: email address and password (at least 8 characters) or sign-in with a Google account. Team accounts for a company are created by the Provider for the email addresses the company provides, and access is sent by email.",
          "One account is for one person. Do not share your password with anyone.",
          "The database stores only an encrypted hash of your password (scrypt), never the password itself. With Google sign-in the Provider never receives your Google password.",
          "After 5 failed login attempts, login is locked for 15 minutes.",
          "“Forgot your password?” sends a temporary password to the account email. Change it in Settings. You can use this at most once every 2 minutes.",
          "Report any loss of control over your account or password immediately to hello@jakubchodakowski.com.",
        ],
      },
      {
        tytul: "5. Free calls",
        punkty: [
          "Every new account created on the sign-up page gets 3 free calls with Bruno. No payment card is required.",
          "A call counts as used when it is finished or lasts at least 60 seconds. One call lasts at most a few minutes (the limit is shown before you start).",
          "The free plan includes: calls (3), call feedback, drill cards and Customize Bruno (including loading your offer from a website or a PDF). Stats, Calendar, “Fire Up” and “Tomorrow’s call” require Bruno Pro.",
          "After the 3 calls are used, the account stays active, but further calls require Bruno Pro. Your feedback and drill cards remain.",
          "Until you use the 3 calls, the Provider may send one reminder per day to the account email. An account with no calls for 30 days may be deactivated.",
          "Limits are checked on the server before a call starts. On the free plan the Provider may change how the tool works without prior notice and does not guarantee availability or response time.",
        ],
      },
      {
        tytul: "6. Bruno Pro and full access",
        punkty: [
          "Bruno Pro for one person is bought with a one-time payment through Stripe: $250 for 30 days or $2,500 for 365 days (prices include applicable taxes).",
          "The payment does not renew by itself. When the period ends, the account goes back to the free plan and your call history remains.",
          "A new payment before the period ends extends your access from the day the current period ends.",
          "Bruno Pro includes 5 calls every day and all features of the app. Unused calls do not carry over to the next day.",
          "A consumer may withdraw from the contract within 14 days of purchase. By buying Bruno Pro you ask for the service to start right away; on withdrawal the refund is reduced in proportion to the days your access was active.",
        ],
        po: [
          <>
            Full access for a company (team accounts, setup for the client’s product, a report for the head of sales)
            is paid and set up under a separate order or contract that defines the scope, price, billing period and
            notice period. In case of conflict the contract prevails and these Terms apply as a supplement.
          </>,
        ],
      },
      {
        tytul: "7. What is saved during a call",
        akapity: [<>Every practice call is recorded and saved. We save:</>],
        punkty: [
          "the audio recording of the call (your voice and Bruno’s voice),",
          "the transcript of the call,",
          "the score, coach comments and call metrics (duration, number of questions, talk ratio),",
          "the settings chosen before the call: mode, goal, objections, customer type, difficulty level,",
          "the data entered in “Customize Bruno”: product description, customer description, objections, script.",
        ],
        po: [
          <>
            The recording and transcript are used to score the call, show your progress and resolve technical
            issues. Details, including the list of providers and retention periods, are in the{" "}
            <a className="text-cyan-700 underline underline-offset-2" href="/polityka-prywatnosci">
              privacy policy
            </a>
            .
          </>,
        ],
      },
      {
        tytul: "8. What is not allowed",
        punkty: [
          "Saying in a call or entering in the setup personal data of third parties, in particular names, phone numbers and addresses of real customers. Scenarios must be fictional.",
          "Entering special categories of data (health, opinions, religion, biometric data) or data covered by professional secrecy.",
          "Uploading recordings of real calls without the consent of everyone heard on them and without a legal basis.",
          "Sharing, reselling or jointly using account access. Creating multiple accounts to get around the free call limit.",
          "Trying to bypass limits, extract system instructions, generate automated traffic or overload the service.",
          "Using the tool for unlawful purposes, including practicing tactics that mislead customers.",
        ],
        po: [
          <>
            Breaking these rules entitles the Provider to block the account with immediate effect and, in the case of
            full access, to terminate the contract after an unsuccessful request to stop the violation.
          </>,
        ],
      },
      {
        tytul: "9. Availability and third-party providers",
        akapity: [
          <>
            The service runs on third-party providers: voice and call (ElevenLabs, OpenAI as backup), call and drill
            scoring (Anthropic), payments (Stripe), database and recording storage (Supabase), hosting (Vercel), email
            (Resend, Google). An outage or a change of terms on a provider’s side may temporarily limit the service.
            The Provider informs about longer outages by email.
          </>,
          <>For calls we recommend an up-to-date browser and headphones.</>,
        ],
      },
      {
        tytul: "10. Complaints",
        akapity: [
          <>
            Send complaints to {MAIL}. Include the account email, a description of the problem and the date and time
            of the call it concerns. We reply within 14 days.
          </>,
        ],
      },
      {
        tytul: "11. Liability",
        punkty: [
          "The Provider is liable for actual damage, excluding lost profits.",
          "For business customers, liability is limited to the fees paid by the customer in the 3 months before the event, and on the free plan to PLN 1,000.",
          "These limits do not apply to damage caused intentionally or where excluding liability is not allowed by law.",
          "The Provider is not liable for business decisions made on the basis of scores given by Bruno.",
        ],
      },
      {
        tytul: "12. Data processing agreement (Art. 28 GDPR)",
        akapity: [
          <>
            When a company’s team uses the service, the company is the controller of its sales reps’ data and the
            Provider processes that data on its instructions. Accepting these Terms is equivalent to entering into the
            data processing agreement below.
          </>,
        ],
        punkty: [
          <>
            <b>Subject and purpose:</b> providing sales call training in Bruno AI.
          </>,
          <>
            <b>Duration:</b> for as long as the service is used.
          </>,
          <>
            <b>Type of data:</b> first name, work email address, voice recordings, transcripts of practice calls, scores
            and training statistics.
          </>,
          <>
            <b>Data subjects:</b> the customer’s employees and contractors who use the accounts.
          </>,
          <>
            <b>Provider’s obligations:</b> processing only on the customer’s documented instructions, confidentiality,
            applying the security measures in section 13, assisting with data subject rights and with obligations under
            Art. 32-36 GDPR, notifying a personal data breach without undue delay and no later than 48 hours after
            becoming aware of it.
          </>,
          <>
            <b>Sub-processors:</b> the customer gives general consent to the providers listed in section 9 and in the
            privacy policy. The Provider gives 14 days’ notice of changes to the list; the customer may object and
            terminate the contract.
          </>,
          <>
            <b>After termination:</b> data is deleted or returned to the customer within 30 days of the end of the
            cooperation, at the customer’s choice, except for data the Provider must keep by law.
          </>,
          <>
            <b>Audit:</b> the customer may audit no more than once a year at an agreed time, or receive written
            information about the measures applied.
          </>,
        ],
        po: [
          <>
            A customer who needs a separate, signed data processing agreement on its own template may request one at
            the contact address. The current list of sub-processors with country and purpose, storage locations and
            retention periods is on the{" "}
            <a className="text-cyan-700 underline underline-offset-2" href="/bezpieczenstwo">
              Security &amp; Data
            </a>{" "}
            page.
          </>,
        ],
      },
      {
        tytul: "13. Security",
        punkty: [
          "The connection to the site and the voice call are encrypted (HTTPS, WebRTC or WebSocket over TLS).",
          "Your password is stored only as a scrypt hash with a random salt.",
          "The session is a signed token in an httpOnly cookie, not accessible to scripts in the browser.",
          "Recordings are kept in private storage with no public links. Only the account itself and the Provider have access to the account’s data.",
          "Minute and call limits are enforced on the server, not in the browser.",
          "Payment card data goes only to Stripe. The Provider never sees or stores it.",
          "Model and voice providers run on the Provider’s business accounts with the settings described in the privacy policy.",
        ],
      },
      {
        tytul: "14. Changes to these Terms",
        akapity: [
          <>
            We announce changes to these Terms by email to the account address 14 days in advance. Using the service
            after that date means you accept the changes. If you do not agree, you may terminate the contract before
            the changes take effect.
          </>,
        ],
      },
      {
        tytul: "15. Law and disputes",
        akapity: [
          <>
            Polish law applies to this contract. Disputes with business customers are settled by the court competent
            for the Provider’s place of business. This does not apply to disputes with persons covered by consumer
            protection law, who keep the protections of the law of their country of residence.
          </>,
        ],
      },
    ],
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

function Lista({ punkty }: { punkty: React.ReactNode[] }) {
  return (
    <ul className="list-disc pl-5 flex flex-col gap-1.5">
      {punkty.map((p, i) => (
        <li key={i}>{p}</li>
      ))}
    </ul>
  );
}

export default async function RegulaminPage() {
  const jezyk = await jezykStrony();
  const tresc = TRESC[jezyk];
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <main className="max-w-2xl mx-auto px-6 py-14 sm:py-20">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.02em] mb-2">{tresc.naglowek}</h1>
        <p className="text-sm text-slate-500 mb-10">
          {tresc.aktualizacja}: {AKTUALIZACJA[jezyk]}
        </p>
        {tresc.sekcje.map((s) => (
          <Sekcja key={s.tytul} tytul={s.tytul}>
            {s.akapity?.map((a, i) => (
              <p key={`a${i}`}>{a}</p>
            ))}
            {s.punkty && <Lista punkty={s.punkty} />}
            {s.po?.map((a, i) => (
              <p key={`p${i}`}>{a}</p>
            ))}
          </Sekcja>
        ))}
      </main>
    </div>
  );
}
