import Link from "next/link";
import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto } from "@/lib/bruno/db";
import { tSerwer } from "@/lib/bruno/jezyk-serwer";
import { ANKIETA_DNI, OBSZARY, OBSZARY_WYNIK, policz } from "@/lib/bruno/ankieta";
import { ankietyKonta } from "@/lib/bruno/ankieta-db";
import AnkietaForm from "@/components/bruno/ankieta-form";
import KoloWyniku from "@/components/bruno/kolo-wyniku";

export const dynamic = "force-dynamic";

// 21.10 (USER_001): ankieta Mazura. Brak wypełnienia albo ostatnie > 30 dni temu = formularz
// (panel tu prowadzi: app/bruno/layout.tsx + UkladZloty). Świeże wypełnienie = wynik, zmiana
// od poprzedniego razu, wskazówka Mazura do najsłabszego pytania, data następnej ankiety.

export default async function BrunoAnkietaPage() {
  const email = await zalogowanyEmail();
  if (!email) redirect("/bruno");
  const konto = await pobierzKonto(email);
  if (!konto) redirect("/bruno");
  const { t, jezyk } = await tSerwer();
  const [ost, poprz] = await ankietyKonta(email, 2);
  const dzien = 24 * 3600 * 1000;
  const swieza = ost && Date.now() - new Date(ost.utworzono).getTime() <= ANKIETA_DNI * dzien;

  if (!swieza) {
    return (
      <div className="flex flex-col gap-6 py-6">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="bruno-h1 text-[1.9rem] sm:text-[2.4rem]">
            {t("Before you", "Zanim")} <span className="bruno-gradient-tekst">{t("start", "zaczniesz")}</span>
          </h1>
          <p className="mt-3 opacity-80">{t("17 questions about your approach to selling", "17 pytań o Twoje podejście do sprzedaży")}</p>
          <p className="opacity-80">{t("Takes 5 minutes", "Wypełnisz w 5 minut")}</p>
        </div>
        <AnkietaForm />
      </div>
    );
  }

  const { najslabsze } = policz(ost.odpowiedzi);
  const nastepna = new Date(new Date(ost.utworzono).getTime() + ANKIETA_DNI * dzien).toLocaleDateString(jezyk === "pl" ? "pl-PL" : "en-US", { day: "numeric", month: "long" });
  const zmiana = (a: number, b?: number) => (b === undefined ? null : a - b);

  // 21.10 USER: wynik i obszary w kółkach, wskazówka bez podpisu autora, jeden ekran bez przewijania.
  return (
    <div className="flex flex-col gap-5 py-6 max-w-2xl w-full mx-auto">
      <div className="text-center">
        <h1 className="bruno-h1 text-[1.9rem] sm:text-[2.4rem]">
          {t("Your", "Twój")} <span className="bruno-gradient-tekst">{t("result", "wynik")}</span>
        </h1>
        {poprz && <p className="opacity-60 text-sm mt-1">{t("Change since last time", "Zmiana od ostatniego razu")}</p>}
      </div>

      <section className="bruno-szklo rounded-3xl p-6 sm:p-8 flex flex-col items-center gap-7">
        <KoloWyniku wartosc={ost.wynik} rozmiar={188} grubosc={12} duze zmiana={zmiana(ost.wynik, poprz?.wynik)} />
        <div className="grid grid-cols-3 gap-3 sm:gap-6 w-full">
          {OBSZARY_WYNIK.map((ob) => (
            <KoloWyniku key={ob} wartosc={ost.obszary[ob]} rozmiar={92} grubosc={7} podpis={OBSZARY[ob][jezyk]} zmiana={zmiana(ost.obszary[ob], poprz?.obszary?.[ob])} />
          ))}
        </div>
      </section>

      {najslabsze?.wskazowka && (
        <section className="bruno-szklo rounded-3xl p-6 sm:p-8 flex flex-col gap-3">
          <p className="bruno-etykieta opacity-70">{t("Work on this first", "Nad tym popracuj najpierw")}</p>
          <p className="text-lg sm:text-xl font-semibold leading-snug">{najslabsze.wskazowka[jezyk]}</p>
          <p className="opacity-55 text-sm">„{najslabsze.tekst[jezyk]}”</p>
        </section>
      )}

      <Link href="/bruno/panel" className="bruno-przycisk text-base py-3 text-center">
        {t("Start practicing →", "Zaczynam trening →")}
      </Link>
      <p className="text-center text-xs opacity-50">
        {t("Next survey:", "Następna ankieta:")} {nastepna}
      </p>
    </div>
  );
}
