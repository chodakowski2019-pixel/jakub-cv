import type { Metadata } from "next";
import Link from "next/link";
import { Wezwanie } from "../../blog/widok";
import { Zapis } from "../zapis";
import { AUTOR, BAZA, DOMENA, PODGLAD } from "@/lib/blog-ai";
import { BAZA_NARZEDZI, CENNIKI, kategorieZNarzedziami, narzedzie, narzedziaKategorii, wszystkieNarzedzia } from "@/lib/narzedzia-ai";

// 26.11.2026 (USER_001: „ok. rob”, wzór z case promptowy.com, baza SEO plik 33, wzór 3): JEDEN stały adres z cenami
// wszystkich narzędzi z katalogu. Strona składa się sama z pól `cena_od`, `plan_firmowy`, `sprawdzono` w content/narzedzia-ai.
// Nowy wpis albo nowa cena w pliku narzędzia = nowa wersja tej strony bez ręcznej pracy.
// Rytm: 1. dnia miesiąca sprawdzić u producentów wpisy starsze niż 30 dni (nauka/STAN.md agenta /seo).
// Adres bez roku i miesiąca (zasada karty: stały adres), miesiąc w tytule liczony z najnowszej daty sprawdzenia.
// SKROT niżej: liczby wzięte z wpisów chatgpt, claude-anthropic, gemini, microsoft-copilot. Zmiana ceny w tych plikach = popraw SKROT.

const ADRES = `${BAZA_NARZEDZI}/ceny`; // stały adres
const GLOWNE = ["chatgpt", "claude-anthropic", "gemini", "microsoft-copilot"];

const miesiacRok = (d: string) => new Date(d).toLocaleDateString("pl-PL", { month: "long", year: "numeric" });
const dataPoPolsku = (d: string) => new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
const dataKrotka = (d: string) => new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "numeric", year: "numeric" });

function dane() {
  const wszystkie = wszystkieNarzedzia();
  const daty = wszystkie.map((n) => n.sprawdzono).sort();
  return { wszystkie, najnowsza: daty.at(-1) ?? "2026-11-25", najstarsza: daty[0] ?? "2026-11-21" };
}

export async function generateMetadata(): Promise<Metadata> {
  const { wszystkie, najnowsza } = dane();
  const tytul = `Ile kosztują narzędzia AI dla firm? Ceny ${wszystkie.length} narzędzi (${miesiacRok(najnowsza)})`;
  const opis = `Ceny planów dla firm w ${wszystkie.length} narzędziach AI: ChatGPT, Claude, Gemini, Copilot i inne. Kwoty ze stron producentów, przy każdej data sprawdzenia.`;
  return {
    title: { absolute: tytul },
    description: opis,
    ...(PODGLAD ? { robots: { index: false, follow: false } } : { alternates: { canonical: `${DOMENA}${ADRES}` } }),
    openGraph: { title: tytul, description: opis, type: "article", modifiedTime: najnowsza, url: `${DOMENA}${ADRES}`, locale: "pl_PL" },
    twitter: { card: "summary_large_image", title: tytul, description: opis },
  };
}

const SKROT =
  "ChatGPT Business kosztuje 25 USD za osobę miesięcznie, Claude Team tyle samo, a przy płatności rocznej oba po 20 USD. Gemini jest w Google Workspace od 31,50 zł netto. Copilot to dodatek do Microsoft 365 za 18,20 € netto.";

const FAQ: { pytanie: string; odpowiedz: string }[] = [
  {
    pytanie: "Czy ceny na tej stronie są z VAT?",
    odpowiedz:
      "Nie, w większości to ceny netto, tak jak podaje producent. Firmy zagraniczne podają kwoty w USD albo EUR bez podatku. Przy każdym narzędziu jest dokładny zapis ze strony producenta.",
  },
  {
    pytanie: "Jak często ceny są aktualizowane?",
    odpowiedz:
      "Raz w miesiącu sprawdzam u producentów wpisy starsze niż 30 dni. Data przy każdym wierszu pokazuje dzień ostatniego sprawdzenia. Ten sam adres strony zostaje na stałe.",
  },
  {
    pytanie: "Który asystent AI dla firmy jest najtańszy?",
    odpowiedz:
      "To zależy od pakietu biurowego, którego firma już używa. Gemini jest w cenie Google Workspace, a Copilot to płatny dodatek do Microsoft 365. ChatGPT i Claude to osobne abonamenty, niezależne od pakietu.",
  },
  {
    pytanie: "Dlaczego plan dla jednej osoby nie wystarcza firmie?",
    odpowiedz:
      "Plan dla jednej osoby to konto prywatne pracownika. Plany dla firm mają wspólne rozliczenie, zarządzanie kontami i osobne zasady dotyczące danych. Szczegóły są na stronie każdego narzędzia w kolumnie z nazwą.",
  },
];

