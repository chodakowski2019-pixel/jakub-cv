"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import s from "@/components/bruno/webinar-lp.module.css";
import { zdarzenie } from "@/lib/analityka";

// 22.11.2026 (USER_001): strona zapisu na webinar DLA RODZICÓW o AI i przyszłości pracy (jaki zawód wybrać dziecku).
// „Szablon, czyli miejsca napisów i zdjęć, pozostają takie same, podmień tylko teksty, kolorystyka pod nasz nowy UX/UI”.
// Szablon = components/bruno/webinar-lp-zapis.tsx (salesbruno.pl/webinar, układ wg Aniserowicza: nagłówek, 4 punkty, przycisk,
// zdjęcie, prowadzący, plan 60 minut + karta z liczbą, pytania, karta końcowa, pop-up z formularzem, strona „dzięki”).
// Kolory: motyw academy + nakładka .mMarka (kolory strony jakubchodakowski.com). Zapis: /api/newsletter (zrodlo „rodzice”, double opt-in).
// Termin jeszcze nieustalony: TERMIN = null pokazuje „Termin podam mailem” zamiast daty i licznika. Po ustaleniu wpisać datę tutaj.

/** Start webinaru (czas polski), np. new Date("2026-12-09T19:00:00+01:00"). null = termin nieustalony. */
const TERMIN = null as Date | null;
const GODZINA = "19:00";
const DATA_TEKST = TERMIN ? TERMIN.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Warsaw" }) : "";
// 22.11 (USER_001): w pierwszym ekranie zdjęcie ze strony głównej (wystąpienie, CRASH Mondays) zamiast portretu.
const FOTO = "/talk-crash-mondays.png";
const FOTO_MALE = "/bruno/jakub-webinar-okno.jpg";
const NADAWCA_ADRES = "hello@jakubchodakowski.com";

const T = {
  badge: "Webinar dla rodziców",
  h1: "Jaki zawód ma przyszłość w erze AI?",
  h1Szary: "Co powiedzieć dziecku, które wybiera szkołę.",
  wstep: "W 60 minut, na żywo, dowiesz się:",
  punkty: [
    "które zawody AI zmieni najbardziej, a które zyskają",
    "jakich umiejętności szukają pracodawcy",
    "jak rozmawiać z dzieckiem o wyborze szkoły i studiów",
    "i odpowiem na Twoje pytania",
  ],
  przycisk: "Chcę zarezerwować miejsce »",
  // Na telefonie numer punktu zamiast czasu (jak w szablonie).
  plan: [
    ["0-10 min", "Co AI już dziś robi w pracy"],
    ["10-25 min", "Zawody, które się zmienią, i zawody, które zyskają"],
    ["25-40 min", "Umiejętności, których szukają pracodawcy"],
    ["40-50 min", "Jak rozmawiać z dzieckiem o wyborze szkoły i studiów"],
    ["50-60 min", "Pytania rodziców"],
  ] as [string, string][],
  prowadzacy: "Od 2022 roku uczę, jak korzystać z AI. Szkolę nauczycieli i firmy. Na webinarze pokażę, co AI zmienia w pracy i jak przygotować do tego dziecko.",
  // Karta z liczbą obok planu (w szablonie: koło 40/30/30). Liczby: World Economic Forum, Future of Jobs Report 2025 (styczeń 2025).
  liczba: {
    wielka: "170 mln",
    tekst: "nowych miejsc pracy do 2030 roku.",
    dalej: "92 mln zniknie. Na plusie 78 mln. Zmieni się to, czego szukają pracodawcy.",
    zrodlo: "World Economic Forum, Future of Jobs Report 2025 (styczeń 2025), badanie ponad 1 000 pracodawców",
  },
  faq: [
    ["Dla kogo jest ten webinar?", "Dla rodziców dzieci, które za kilka lat wybiorą szkołę średnią, studia albo zawód. Wiedza techniczna nie jest potrzebna."],
    ["Gdzie się odbywa?", "Online. Termin i link do spotkania przyjdą mailem po potwierdzeniu zapisu. Wystarczy telefon albo komputer, kamera jest zbędna."],
    ["Ile kosztuje?", "Nic. Webinar jest bezpłatny."],
  ] as [string, string][],
  okno: {
    tytul: "Zarezerwuj miejsce",
    pod: TERMIN ? `${DATA_TEKST}, ${GODZINA}, online` : "Online · 60 minut · bezpłatnie",
    przypomnienie: "Po zapisie kliknij „Potwierdzam zapis” w e-mailu. Wtedy wyślę termin i link do spotkania.",
    przycisk: "Zapisuję się »",
    klauzula: "Zapisując się, wyrażasz zgodę na otrzymywanie od Jakuba Chodakowskiego wiadomości o tym webinarze i o AI. Administratorem Twoich danych jest Jakub Chodakowski. Wypisanie jednym kliknięciem w każdym mailu.",
  },
};

