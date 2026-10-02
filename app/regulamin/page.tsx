import type { Metadata } from "next";

// Regulamin Bruno AI (USER_001 2.10). Powstał, bo produkt urósł z dwóch formularzy
// do działającego panelu z kontami, rozmowami głosowymi i nagraniami, a jedynym
// dokumentem była polityka prywatności z 29.09.
//
// Zawiera też sekcję POWIERZENIA (art. 28 RODO): przy sprzedaży firmie to firma
// jest administratorem danych swoich handlowców, a my podmiotem przetwarzającym.
// Bez tej sekcji żaden dział prawny w firmie 15+ osób nie podpisze umowy.

export const metadata: Metadata = {
  title: "Regulamin Bruno AI | Jakub Chodakowski",
  description: "Zasady korzystania z Bruno AI: konto, dostęp testowy, nagrania rozmów, powierzenie przetwarzania danych, reklamacje.",
  alternates: { canonical: "https://jakubchodakowski.com/regulamin" },
  robots: { index: false, follow: false },
};

const AKTUALIZACJA = "2 października 2026";

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

export default function RegulaminPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <main className="max-w-2xl mx-auto px-6 py-14 sm:py-20">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.02em] mb-2">Regulamin Bruno AI</h1>
        <p className="text-sm text-slate-500 mb-10">Ostatnia aktualizacja: {AKTUALIZACJA}</p>

        <Sekcja tytul="1. Kto świadczy usługę">
          <p>
            Usługę świadczy Jakub Chodakowski, prowadzący jednoosobową działalność gospodarczą, NIP 6711845485
            (dalej: „Usługodawca”). Kontakt:{" "}
            <a className="text-cyan-700 underline underline-offset-2" href="mailto:hello@jakubchodakowski.com">
              hello@jakubchodakowski.com
            </a>
            .
          </p>
        </Sekcja>

        <Sekcja tytul="2. Czym jest Bruno AI">
          <p>
            Bruno AI to narzędzie do treningu rozmów sprzedażowych. Użytkownik prowadzi rozmowę głosową ze sztuczną
            inteligencją, która gra klienta, a po rozmowie dostaje ocenę według stałej rubryki oraz zestaw fiszek do
            powtórek. Bruno nie jest człowiekiem i nie jest doradcą: jego wypowiedzi i oceny są generowane przez model
            językowy i mogą zawierać błędy.
          </p>
          <p>
            Usługa jest narzędziem treningowym. <b>Usługodawca nie gwarantuje wzrostu sprzedaży</b> ani żadnego innego
            wyniku biznesowego. Ocena wystawiona przez Bruno nie jest oceną pracowniczą w rozumieniu prawa pracy i nie
            może być jedyną podstawą decyzji kadrowej.
          </p>
        </Sekcja>

        <Sekcja tytul="3. Dla kogo">
          <p>
            Usługa jest kierowana do przedsiębiorców: firm z zespołem sprzedaży i osób prowadzących działalność
            gospodarczą. Umowa zawierana jest w związku z działalnością gospodarczą użytkownika.
          </p>
          <p>
            Jeżeli użytkownikiem jest osoba fizyczna prowadząca działalność gospodarczą, a umowa nie ma dla niej
            charakteru zawodowego, stosuje się do niej przepisy o ochronie konsumentów we wskazanym prawem zakresie,
            w tym prawo odstąpienia od umowy w 14 dni.
          </p>
        </Sekcja>

        <Sekcja tytul="4. Konto i logowanie">
          <Lista
            punkty={[
              "Konto zakłada Usługodawca na wskazany adres e-mail. Logowanie odbywa się adresem e-mail i stałym 6-cyfrowym kodem.",
              "Jedno konto służy jednej osobie. Kodu nie wolno udostępniać innym osobom.",
              "W bazie przechowywany jest wyłącznie zaszyfrowany skrót kodu (scrypt), nie sam kod.",
              "Po 5 nieudanych próbach logowanie zostaje zablokowane na 15 minut.",
              "Utratę kontroli nad kontem lub kodem należy zgłosić natychmiast na hello@jakubchodakowski.com.",
            ]}
          />
        </Sekcja>

        <Sekcja tytul="5. Dostęp testowy">
          <Lista
            punkty={[
              "Dostęp testowy jest bezpłatny i nie wymaga podania karty płatniczej.",
              "Trwa 7 dni liczonych od pierwszego zalogowania i wygasa sam, bez wypowiedzenia.",
              "Obejmuje limity ustawione dla konta: łączną liczbę minut rozmów, liczbę rozmów na dzień i liczbę fiszek na dzień. Limity są sprawdzane po stronie serwera przed startem rozmowy.",
              "W czasie testu Usługodawca może wprowadzać zmiany w działaniu narzędzia bez wcześniejszego powiadomienia.",
              "Dostęp testowy nie obejmuje gwarancji dostępności ani czasu reakcji na zgłoszenia.",
            ]}
          />
        </Sekcja>

        <Sekcja tytul="6. Pełen dostęp">
          <p>
            Pełen dostęp (konta dla zespołu, konfiguracja pod produkt klienta, raport dla szefa sprzedaży) jest płatny
            i uruchamiany na podstawie odrębnego zamówienia lub umowy, która określa zakres, cenę, okres rozliczeniowy
            i okres wypowiedzenia. W razie rozbieżności pierwszeństwo ma umowa, a ten regulamin stosuje się
            uzupełniająco.
          </p>
        </Sekcja>

        <Sekcja tytul="7. Co jest zapisywane podczas rozmowy">
          <p>Każda rozmowa treningowa jest nagrywana i zapisywana. Zapisujemy:</p>
          <Lista
            punkty={[
              "nagranie dźwiękowe rozmowy (głos użytkownika i głos Bruno),",
              "transkrypcję rozmowy,",
              "ocenę, komentarze trenera i metryki rozmowy (czas, liczba pytań, proporcje wypowiedzi),",
              "ustawienia wybrane przed rozmową: tryb, cel, obiekcje, typ klienta, poziom trudności,",
              "dane wpisane w „Dostosuj Bruno”: opis produktu, opis klienta, obiekcje, skrypt.",
            ]}
          />
          <p>
            Nagranie i transkrypcja służą do wystawienia oceny, pokazania postępu i rozwiązywania zgłoszeń
            technicznych. Szczegóły, w tym listę dostawców i okresy przechowywania, opisuje{" "}
            <a className="text-cyan-700 underline underline-offset-2" href="/polityka-prywatnosci">
              polityka prywatności
            </a>
            .
          </p>
        </Sekcja>

        <Sekcja tytul="8. Czego nie wolno">
          <Lista
            punkty={[
              "Podawać w rozmowie ani wpisywać w konfigurację danych osobowych osób trzecich, w szczególności imion, nazwisk, numerów telefonów i adresów prawdziwych klientów. Scenariusze mają być fikcyjne.",
              "Podawać danych szczególnych kategorii (zdrowie, poglądy, wyznanie, dane biometryczne) ani danych objętych tajemnicą zawodową.",
              "Wgrywać nagrań prawdziwych rozmów bez zgody wszystkich osób, które na nich słychać, i bez podstawy prawnej.",
              "Udostępniać, odsprzedawać ani współdzielić dostępu do konta.",
              "Podejmować prób obejścia limitów, wyciągnięcia instrukcji systemowych, automatycznego generowania ruchu ani obciążania usługi.",
              "Używać narzędzia do celów niezgodnych z prawem, w tym do trenowania praktyk wprowadzających klientów w błąd.",
            ]}
          />
          <p>
            Naruszenie tych zasad uprawnia Usługodawcę do zablokowania konta ze skutkiem natychmiastowym, a w razie
            pełnego dostępu, do wypowiedzenia umowy po bezskutecznym wezwaniu do zaprzestania naruszeń.
          </p>
        </Sekcja>

        <Sekcja tytul="9. Dostępność i dostawcy zewnętrzni">
          <p>
            Usługa działa w oparciu o dostawców zewnętrznych: głos i rozmowa (ElevenLabs, zapasowo OpenAI), ocena
            rozmowy i fiszek (Anthropic), baza danych i magazyn nagrań (Supabase), hosting (Vercel), poczta (Resend,
            Google). Awaria lub zmiana warunków po stronie dostawcy może czasowo ograniczyć działanie usługi.
            Usługodawca informuje o dłuższych przerwach mailem.
          </p>
          <p>
            Do rozmów zalecana jest przeglądarka Chrome i słuchawki. W Safari jakość dźwięku bywa gorsza, co nie
            stanowi wady usługi.
          </p>
        </Sekcja>

        <Sekcja tytul="10. Reklamacje">
          <p>
            Reklamacje przyjmujemy na{" "}
            <a className="text-cyan-700 underline underline-offset-2" href="mailto:hello@jakubchodakowski.com">
              hello@jakubchodakowski.com
            </a>
            . Reklamacja powinna zawierać adres e-mail konta, opis problemu i datę oraz godzinę rozmowy, której
            dotyczy. Odpowiadamy w ciągu 14 dni.
          </p>
        </Sekcja>

        <Sekcja tytul="11. Odpowiedzialność">
          <Lista
            punkty={[
              "Usługodawca odpowiada za szkodę rzeczywistą, z wyłączeniem utraconych korzyści.",
              "W relacjach z przedsiębiorcami odpowiedzialność jest ograniczona do wysokości opłat zapłaconych przez klienta w ciągu 3 miesięcy poprzedzających zdarzenie, a w dostępie testowym, który jest bezpłatny, do 1 000 zł.",
              "Ograniczenia nie dotyczą szkody wyrządzonej umyślnie ani przypadków, w których wyłączenie odpowiedzialności jest niedopuszczalne z mocy prawa.",
              "Usługodawca nie odpowiada za decyzje biznesowe podjęte na podstawie ocen wystawionych przez Bruno.",
            ]}
          />
        </Sekcja>

        <Sekcja tytul="12. Powierzenie przetwarzania danych (art. 28 RODO)">
          <p>
            Gdy z usługi korzysta zespół firmy, to firma jest administratorem danych swoich handlowców, a Usługodawca
            przetwarza te dane na jej polecenie. Przyjęcie tego regulaminu jest równoznaczne z zawarciem umowy
            powierzenia o treści poniżej.
          </p>
          <Lista
            punkty={[
              <>
                <b>Przedmiot i cel:</b> świadczenie treningu rozmów sprzedażowych w Bruno AI.
              </>,
              <>
                <b>Czas:</b> na czas korzystania z usługi.
              </>,
              <>
                <b>Rodzaj danych:</b> imię, służbowy adres e-mail, nagrania głosu, transkrypcje rozmów treningowych,
                oceny i statystyki treningu.
              </>,
              <>
                <b>Kategorie osób:</b> pracownicy i współpracownicy klienta korzystający z kont.
              </>,
              <>
                <b>Obowiązki Usługodawcy:</b> przetwarzanie wyłącznie na udokumentowane polecenie klienta, zachowanie
                poufności, stosowanie środków bezpieczeństwa z pkt 13, pomoc w realizacji praw osób i w obowiązkach z
                art. 32-36 RODO, zgłoszenie naruszenia ochrony danych bez zbędnej zwłoki, nie później niż w 48 godzin
                od jego stwierdzenia.
              </>,
              <>
                <b>Dalsi przetwarzający:</b> klient wyraża ogólną zgodę na korzystanie z dostawców wymienionych w pkt
                9 i w polityce prywatności. O zmianie na liście Usługodawca informuje z 14-dniowym wyprzedzeniem, a
                klient może zgłosić sprzeciw i wypowiedzieć umowę.
              </>,
              <>
                <b>Po zakończeniu:</b> dane zostają usunięte albo zwrócone klientowi w ciągu 30 dni od zakończenia
                współpracy, zgodnie z jego wyborem, z wyjątkiem danych, które Usługodawca musi zachować na podstawie
                przepisów.
              </>,
              <>
                <b>Kontrola:</b> klient ma prawo do audytu nie częściej niż raz w roku, po uzgodnieniu terminu, albo
                do otrzymania pisemnej informacji o zastosowanych środkach.
              </>,
            ]}
          />
          <p>
            Klient, który potrzebuje odrębnej, podpisanej umowy powierzenia na własnym wzorze, może o nią wystąpić na
            adres kontaktowy.
          </p>
        </Sekcja>

        <Sekcja tytul="13. Bezpieczeństwo">
          <Lista
            punkty={[
              "Połączenie ze stroną i rozmowa głosowa są szyfrowane (HTTPS, WebRTC albo WebSocket po TLS).",
              "Kod logowania jest przechowywany wyłącznie jako skrót scrypt z losową solą.",
              "Sesja jest podpisanym tokenem w ciasteczku httpOnly, niedostępnym dla skryptów w przeglądarce.",
              "Nagrania leżą w prywatnym magazynie bez publicznych odnośników. Dostęp do danych konta ma tylko to konto oraz Usługodawca.",
              "Limity minut i rozmów są egzekwowane po stronie serwera, nie w przeglądarce.",
              "Dostawcy modeli i głosu działają na kontach firmowych Usługodawcy z ustawieniami opisanymi w polityce prywatności.",
            ]}
          />
        </Sekcja>

        <Sekcja tytul="14. Zmiany regulaminu">
          <p>
            O zmianie regulaminu informujemy mailem na adres konta z 14-dniowym wyprzedzeniem. Korzystanie z usługi po
            tym terminie oznacza przyjęcie zmian. Jeżeli klient nie zgadza się na zmianę, może wypowiedzieć umowę
            przed jej wejściem w życie.
          </p>
        </Sekcja>

        <Sekcja tytul="15. Prawo i spory">
          <p>
            Do umowy stosuje się prawo polskie. Spory z przedsiębiorcami rozstrzyga sąd właściwy dla miejsca
            prowadzenia działalności Usługodawcy. Nie dotyczy to sporów z osobami, do których stosuje się przepisy
            o ochronie konsumentów.
          </p>
        </Sekcja>
      </main>
    </div>
  );
}
