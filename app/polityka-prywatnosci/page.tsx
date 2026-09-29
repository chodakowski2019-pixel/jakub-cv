import type { Metadata } from "next";

// Polityka prywatności jakubchodakowski.com (USER_001 29.09). Powstała pod
// formularze Bruno AI (/aisaleskontakt, /aisalesbrief), ale obejmuje całą stronę.
// Sekcje: administrator, jakie dane, cel i podstawa, odbiorcy, okres, prawa,
// nagrania, analityka. Bez cookies: Vercel Analytics nie stawia ciasteczek.

export const metadata: Metadata = {
  title: "Polityka prywatności | Jakub Chodakowski",
  description: "Kto jest administratorem danych na jakubchodakowski.com, po co je zbieram, jak długo trzymam i jakie masz prawa.",
  alternates: { canonical: "https://jakubchodakowski.com/polityka-prywatnosci" },
  robots: { index: false, follow: false },
};

const AKTUALIZACJA = "29 września 2026";

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
              <b>Inne formularze na stronie:</b> dane, o które prosi dany formularz (zwykle imię i e-mail).
            </li>
          </ul>
          <p>Nie kupuję danych, nie łączę ich z zewnętrznymi bazami i nie profiluję.</p>
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
              <b>Obrona przed roszczeniami i ich dochodzenie:</b> prawnie uzasadniony interes, art. 6 ust. 1 lit. f
              RODO.
            </li>
          </ul>
          <p>Podanie danych jest dobrowolne. Bez nich nie mogę się z Tobą skontaktować ani ustawić treningu.</p>
        </Sekcja>

        <Sekcja tytul="4. Kto jeszcze ma dostęp do danych">
          <p>Dane przetwarzają w moim imieniu dostawcy narzędzi, z którymi mam umowy powierzenia:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>Vercel Inc. (hosting strony), USA</li>
            <li>Supabase Inc. (baza danych i przechowywanie nagrań), USA</li>
            <li>Resend Inc. (wysyłka powiadomień e-mail), USA</li>
            <li>Google LLC (skrzynka pocztowa), USA</li>
          </ul>
          <p>
            Przekazanie danych do USA odbywa się na podstawie decyzji Komisji Europejskiej o Data Privacy Framework
            albo standardowych klauzul umownych. Nie sprzedaję danych i nie udostępniam ich nikomu innemu, chyba że
            wymaga tego prawo.
          </p>
        </Sekcja>

        <Sekcja tytul="5. Jak długo trzymam dane">
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>Dane z formularza kontaktowego: do wycofania zgody, najdłużej 12 miesięcy od ostatniego kontaktu.</li>
            <li>Dane z formularza konfiguracyjnego i nagrania: przez czas współpracy i 12 miesięcy po jej zakończeniu.</li>
            <li>Jeśli nie dojdzie do współpracy: 12 miesięcy od wysłania formularza.</li>
          </ul>
        </Sekcja>

        <Sekcja tytul="6. Nagrania rozmów">
          <p>
            Nagrania rozmów sprzedażowych zawierają głos i wypowiedzi osób trzecich. Wgrywając nagranie, potwierdzasz,
            że masz zgodę wszystkich osób, które na nim słychać, i że nagranie powstało zgodnie z prawem. Nagrania
            służą wyłącznie do ustawienia treningu dla Twojej firmy, są przechowywane w prywatnym magazynie i nie
            są nikomu udostępniane.
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
        </Sekcja>

        <Sekcja tytul="9. Zmiany polityki">
          <p>
            Jeśli coś się zmieni, zaktualizuję ten dokument i datę na górze. Wersja obowiązująca to zawsze ta
            opublikowana pod tym adresem.
          </p>
        </Sekcja>
      </main>
    </div>
  );
}