function Logo() {
  return (
    <span className={s.logo}>
      Jakub<i className={s.kropka} />Chodakowski
    </span>
  );
}

function Stopka() {
  return (
    <footer className={s.stopka}>
      <span>Jakub Chodakowski · {NADAWCA_ADRES}</span>
      <a href="/polityka-prywatnosci">Polityka prywatności</a>
      <a href="/regulamin">Regulamin</a>
    </footer>
  );
}

/** Licznik do startu (jak w szablonie). Bez terminu: zdanie „Termin podam mailem”. */
function Zegar() {
  const [teraz, setTeraz] = useState<number | null>(null);
  useEffect(() => {
    if (!TERMIN) return;
    setTeraz(Date.now());
    const t = setInterval(() => setTeraz(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!TERMIN) return <div className={s.zegarKoniec}>Termin podam mailem</div>;
  const start = TERMIN.getTime();
  if (teraz !== null && teraz >= start + 3600_000) return <div className={s.zegarKoniec}>Webinar się zakończył</div>;
  if (teraz !== null && teraz >= start) return <div className={s.zegarKoniec}><i className={s.live} /> Trwa teraz, na żywo</div>;
  const r = teraz === null ? null : Math.max(0, Math.floor((start - teraz) / 1000));
  const pola: [number | null, string][] = [
    [r === null ? null : Math.floor(r / 86400), "dni"],
    [r === null ? null : Math.floor((r % 86400) / 3600), "godz."],
    [r === null ? null : Math.floor((r % 3600) / 60), "min"],
    [r === null ? null : r % 60, "sek."],
  ];
  return (
    <div className={s.zegar} aria-label="Czas do startu webinaru">
      {pola.map(([v, e]) => (
        <div className={s.zegarPole} key={e}>
          <b>{v === null ? "--" : String(v).padStart(2, "0")}</b>
          <span>{e}</span>
        </div>
      ))}
    </div>
  );
}

const KORZEN = `${s.root} ${s.zapis} ${s.zapisA} ${s.mAcad} ${s.mMarka} bruno-lp-jasne`;

export default function WebinarRodzice() {
  const router = useRouter();
  const [otwarte, setOtwarte] = useState(false);
  const [stan, setStan] = useState<"formularz" | "wysylam">("formularz");
  const [blad, setBlad] = useState("");

  const [pasek, setPasek] = useState(false);
  useEffect(() => {
    const gora = document.getElementById("cta-gora");
    const sprawdz = () => setPasek(gora ? gora.getBoundingClientRect().bottom < 0 : true);
    sprawdz();
    window.addEventListener("scroll", sprawdz, { passive: true });
    return () => window.removeEventListener("scroll", sprawdz);
  }, []);

  useEffect(() => {
    if (!otwarte) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOtwarte(false);
    document.addEventListener("keydown", esc);
    const poprzedni = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = poprzedni;
    };
  }, [otwarte]);

  async function wyslij(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBlad("");
    setStan("wysylam");
    const odp = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imie: f.get("imie"), email: f.get("email"), zrodlo: "rodzice", zgoda: true, www: f.get("www") }),
    }).catch(() => null);
    const d = await odp?.json().catch(() => null);
    if (d?.ok) {
      zdarzenie("zapis_webinar", { zrodlo: "rodzice" });
      router.push("/webinar-dla-rodzicow/dzieki");
      return;
    }
    setBlad(d?.blad ?? "Zapis się urwał. Spróbuj ponownie.");
    setStan("formularz");
  }

  const przycisk = (klasa = "") => (
    <button type="button" className={`${s.przycisk} ${s.przyciskDuzy} ${klasa}`} onClick={() => setOtwarte(true)}>
      {T.przycisk}
    </button>
  );
  const kiedy = TERMIN ? `${DATA_TEKST}, ${GODZINA} · online` : "Online · 60 minut · termin podam mailem";

  return (
    <div className={KORZEN}>
      <nav className={s.nav}>
        <Logo />
      </nav>

      <header className={`${s.hero} ${s.heroA}`}>
        <div className={s.bloby} aria-hidden>
          <i />
          <i />
          <i />
        </div>
        <div className={`${s.heroTekst} ${s.heroGora}`}>
          <span className={s.znaczek}>
            <i className={s.live} />
            {T.badge}
          </span>
          <h1 className={`${s.h1} ${s.h1Dwie}`}>
            <span className={s.h1Linia}>{T.h1}</span>
            <br />
            <span className={s.g}>{T.h1Szary}</span>
          </h1>
          <div className={`${s.heroFoto} ${s.heroFotoTel}`}>
            <img src={FOTO} alt="Jakub Chodakowski prowadzi wystąpienie o AI" width={1614} height={1058} style={{ objectPosition: "66% 40%" }} />
            <div className={s.heroFotoPodpis}>
              <b>Jakub Chodakowski</b>
              <span>prowadzi webinar</span>
            </div>
          </div>
          <p className={s.wstepZapis}>{T.wstep}</p>
          <ul className={s.punktyZapis}>
            {T.punkty.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <div className={s.ctaHero} id="cta-gora">
            {przycisk()}
            <p className={s.ctaData}>
              <i className={s.live} />
              {kiedy}
            </p>
          </div>
        </div>
        <div className={`${s.heroFoto} ${s.heroFotoKomp}`}>
          <img src={FOTO} alt="Jakub Chodakowski prowadzi wystąpienie o AI" width={1614} height={1058} style={{ objectPosition: "66% 40%" }} />
          <div className={s.heroFotoPodpis}>
            <b>Jakub Chodakowski</b>
            <span>prowadzi webinar</span>
          </div>
        </div>
      </header>

      <section className={`${s.sekcja} ${s.sekcjaZapis} ${s.sekcjaProwadzacy}`}>
        <div className={s.prowadzacyZapis}>
          <img src={FOTO_MALE} alt="Jakub Chodakowski" width={88} height={88} />
          <p>
            <b className={s.bioImie}>Jakub Chodakowski.</b> {T.prowadzacy}
          </p>
        </div>
      </section>

      <section className={`${s.sekcja} ${s.sekcjaZapis}`}>
        <div className={s.dwie}>
          <div>
            <h2 className={s.h2Duzy}>
              Plan <span className={s.g}>60 minut</span>
            </h2>
            <ol className={s.planZapis}>
              {T.plan.map(([g, h], i) => (
                <li key={h}>
                  <span className={s.planGodz}>
                    <span className={s.planCzas}>{g}</span>
                    <span className={s.planNr}>{i + 1}</span>
                  </span>
                  <span>{h}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className={s.liczba}>
            <div className={s.wielka}>{T.liczba.wielka}</div>
            <p>
              <b>{T.liczba.tekst}</b> {T.liczba.dalej}
            </p>
            <small>Źródło: {T.liczba.zrodlo}</small>
          </div>
        </div>
      </section>

      <section className={`${s.sekcja} ${s.sekcjaZapis}`}>
        <h2 className={s.h2Duzy}>Pytania</h2>
        <div className={s.faq}>
          {T.faq.map(([p, o]) => (
            <details key={p}>
              <summary>{p}</summary>
              <p>{o}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={`${s.sekcja} ${s.koniec}`}>
        <div className={s.koniecKarta}>
          <h2 className={s.h2Duzy}>
            {TERMIN ? `${DATA_TEKST[0].toUpperCase()}${DATA_TEKST.slice(1)}, ${GODZINA}.` : "60 minut, online."}
            <br />
            <span className={s.g}>Do zobaczenia.</span>
          </h2>
          <Zegar />
          {przycisk(s.przyciskDol)}
        </div>
      </section>

      <a className={`${s.pasekTel} ${pasek ? "" : s.pasekTelUkryty}`} href="#" tabIndex={pasek ? 0 : -1} aria-hidden={!pasek} onClick={(e) => (e.preventDefault(), setOtwarte(true))}>
        {T.przycisk}
      </a>

      <Stopka />

      {otwarte && (
        <div className={s.tlo} onClick={(e) => e.target === e.currentTarget && setOtwarte(false)} role="dialog" aria-modal="true" aria-labelledby="okno-tytul">
          <div className={s.okno}>
            <button type="button" className={s.oknoZamknij} onClick={() => setOtwarte(false)} aria-label="Zamknij">
              ×
            </button>
            <div className={s.oknoGlowa}>
              <img src={FOTO_MALE} alt="" width={56} height={56} />
              <div>
                <h2 className={s.h2} id="okno-tytul">{T.okno.tytul}</h2>
                <p className={s.oknoPod}>{T.okno.pod}</p>
              </div>
            </div>
            <p className={s.oknoPrzypomnienie}>{T.okno.przypomnienie}</p>
            <form onSubmit={wyslij} className={s.form}>
              <label className={s.pole}>
                <span>Imię</span>
                <input name="imie" required autoComplete="given-name" placeholder="np. Anna" autoFocus />
              </label>
              <label className={s.pole}>
                <span>E-mail</span>
                <input name="email" type="email" required autoComplete="email" placeholder="anna@gmail.com" />
              </label>
              <input name="www" tabIndex={-1} autoComplete="off" className={s.pulapka} aria-hidden />
              {blad && <p className={s.blad}>{blad}</p>}
              <button className={`${s.przycisk} ${s.przyciskDuzy}`} disabled={stan === "wysylam"}>
                {stan === "wysylam" ? "Zapisuję…" : T.okno.przycisk}
              </button>
              <p className={s.klauzula}>
                {T.okno.klauzula}{" "}
                <a href="/polityka-prywatnosci" target="_blank">
                  Polityka prywatności
                </a>
                .
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/** Po zapisie: „Dzięki, to prawie wszystko” (szablon). Po kliknięciu w link z maila (?potwierdzone=1): „Gotowe. Masz miejsce.” */
export function WebinarRodziceDzieki({ potwierdzone }: { potwierdzone: boolean }) {
  return (
    <div className={KORZEN}>
      <nav className={s.nav}>
        <Logo />
      </nav>
      <main className={s.dzieki}>
        <div className={s.ptaszek}>✓</div>
        {potwierdzone ? (
          <>
            <h1 className={`${s.h1} ${s.h1Dwie}`}>
              Gotowe. <span className={s.pom}>Masz miejsce.</span>
            </h1>
            <p className={s.dziekiLead}>
              Webinar dla rodziców o AI i zawodach przyszłości.
              <br />
              Termin i link do spotkania przyjdą mailem.
            </p>
            <ol className={s.dziekiKroki}>
              <li>
                <b>Dodaj <code>{NADAWCA_ADRES}</code> do kontaktów.</b> Wtedy mail z terminem i linkiem nie trafi do spamu ani do „Ofert”.
              </li>
            </ol>
          </>
        ) : (
          <>
            <h1 className={`${s.h1} ${s.h1Dwie}`}>
              Dzięki, to <span className={s.pom}>prawie</span> wszystko!
            </h1>
            <p className={s.dziekiLead}>
              Miejsce na webinarze czeka na Ciebie.
              <span className={s.dziekiOdstep}>Została 1 rzecz:</span>
            </p>
            <ol className={s.dziekiKroki}>
              <li>
                <b>Znajdź e-mail z adresu <code>{NADAWCA_ADRES}</code> i kliknij „Potwierdzam zapis”.</b> Właśnie wyszedł. Jeśli go nie widzisz, sprawdź „Oferty” i spam. Bez kliknięcia nie wyślę terminu ani linku.
              </li>
            </ol>
          </>
        )}
      </main>
      <Stopka />
    </div>
  );
}
