import type { Metadata } from "next";

// Polityka prywatności jakubchodakowski.com (USER_001 29.09, przepisana 2.10).
// Powstała pod formularze Bruno AI (/aisaleskontakt, /aisalesbrief), ale obejmuje
// całą stronę.
//
// Przepisanie 2.10: między 30.09 a 2.10 doszedł działający panel Bruno z kontami,
// rozmowami głosowymi, nagraniami, transkrypcjami i oceną przez modele AI. Doszli
// przez to trzej dostawcy, których w wersji z 29.09 nie było (ElevenLabs, OpenAI,
// Anthropic) oraz ciasteczko sesji. Nowe sekcje: panel i rozmowy, dostawcy AI
// z opisem co każdy robi z danymi, retencja nagrań, ciasteczko sesji.

export const metadata: Metadata = {
  title: "Polityka prywatności | Jakub Chodakowski",
  description: "Kto jest administratorem danych na jakubchodakowski.com, po co je zbieram, jak długo trzymam i jakie masz prawa.",
  alternates: { canonical: "https://jakubchodakowski.com/polityka-prywatnosci" },
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

export default function PolitykaPrywatnosciPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <main className="max-w-2xl mx-auto px-6 py-14 sm:py-20">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.02em] mb-2">Polityka prywatności</h1>
        <p className="text-sm text-slate-500 mb-10">Ostatnia aktualizacja: {AKTUALIZACJA}</p>

        <Sekcja tytul="1. Administrator danych">
          <p>
            Administratorem Twoich danych osobowych jest Jakub Chodakowski, prowadzący jednoosobową działalność
            gospodarczą, NIP 6711845485. Kontakt w sprawie danych:{" "}
            <a className="text-cyan-700 underline underline-offset-2" href="mailto:hello@jakubchodakowski.com">
              hello@jakubchodakowski.com
            </a>
            .
          </p>
        </Sekcja>

        <Sekcja tytul="2. Jakie dane zbieram">
          <p>Tylko to, co sam wpiszesz w formularze na tej stronie:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>
              <b>Formularz kontaktowy Bruno AI:</b> imię, adres e-mail, numer telefonu (opcjonalnie), stanowisko.
            </li>
            <li>
              <b>Formularz konfiguracyjny Bruno AI:</b> nazwa firmy, opis produktu i procesu sprzedaży, opis klienta,
              obiekcje, opcjonalnie nagrania rozmów sprzedażowych.
            </li>
            <li>
              <b>Panel Bruno AI (konto testowe i pełne):</b> imię, adres e-mail, nazwa firmy, zaszyfrowany skrót kodu
              logowania, ustawienia konta i godzina przypomnień.
            </li>
            <li>
              <b>Rozmowy treningowe w Bruno AI:</b> nagranie dźwiękowe rozmowy (Twój głos i głos Bruno), transkrypcja,
              ocena z komentarzami, metryki rozmowy, wybrane przed rozmową ustawienia (tryb, cel, obiekcje, typ
              klienta, poziom trudności) oraz odpowiedzi na fiszki.
            </li>
            <li>
              <b>Inne formularze na stronie:</b> dane, o które prosi dany formularz (zwykle imię i e-mail).
            </li>
          </ul>
          <p>Nie kupuję danych, nie łączę ich z zewnętrznymi bazami i nie profiluję.</p>
          <p>
            Rozmowy treningowe mają być fikcyjne. Nie podawaj w nich danych prawdziwych klientów ani danych
            szczególnych kategorii (zdrowie, poglądy, wyznanie). Twój głos przetwarzamy po to, żeby rozmowa mogła się
            odbyć i żeby ocenić jej treść, a nie po to, żeby Cię po głosie rozpoznawać: nie tworzymy profilu
            głosowego i nie używamy go do identyfikacji.
          </p>
        </Sekcja>

        <Sekcja tytul="3. Po co i na jakiej podstawie">
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>
              <b>Kontakt w sprawie pilotażu Bruno AI</b> (telefon, e-mail): na podstawie Twojej zgody, art. 6 ust. 1
              lit. a RODO. Zgodę możesz wycofać w każdej chwili, mailem.
            </li>
            <li>
              <b>Przygotowanie i ustawienie treningu sprzedaży</b> pod Twoją firmę: działania przed zawarciem umowy i
              jej wykonanie, art. 6 ust. 1 lit. b RODO.
            </li>
            <li>
              <b>Prowadzenie konta i rozmów treningowych w Bruno AI</b> (nagranie, transkrypcja, ocena, powtórki,
              przypomnienia): wykonanie umowy o dostęp do narzędzia, art. 6 ust. 1 lit. b RODO.
            </li>
            <li>
              <b>Bezpieczeństwo konta i usługi</b> (blokada po nieudanych próbach logowania, logi techniczne,
              rozwiązywanie zgłoszeń): prawnie uzasadniony interes, art. 6 ust. 1 lit. f RODO.
            </li>
            <li>
              <b>Obrona przed roszczeniami i ich dochodzenie:</b> prawnie uzasadniony interes, art. 6 ust. 1 lit. f
              RODO.
            </li>
          </ul>
          <p>
            Gdy z Bruno AI korzysta zespół firmy, administratorem danych handlowców jest ta firma, a ja przetwarzam je
            na jej polecenie jako podmiot przetwarzający. Warunki powierzenia opisuje punkt 12{" "}
            <a className="text-cyan-700 underline underline-offset-2" href="/regulamin">
              regulaminu
            </a>
            .
          </p>
          <p>Podanie danych jest dobrowolne. Bez nich nie mogę się z Tobą skontaktować ani ustawić treningu.</p>
        </Sekcja>

        <Sekcja tytul="4. Kto jeszcze ma dostęp do danych">
          <p>Dane przetwarzają w moim imieniu dostawcy narzędzi, z którymi mam zawarte umowy powierzenia:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>Vercel Inc. (hosting strony i aplikacji), USA</li>
            <li>Supabase Inc. (baza danych i magazyn nagrań), USA</li>
            <li>Resend Inc. (wysyłka powiadomień e-mail), USA</li>
            <li>Google LLC (skrzynka pocztowa), USA</li>
          </ul>
          <p>Rozmowę głosową i jej ocenę obsługują dostawcy modeli AI:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>
              <b>ElevenLabs</b> (głos Bruno, rozpoznawanie mowy, prowadzenie rozmowy). Dla osób z Europejskiego
              Obszaru Gospodarczego podmiotem odpowiedzialnym jest Eleven Labs Poland sp. z o.o. z siedzibą w
              Warszawie; przetwarzanie może odbywać się w USA, Unii Europejskiej lub Singapurze. Okres
              przechowywania rozmów po stronie ElevenLabs jest ustawiony na 30 dni. Zgodnie z polityką ElevenLabs
              treści przesyłane w planach innych niż enterprise mogą służyć doskonaleniu jego modeli, dopóki nie
              wyłączy się tego w ustawieniach konta. Na naszym koncie to ustawienie jest wyłączone od 3 października
              2026 r., więc rozmowy prowadzone od tego dnia nie są używane do uczenia modeli ElevenLabs.
            </li>
            <li>
              <b>OpenAI, L.L.C.</b> (zapasowy dostawca rozmowy głosowej, używany, gdy ElevenLabs jest niedostępny),
              USA. Dane przesyłane przez API nie są używane do trenowania modeli OpenAI; logi bezpieczeństwa są
              kasowane w ciągu 30 dni.
            </li>
            <li>
              <b>Anthropic PBC</b> (ocena rozmowy i odpowiedzi na fiszki), USA. Zgodnie z warunkami handlowymi
              Anthropic nie trenuje modeli na treściach klientów; dane są kasowane w ciągu 30 dni.
            </li>
          </ul>
          <p>
            Przekazanie danych do USA odbywa się na podstawie decyzji Komisji Europejskiej o Data Privacy Framework
            albo standardowych klauzul umownych. Nie sprzedaję danych i nie udostępniam ich nikomu innemu, chyba że
            wymaga tego prawo. Aktualną listę dostawców podaję na żądanie, a o jej zmianie informuję mailem z
            14-dniowym wyprzedzeniem.
          </p>
        </Sekcja>

        <Sekcja tytul="5. Jak długo trzymam dane">
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>Dane z formularza kontaktowego: do wycofania zgody, najdłużej 12 miesięcy od ostatniego kontaktu.</li>
            <li>Dane z formularza konfiguracyjnego i nagrania: przez czas współpracy i 12 miesięcy po jej zakończeniu.</li>
            <li>Jeśli nie dojdzie do współpracy: 12 miesięcy od wysłania formularza.</li>
            <li>
              Konto w panelu Bruno AI: przez czas korzystania z usługi. Konto testowe, z którego nie powstała
              współpraca, kasuję w ciągu 3 miesięcy od wygaśnięcia dostępu.
            </li>
            <li>
              Nagrania i transkrypcje rozmów treningowych: 12 miesięcy od rozmowy, a w razie zakończenia współpracy,
              30 dni od jej zakończenia. Kopia po stronie dostawcy głosu znika najpóźniej po 30 dniach.
            </li>
            <li>Oceny i statystyki bez nagrania (potrzebne, żeby pokazywać postęp): przez czas korzystania z usługi.</li>
          </ul>
          <p>Nagranie konkretnej rozmowy albo wszystkie swoje nagrania kasuję wcześniej na jedno zgłoszenie mailem.</p>
        </Sekcja>

        <Sekcja tytul="6. Nagrania rozmów">
          <p>
            <b>Rozmowy treningowe z Bruno</b> są nagrywane zawsze, od startu do końca rozmowy. Nagranie i transkrypcja
            trafiają do mojego prywatnego magazynu bez publicznych odnośników. Widzisz je Ty w swoim panelu, ja jako
            usługodawca, a w firmie z pełnym dostępem także osoba wskazana przez firmę jako szef zespołu. Nikomu
            innemu ich nie udostępniam.
          </p>
          <p>
            <b>Nagrania prawdziwych rozmów z klientami</b>, które wgrywasz sam, zawierają głos i wypowiedzi osób
            trzecich. Wgrywając nagranie, potwierdzasz, że masz zgodę wszystkich osób, które na nim słychać, i że
            nagranie powstało zgodnie z prawem. Służą wyłącznie do ustawienia treningu dla Twojej firmy.
          </p>
        </Sekcja>

        <Sekcja tytul="7. Twoje prawa">
          <p>Masz prawo do:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>dostępu do swoich danych i otrzymania ich kopii,</li>
            <li>sprostowania danych,</li>
            <li>usunięcia danych,</li>
            <li>ograniczenia przetwarzania,</li>
            <li>przeniesienia danych,</li>
            <li>sprzeciwu wobec przetwarzania opartego na prawnie uzasadnionym interesie,</li>
            <li>wycofania zgody w każdej chwili, bez wpływu na zgodność z prawem wcześniejszego przetwarzania,</li>
            <li>skargi do Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa).</li>
          </ul>
          <p>
            Żeby skorzystać z tych praw, napisz na{" "}
            <a className="text-cyan-700 underline underline-offset-2" href="mailto:hello@jakubchodakowski.com">
              hello@jakubchodakowski.com
            </a>
            . Odpowiadam w ciągu 30 dni.
          </p>
        </Sekcja>

        <Sekcja tytul="8. Pliki cookies i analityka">
          <p>
            Strona nie używa plików cookies do śledzenia. Do liczenia odwiedzin korzystam z Vercel Web Analytics,
            które nie stawia ciasteczek i nie identyfikuje pojedynczych osób.
          </p>
          <p>
            Panel Bruno AI używa jednego ciasteczka niezbędnego do działania: <code>bruno_sesja</code>. Trzyma
            podpisany token sesji, jest niedostępne dla skryptów w przeglądarce (httpOnly) i wygasa po 30 dniach albo
            po wylogowaniu. Bez niego logowanie nie działa, dlatego nie wymaga zgody.
          </p>
        </Sekcja>

        <Sekcja tytul="9. Bezpieczeństwo">
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>Połączenie ze stroną i rozmowa głosowa są szyfrowane.</li>
            <li>Kod logowania przechowuję wyłącznie jako skrót scrypt z losową solą, nigdy jako zwykły tekst.</li>
            <li>Po 5 nieudanych próbach logowania konto jest blokowane na 15 minut.</li>
            <li>Nagrania leżą w prywatnym magazynie bez publicznych odnośników.</li>
            <li>Dane każdego konta są filtrowane po jego adresie e-mail: jedno konto nie widzi danych drugiego.</li>
            <li>Dostawcy modeli i głosu działają na moich kontach firmowych, z ustawieniami opisanymi w punkcie 4.</li>
          </ul>
          <p>
            Naruszenie ochrony danych zgłaszam osobom, których dotyczy, i Prezesowi UODO w terminach z art. 33-34
            RODO, a klientowi biznesowemu w ciągu 48 godzin od jego stwierdzenia.
          </p>
        </Sekcja>

        <Sekcja tytul="10. Zmiany polityki">
          <p>
            Jeśli coś się zmieni, zaktualizuję ten dokument i datę na górze. Wersja obowiązująca to zawsze ta
            opublikowana pod tym adresem.
          </p>
        </Sekcja>
      </main>
    </div>
  );
}
