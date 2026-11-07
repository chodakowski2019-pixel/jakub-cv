import type { Metadata } from "next";
import u from "../umowa/umowa.module.css";
import { HANDLOWCZYNIE, KLIENT, KONTAKT_ZGLOSZENIA, USLUGODAWCA, WERSJA } from "../dane";

// 7.11 (USER_001: „umowę powierzenia piszemy teraz”): umowa powierzenia przetwarzania danych (RODO art. 28)
// do umowy współpracy Ewatex. Strona = źródło PDF: node scripts/bruno-umowa-pdf.mjs ewatex <host> powierzenie
// → public/pdf/powierzenie-ewatex.pdf. Link na /oferta/ewatex (sekcja Umowy) i w zgodzie przy podpisie.
// Podwykonawcy = lista ze strony salesbruno.pl/bezpieczenstwo (25.10) + Supabase UE dla CRM (decyzja 7.11: Frankfurt).
export const metadata: Metadata = {
  title: "Umowa powierzenia danych Ewatex × Bruno AI",
  robots: { index: false, follow: false },
};

const PODWYKONAWCY: [string, string, string][] = [
  ["Supabase Inc.", "UE (Frankfurt) dla Systemu CRM; USA (us-east-1) dla Bruno AI", "baza danych i pliki: konta, dane klientów Klienta w Systemie, notatki, transkrypcje, nagrania treningowe"],
  ["Vercel Inc.", "USA", "hosting strony i aplikacji; dane przechodzą przez serwer, logi zapytań"],
  ["ElevenLabs (Eleven Labs Poland sp. z o.o.)", "Polska / USA", "głos Bruno i rozpoznawanie mowy w rozmowach treningowych"],
  ["OpenAI, L.L.C.", "USA", "model językowy grający klienta w rozmowach treningowych; zamiana głosówek na tekst"],
  ["Anthropic PBC", "USA", "ocena rozmów, fiszki, czat z Bruno, notatki z głosówek do Systemu"],
  ["Resend Inc.", "USA", "wysyłka e-maili (logowanie, przypomnienia, raporty)"],
  ["Stripe, Inc.", "USA", "płatności (Usługodawca nie widzi numerów kart)"],
  ["Google LLC", "USA", "skrzynka e-mail Usługodawcy, logowanie przez Google"],
];