export default function Page() {
  const { wszystkie, najnowsza, najstarsza } = dane();
  const kategorie = kategorieZNarzedziami();
  const glowne = GLOWNE.map((s) => narzedzie(s)).filter((n) => n !== undefined);
  const zDarmowym = wszystkie.filter((n) => n.cennik === "darmowy-plan").length;
  const wPakiecie = wszystkie.filter((n) => n.cennik === "w-pakiecie").length;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Ile kosztują narzędzia AI dla firm? Ceny ${wszystkie.length} narzędzi`,
    dateModified: najnowsza,
    inLanguage: "pl-PL",
    mainEntityOfPage: `${DOMENA}${ADRES}`,
    author: { "@type": "Person", name: AUTOR.imie, url: DOMENA },
  };
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Ceny narzędzi AI dla firm",
    itemListElement: wszystkie.map((n, i) => ({ "@type": "ListItem", position: i + 1, name: n.nazwa, url: `${DOMENA}${BAZA_NARZEDZI}/${n.slug}` })),
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.pytanie, acceptedAnswer: { "@type": "Answer", text: f.odpowiedz } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <header className="bai-w3 bai-art-glowa">
        <h1 className="bai-art-h1">
          Ile kosztują narzędzia AI dla firm? Ceny {wszystkie.length} narzędzi ({miesiacRok(najnowsza)})
        </h1>
        <p className="bai-art-opis">{SKROT}</p>
        <nav className="bai-mono bai-okruszki">
          <Link href={BAZA_NARZEDZI}>Narzędzia AI</Link>
          <span>/</span>
          <span>Ceny</span>
        </nav>
        <p className="bai-mono bai-sprawdzono">
          Sprawdzono u producentów: od <time dateTime={najstarsza}>{dataPoPolsku(najstarsza)}</time> do{" "}
          <time dateTime={najnowsza}>{dataPoPolsku(najnowsza)}</time>
        </p>
        <div className="bai-skrot">
          <p className="bai-mono bai-skrot-etykieta">W skrócie</p>
          <p className="bai-skrot-tekst">
            {wszystkie.length} narzędzi AI, ceny planów dla firm ze stron producentów. {zDarmowym} ma darmowy plan, {wPakiecie} jest w cenie pakietu
            biurowego. Ceny w USD i EUR są netto. Przy każdym wierszu data sprawdzenia.
          </p>
        </div>
      </header>

      <div className="bai-w3">
        <article className="bai-tresc">
          <h2 id="asystenci">Ile kosztuje ChatGPT, Claude, Gemini i Copilot dla firmy?</h2>
          <p>
            Wszystkie cztery mają plan dla firm. ChatGPT i Claude to osobne abonamenty, Gemini i Copilot są związane z pakietem biurowym.
          </p>
          <div className="bai-tabela">
            <table>
              <thead>
                <tr>
                  <th>Narzędzie</th>
                  <th>Plan dla firm</th>
                  <th>Sprawdzono</th>
                </tr>
              </thead>
              <tbody>
                {glowne.map((n) => (
                  <tr key={n.slug}>
                    <td>
                      <Link href={`${BAZA_NARZEDZI}/${n.slug}`}>{n.nazwa}</Link>
                    </td>
                    <td>{n.planFirmowy}</td>
                    <td>{dataKrotka(n.sprawdzono)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Szczegóły ChatGPT: <Link href={`${BAZA}/chatgpt-dla-firm-cena`}>ile kosztuje ChatGPT dla firm</Link>.
          </p>

          {kategorie.map((k) => {
            const lista = narzedziaKategorii(k.slug);
            return (
              <section key={k.slug}>
                <h2 id={k.slug}>Ile kosztują narzędzia z kategorii „{k.nazwa}”?</h2>
                <p>
                  {k.opis} W tabeli {lista.length} {lista.length === 1 ? "narzędzie" : lista.length < 5 ? "narzędzia" : "narzędzi"}.
                </p>
                <div className="bai-tabela">
                  <table>
                    <thead>
                      <tr>
                        <th>Narzędzie</th>
                        <th>Cena od</th>
                        <th>Plan dla firm</th>
                        <th>Model</th>
                        <th>Sprawdzono</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lista.map((n) => (
                        <tr key={n.slug}>
                          <td>
                            <Link href={`${BAZA_NARZEDZI}/${n.slug}`}>{n.nazwa}</Link>
                          </td>
                          <td>{n.cenaOd}</td>
                          <td>{n.planFirmowy}</td>
                          <td>{CENNIKI[n.cennik]}</td>
                          <td>{dataKrotka(n.sprawdzono)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}

          <h2 id="jak-czytac">Jak czytać ceny narzędzi AI?</h2>
          <p>Każda kwota to zapis ze strony producenta w dniu z ostatniej kolumny.</p>
          <ul>
            <li>
              <strong>Waluta.</strong> Firmy zagraniczne podają ceny w USD albo EUR, zwykle bez VAT.
            </li>
            <li>
              <strong>Płatność roczna.</strong> Wiele planów jest tańszych przy płatności z góry za rok. Wtedy w tabeli są obie kwoty.
            </li>
            <li>
              <strong>„Cena po kontakcie”.</strong> Plan Enterprise zwykle nie ma ceny na stronie. Producent podaje ją po rozmowie.
            </li>
            <li>
              <strong>Promocje.</strong> Obniżki z terminem są osobno, na stronie <Link href={`${BAZA_NARZEDZI}/black-week`}>promocji Black Week</Link>.
            </li>
          </ul>

          <h2 id="pytania">Najczęstsze pytania</h2>
          {FAQ.map((f) => (
            <section key={f.pytanie}>
              <h3>{f.pytanie}</h3>
              <p>{f.odpowiedz}</p>
            </section>
          ))}
        </article>

        <Zapis skad="ceny" tytul="Zmiany cen i promocje narzędzi AI na e-mail" />

        <Wezwanie />
        <div className="bai-dol" />
      </div>
    </>
  );
}