export default function Page() {
  return (
    <main className={u.root}>
      <h1 className={u.h1}>Umowa powierzenia przetwarzania danych osobowych</h1>
      <p className={u.podtytul}>Załącznik do umowy współpracy Bruno AI i system CRM · wersja {WERSJA} · art. 28 RODO</p>

      <p>
        <b>Zawarta w dniu akceptacji umowy współpracy na stronie salesbruno.pl/oferta/ewatex, w formie dokumentowej, między:</b>
      </p>
      <div className={u.strony}>
        <div className={u.strona}>
          <b className={u.nazwa}>{KLIENT.nazwa}</b>
          {KLIENT.adres}, NIP {KLIENT.nip}, KRS {KLIENT.krs}, reprezentowana przez <b>{KLIENT.reprezentant}</b>, {KLIENT.funkcja}, zwana dalej <b>Administratorem</b>
        </div>
        <div className={u.strona}>
          <b className={u.nazwa}>{USLUGODAWCA.nazwa}</b>
          {USLUGODAWCA.opis}, {USLUGODAWCA.adres}, NIP {USLUGODAWCA.nip}, zwany dalej <b>Podmiotem przetwarzającym</b>
        </div>
      </div>

      <h2>§ 1. Przedmiot i cel</h2>
      <ol>
        <li>Administrator powierza Podmiotowi przetwarzającemu przetwarzanie danych osobowych w celu wykonania umowy współpracy: dostępu handlowców do Bruno AI oraz budowy, wdrożenia i utrzymania systemu CRM (dalej: System).</li>
        <li>Przetwarzanie trwa przez czas umowy współpracy. Po jej końcu Podmiot przetwarzający kasuje dane w 14 dni (§ 6), chyba że Administrator wcześniej je pobierze albo przejmie System (§ 9 umowy współpracy).</li>
      </ol>

      <h2>§ 2. Jakie dane i czyje</h2>
      <table className={u.tab}>
        <tbody>
          <tr>
            <th>Handlowcy i zarządzająca Administratora</th>
            <td>imię i nazwisko, e-mail, telefon, głos i treść rozmów treningowych, oceny, notatki i głosówki wpisywane do Systemu</td>
          </tr>
          <tr>
            <th>Klienci i kontrahenci Administratora w Systemie</th>
            <td>firma, NIP, osoba kontaktowa, telefon, e-mail, obecny sprzedawca energii, data końca umowy, cena, faktury (pliki), historia rozmów i notatki</td>
          </tr>
        </tbody>
      </table>
      <p>Charakter przetwarzania: zbieranie, zapisywanie, przechowywanie, przeglądanie, zamiana głosu na tekst, analiza przez modele AI, usuwanie. Bez danych szczególnych kategorii (art. 9 RODO).</p>

      <h2>§ 3. Obowiązki Podmiotu przetwarzającego</h2>
      <ol>
        <li>Przetwarza dane tylko na udokumentowane polecenie Administratora (umowa współpracy, ustawienia Systemu, polecenia mailem) i tylko w celu z § 1.</li>
        <li>Zapewnia, że osoby z dostępem do danych zobowiązały się do poufności.</li>
        <li>Stosuje środki bezpieczeństwa: szyfrowanie połączeń (TLS), szyfrowanie danych w spoczynku u dostawców, dostęp do Systemu kontami z hasłem, kopie zapasowe codziennie, dostęp administracyjny tylko dla Podmiotu przetwarzającego.</li>
        <li>Pomaga Administratorowi odpowiadać na żądania osób (dostęp, sprostowanie, usunięcie, przeniesienie) w 7 dni roboczych od przekazania żądania na {KONTAKT_ZGLOSZENIA}.</li>
        <li>Zgłasza Administratorowi naruszenie ochrony danych bez zbędnej zwłoki, najpóźniej w 48 godzin od wykrycia, na adres {KLIENT.email}, z opisem: co się stało, jakie dane, jakie skutki, co zrobiono.</li>
        <li>Udostępnia Administratorowi informacje potrzebne do wykazania zgodności z art. 28 RODO i umożliwia audyt (po uzgodnieniu terminu, w godzinach pracy, nie częściej niż raz w roku, chyba że doszło do naruszenia).</li>
        <li>Nie używa danych Administratora do trenowania modeli AI ani do żadnych własnych celów.</li>
      </ol>

      <h2>§ 4. Podwykonawcy przetwarzania</h2>
      <p>Administrator zgadza się na korzystanie z poniższych podwykonawców. Każdy dostaje tylko dane potrzebne do swojej roli. Aktualna lista z opisem: salesbruno.pl/bezpieczenstwo.</p>
      <table className={u.tab}>
        <tbody>
          {PODWYKONAWCY.map(([kto, gdzie, co]) => (
            <tr key={kto}>
              <th>{kto}</th>
              <td>
                <b>{gdzie}</b>
                <br />
                {co}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ol>
        <li>Przekazania do USA opierają się na EU-US Data Privacy Framework albo na standardowych klauzulach umownych (SCC) z dostawcą.</li>
        <li>Zmiana albo dodanie podwykonawcy: Podmiot przetwarzający informuje mailem 14 dni wcześniej. Administrator może w tym czasie zgłosić sprzeciw; brak porozumienia = Administrator może wypowiedzieć umowę współpracy w części, której dotyczy podwykonawca.</li>
        <li>Podmiot przetwarzający odpowiada za podwykonawców jak za własne działania.</li>
      </ol>

      <h2>§ 5. Obowiązki Administratora</h2>
      <ol>
        <li>Ma podstawę prawną do przetwarzania danych swoich klientów i handlowców oraz informuje ich o przetwarzaniu (art. 13-14 RODO), w tym handlowców o nagrywaniu rozmów treningowych.</li>
        <li>Wpisuje do Systemu i do Bruno AI tylko dane potrzebne do sprzedaży; nie wpisuje danych szczególnych kategorii.</li>
        <li>Pilnuje haseł i dostępów swoich użytkowników; zgłasza odejście pracownika, żeby zablokować konto.</li>
      </ol>

      <h2>§ 6. Zakończenie</h2>
      <ol>
        <li>Po końcu umowy współpracy Administrator może pobrać dane z Systemu (eksport) albo przejąć System razem z danymi (§ 9 umowy współpracy).</li>
        <li>Podmiot przetwarzający kasuje swoje kopie danych Administratora w 14 dni od końca umowy współpracy, chyba że prawo każe je dłużej przechowywać (np. faktury).</li>
        <li>Nagrania rozmów treningowych są kasowane 14 dni po końcu Bruno AI, zgodnie z § 10 umowy współpracy.</li>
      </ol>

      <h2>§ 7. Postanowienia końcowe</h2>
      <ol>
        <li>Umowa obowiązuje tak długo, jak umowa współpracy, i dzieli jej los.</li>
        <li>Zmiany wymagają formy dokumentowej (e-mail) pod rygorem nieważności.</li>
        <li>W sprawach nieuregulowanych: RODO, ustawa o ochronie danych osobowych i Kodeks cywilny. Spory: sąd właściwy dla siedziby Podmiotu przetwarzającego.</li>
        <li>Umowa zawarta w formie dokumentowej razem z umową współpracy: akceptacja na stronie salesbruno.pl/oferta/ewatex (imię i nazwisko, data, adres IP).</li>
      </ol>

      <h2>Załącznik. Użytkownicy Administratora z dostępem</h2>
      <table className={u.tab}>
        <tbody>
          <tr>
            <th>{KLIENT.reprezentant}</th>
            <td>{KLIENT.email} · zarządzająca</td>
          </tr>
          {HANDLOWCZYNIE.map((h) => (
            <tr key={h.email}>
              <th>{h.imie}</th>
              <td>{h.email} · handlowiec</td>
            </tr>
          ))}
          <tr>
            <th>trzecia handlowczyni</th>
            <td>e-mail dosłany mailem · handlowiec</td>
          </tr>
        </tbody>
      </table>

      <div className={u.podpisy}>
        <div>
          <span>Administrator</span>
          {KLIENT.reprezentant}, {KLIENT.funkcja}
          <br />
          akceptacja na stronie razem z umową współpracy
        </div>
        <div>
          <span>Podmiot przetwarzający</span>
          {USLUGODAWCA.nazwa}
        </div>
      </div>
    </main>
  );
}
