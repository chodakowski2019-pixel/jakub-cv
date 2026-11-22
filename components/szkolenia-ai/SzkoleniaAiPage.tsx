import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Formularz from "./Formularz";
import Ruch from "./Ruch";
import Druk from "./Druk";
import Gwiazdy from "./Gwiazdy";
import Orbita from "./Orbita";
import Kolory from "./Kolory";
import Kula from "./Kula";
import Loga from "./Loga";
import { UstawieniaCookies } from "@/components/analityka/Zgoda";
import { PALETY, STARE, klasyGen, zmienne } from "./motywy";
import {
  BADANIE, BILET, CENA, CENY, DLA_KOGO, FORMULARZ, FOTO, HERO, HERO_TAG, KONTAKT, PROWADZACY, PROWADZACY_LICZBY,
  PRZEBIEG, PYTANIA, ROZKLAD, SCHODY, SCHODY_OPIS, SCHODY_TAKZE, SYTUACJA, zl,
} from "./dane";
import "./szkolenia-ai.css";
import "./szkolenia-ai-kivo.css";

// Szkolenie AI dla firm. Wersja 3 wyglądu (21.11.2026, USER_001: „w takim stylu” jak szablon Framer „Dominion”).
// Styl: czerń z wolno płynącymi gwiazdami i smugą światła, lekki krój Geist, drobne napisy krojem mono,
// cienkie linie z „ząbkiem” między sekcjami, obrys w kształcie pocisku, schody, orbita, taśma z napisami,
// wielki napis w stopce. Odtworzony jest sam styl: treść, zdjęcia i rysunki są nasze.
// Poprzednie wersje: _wersja-rozklad/ (żółta) i _wersja-2-jasna/.
// Komponent serwerowy. W przeglądarce działają: Gwiazdy, Orbita, Formularz, Ruch, Druk.
// 21.11.2026, czytelność: większy i jaśniejszy tekst, mniej drobnych napisów wielkimi literami,
// kolejność problem → dlaczego szkolenie → efekt, teza razem ze swoim dowodem, pewniki nad przyciskiem przy cenie,
// „co dzieje się po wysłaniu” przy formularzu.

// Twarda spacja: jednoliterowe słowa i liczby nie łamią się między wierszami.
const TS = String.fromCharCode(160);
const s = (t: string) => t.replace(/(^|\s)([wzioauWZIOAU])\s/g, `$1$2${TS}`).replace(/(\d)\s(\d{3})(?!\d)/g, `$1${TS}$2`).replace(/(\d)\s(r\.)/g, `$1${TS}$2`);
const kropka = (t: string) => (/[.?!]$/.test(t) ? t : `${t}.`);
const zm = (i: number) => ({ "--i": i }) as CSSProperties;

const Strzalka = () => (
  <svg className="strz" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);
const Ptaszek = () => (
  <svg className="znak tak" viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="10" r="9.5" />
    <path d="M6 10.4l2.6 2.6 5.4-5.8" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Krzyzyk = () => (
  <svg className="znak nie" viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="10" r="9.5" />
    <path d="M7.2 7.2l5.6 5.6M12.8 7.2l-5.6 5.6" fill="none" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// Zdanie, którego słowa rozjaśniają się po kolei, gdy wjedzie na ekran.
// Słowa po pierwszym zdaniu mają klasę „dwa”: w wersji 4 (styl Kivo) druga część nagłówka jest szara.
function Zdanie({ tekst }: { tekst: string }) {
  let poKropce = false;
  return (
    <span className="zd">
      {s(tekst).split(" ").map((w, i) => {
        const klasa = poKropce ? "sl dwa" : "sl";
        if (/[.?!]$/.test(w)) poKropce = true;
        return <span className={klasa} style={zm(i)} key={i}>{w} </span>;
      })}
    </span>
  );
}

// Cienka linia z „ząbkiem” między sekcjami.
function Kreska({ w = "lewo" }: { w?: "lewo" | "prawo" }) {
  return (
    <div className={`kreska ${w}`} aria-hidden="true">
      <span />
      <svg viewBox="0 0 28 13" fill="none"><path d="M0 .5H7L21 12.5H28" /></svg>
      <span />
    </div>
  );
}

// Obrys w kształcie pocisku (hero i kontakt). Rozciąga się do rozmiaru pudełka, kreska zostaje cienka.
const Obrys = () => (
  <svg className="obrys" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">
    <path d="M28 .5H600C720 .5 790 70 880 150C950 212 999.5 240 999.5 300C999.5 360 950 388 880 450C790 530 720 599.5 600 599.5H28C12.8 599.5 .5 587 .5 572V28C.5 13 12.8 .5 28 .5Z" />
  </svg>
);

// nad = mała etykieta nad nagłówkiem; bez niej sekcja zaczyna się od razu od nagłówka.
function Glowa({ nad, tytul, id, opis, children }: { nad?: string; tytul: string; id: string; opis?: string; children?: ReactNode }) {
  return (
    <div className="glowa">
      <div>
        {nad && <p className="mono nad">{nad}</p>}
        <h2 id={id}><Zdanie tekst={kropka(tytul)} /></h2>
      </div>
      {(opis || children) && (
        <div className="bok poj">
          {opis && <p>{s(opis)}</p>}
          {children}
        </div>
      )}
    </div>
  );
}

// Liczba ze źródłem: duża liczba, zdanie, pod spodem skąd pochodzi.
function Liczba({ n, opis, zrodlo }: { n: string; opis: string; zrodlo: string }) {
  return (
    <div className="liczba poj">
      <b>{s(n)}</b>
      <p>{s(opis)}</p>
      <small>Źródło: {zrodlo}</small>
    </div>
  );
}

// motyw = identyfikator kolorystyki z motywy.ts. Układ i treść są te same, zmieniają się tylko kolory.
// Palety (PALETY) wyliczają się z 2 kolorów i materiału: klasa .gen + zmienne na korzeniu.
// Wcześniejsze wersje (STARE: ciemny, jasny, tytan, szklo, grafit) to osobne klasy w arkuszu.
// przelacznik = panel wyboru kolorów, tylko w podglądzie.
function wyglad(motyw: string): { klasy: string; style?: CSSProperties } {
  const p = PALETY.find((x) => x.id === motyw);
  if (p) return { klasy: ` ${klasyGen(p.b, p.m).join(" ")}`, style: zmienne(p.b, p.a) as CSSProperties };
  if (motyw === "kivo") return { klasy: " kivo" };
  const st = STARE.find((x) => x.id === motyw);
  return { klasy: st && st.klasy.length ? ` ${st.klasy.join(" ")}` : "" };
}

export default function SzkoleniaAiPage({ fontClass, motyw = "ciemny", przelacznik = false }: { fontClass: string; motyw?: string; przelacznik?: boolean }) {
  const w = wyglad(motyw);
  // Wersja 4 wyglądu (21.11.2026, USER_001: „zrób w takim stylu” + link do strony Kivo): jasne ciepłe tło, pomarańcz,
  // cienkie duże nagłówki, białe zaokrąglone karty, kula z płytek. Ma własny pierwszy ekran i arkusz szkolenia-ai-kivo.css.
  const kivo = motyw === "kivo";
  const bloki = ROZKLAD.wiersze.filter((w) => w.opis);
  const przerwy = ROZKLAD.wiersze.filter((w) => !w.opis);

  return (
    <div className={`sza${w.klasy} ${fontClass}`} style={w.style} lang="pl">
      <Ruch />
      {przelacznik && <Kolory start={motyw} />}

      <header className="gora">
        <a href="/" className="marka">Jakub Chodakowski</a>
        {/* USER_001 21.11.2026: linki „Rozkład dnia, Prowadzący, Cena, Pytania” usunięte z paska. Zostaje nazwisko i przycisk. */}
        <a href="#formularz" className="btn maly">{HERO.cta}</a>
      </header>

      <main>
        {/* HERO */}
        {kivo ? (
          <section className="hero k-hero" aria-labelledby="h1">
            <div className="k-gora">
              <div>
                <p className="mono nad">{HERO.nad}</p>
                <h1 id="h1">
                  <span>{s(HERO.h1[0])}</span> <span>{s(HERO.h1[1])}</span>
                </h1>
              </div>
              <div>
                <div className="akcje">
                  <a href="#formularz" className="btn" data-cta="hero">{HERO.cta} <Strzalka /></a>
                  <a href="#rozklad" className="btn puste">{HERO.cta2}</a>
                </div>
                <p className="pod">{HERO.pod}</p>
              </div>
            </div>
            <div className="k-bento">
              {/* USER_001 21.11.2026: zdjęcie z wystąpienia „powinno być na początku”. */}
              <figure className="kadr">
                <Image src={FOTO.src} alt={FOTO.alt} fill sizes="(max-width: 1024px) 100vw, 560px" loading="eager" fetchPriority="high" />
                <figcaption>{FOTO.podpis}</figcaption>
                <p className="kadr-napis" aria-hidden="true">O AI i danych</p>
              </figure>
              <ol className="k-kroki" aria-label="Co zostaje po szkoleniu">
                {SCHODY.map((x, i) => (
                  <li key={x.t}>
                    <span className="k-nr"><b>0{i + 1}</b> / 0{SCHODY.length}</span>
                    <span className="k-znak"><Ptaszek />Zostaje</span>
                    <h3>{x.t}</h3>
                    <p>{s(x.o)}</p>
                  </li>
                ))}
              </ol>
              <div className="k-pom">
                <p className="k-pom-nad">{s(HERO_TAG)}</p>
                <Kula className="k-kula" />
                <dl className="k-fakty">
                  {BILET.map((x) => (
                    <div key={x.k}>
                      <dt>{x.k}</dt>
                      <dd>{s(x.w)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </section>
        ) : (
          <section className="hero" aria-labelledby="h1">
            <Gwiazdy className="gwiazdy" />
            <div className="smuga" aria-hidden="true" />
            <div className="ziarno" aria-hidden="true" />
            <div className="hero-w">
              <div className="pocisk">
                <Obrys />
                <p className="mono nad">{HERO.nad}</p>
                <h1 id="h1">
                  <span>{s(HERO.h1[0])}</span> <span>{s(HERO.h1[1])}</span>
                </h1>
                <div className="akcje">
                  <a href="#formularz" className="btn" data-cta="hero">{HERO.cta}</a>
                  <a href="#rozklad" className="btn puste">{HERO.cta2}</a>
                </div>
              </div>
              {/* USER_001 21.11.2026: „to powinno być na początku”. Zdjęcie z wystąpienia stoi w pierwszym ekranie, obok nagłówka. */}
              <figure className="kadr">
                <Image src={FOTO.src} alt={FOTO.alt} fill sizes="(max-width: 1024px) 100vw, 620px" loading="eager" fetchPriority="high" />
                <figcaption className="mono">{FOTO.podpis}</figcaption>
                <p className="kadr-napis" aria-hidden="true">O AI i danych</p>
              </figure>
            </div>
            {/* USER_001 21.11.2026: tabliczka „1 dzień. Do 12 osób. Od 3 900 zł netto.” i dopisek o formularzu usunięte z pierwszego ekranu. */}
          </section>
        )}

        {/* SYTUACJA: problem */}
        <section className="sek" aria-labelledby="sytuacja">
          <div className="sek-w">
            {/* USER_001 21.11.2026: etykieta „Sytuacja” nad nagłówkiem usunięta. */}
            <Glowa tytul={SYTUACJA.tytul} id="sytuacja" opis={SYTUACJA.opis} />
            {/* USER_001 21.11.2026: „to trzeba w kafelki dać”. 4 sytuacje jako kafelki 2 × 2 (klasa kafle). */}
            <ol className="wiersze kafle">
              {SYTUACJA.wiersze.map((w, i) => (
                <li className="poj" key={w.co}>
                  <span className="mono nr">0{i + 1}</span>
                  <h3>{s(w.co)}</h3>
                  <p>{s(w.skutek)}</p>
                </li>
              ))}
            </ol>
            {/* USER_001 21.11.2026: liczby GUS (39,8% Polaków, 17,8% firm) usunięte z tej sekcji. */}
          </div>
        </section>
        <Kreska />

        {/* TEZA: dlaczego szkolenie + dowód z badania */}
        <section className="sek teza" aria-labelledby="teza">
          <div className="sek-w">
            <p className="mono nad">{BADANIE.nad}</p>
            <h2 className="duze" id="teza"><Zdanie tekst={BADANIE.wniosek} /></h2>
            <div className="liczby">
              {BADANIE.liczby.map((l) => <Liczba key={l.n} {...l} />)}
            </div>
          </div>
        </section>
        <Kreska w="prawo" />

        {/* CO ZOSTAJE: schody */}
        <section className="sek" aria-labelledby="efekt">
          <div className="sek-w">
            <Glowa nad="Efekt" tytul="Co zostaje w firmie po szkoleniu." id="efekt" opis={SCHODY_OPIS}>
              <a href="#formularz" className="btn puste maly">{HERO.cta}</a>
            </Glowa>
            <ol className="schody">
              {SCHODY.map((x, i) => (
                <li className="poj" style={zm(i)} key={x.t}>
                  <span className="mono">0{i + 1}</span>
                  <h3>{x.t}</h3>
                  <p>{s(x.o)}</p>
                  <i aria-hidden="true" />
                </li>
              ))}
            </ol>
            <p className="mono takze-nad">Do tego</p>
            <ul className="takze">
              {SCHODY_TAKZE.map((x) => (
                <li className="poj" key={x.t}><b>{s(x.t)}</b> {s(x.o)}</li>
              ))}
            </ul>
          </div>
        </section>
        <Kreska />

        {/* PROWADZĄCY */}
        <section className="sek" aria-labelledby="prowadzacy">
          <div className="sek-w firma">
            <div className="wyciecie poj">
              <Image src={PROWADZACY.portret.src} alt={PROWADZACY.portret.alt} fill sizes="(max-width: 1024px) 80vw, 460px" />
            </div>
            <div>
              <p className="mono nad">{PROWADZACY.tytul}</p>
              <h2 id="prowadzacy"><Zdanie tekst={kropka(PROWADZACY.imie)} /></h2>
              <p className="opis poj">{s(PROWADZACY.lead)}</p>
              <dl className="trojka poj">
                {PROWADZACY_LICZBY.map((l) => (
                  <div key={l.n}>
                    <dd>{l.n}</dd>
                    <dt>{s(l.o)}</dt>
                  </div>
                ))}
              </dl>
              <a className="btn puste maly" href={PROWADZACY.cert.src} target="_blank" rel="noopener noreferrer">Certyfikat AI for Managers</a>
            </div>
          </div>
          <div className="sek-w">
            <ol className="wiersze zycie">
              {PROWADZACY.os.map((o) => (
                <li className="poj" key={o.co}>
                  <span className="mono nr">{o.rok}</span>
                  <p>{s(o.co)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* LOGA NARZĘDZI (w miejscu przewijanej taśmy z działami i narzędziami; USER_001 21.11.2026) */}
        <Loga />
        <Kreska w="prawo" />

        {/* ROZKŁAD DNIA: orbita */}
        <section className="sek" aria-labelledby="rozklad">
          <div className="sek-w">
            <Glowa nad={ROZKLAD.nad} tytul={ROZKLAD.tytul} id="rozklad" opis={ROZKLAD.uwaga}>
              <a href="#formularz" className="btn puste maly">{HERO.cta}</a>
            </Glowa>
            <Orbita bloki={bloki} />
            <ol className="lista-dnia">
              {ROZKLAD.wiersze.map((w) =>
                w.opis ? (
                  <li key={w.g}>
                    <time>{w.g}</time>
                    <div>
                      <h3>{w.blok}</h3>
                      <p>{s(w.opis)}</p>
                      <p className="zostaje"><b>Zostaje:</b> {s(w.zostaje ?? "")}</p>
                    </div>
                  </li>
                ) : (
                  <li className="przerwa" key={w.g}>
                    <time>{w.g}</time>
                    <span>{w.blok}</span>
                  </li>
                ),
              )}
            </ol>
            <p className="przerwy">{przerwy.map((p) => `${p.blok} ${p.g}`).join(" · ")}</p>
          </div>
        </section>
        <Kreska />

        {/* PRZEBIEG */}
        <section className="sek" aria-labelledby="przebieg">
          <div className="sek-w">
            <Glowa nad="Współpraca" tytul={PRZEBIEG.tytul} id="przebieg" opis={PRZEBIEG.opis} />
            <ol className="wiersze kroki">
              {PRZEBIEG.kroki.map((k, i) => (
                <li className="poj" key={k.tytul}>
                  <span className="mono nr">0{i + 1}</span>
                  <div>
                    <h3>{k.tytul}</h3>
                    <p className="meta">{s(k.meta)}</p>
                  </div>
                  <p>{s(k.co)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
        <Kreska w="prawo" />

        {/* DLA KOGO */}
        <section className="sek" aria-labelledby="dla-kogo">
          <div className="sek-w">
            <Glowa nad="Dopasowanie" tytul={DLA_KOGO.tytul} id="dla-kogo" />
            <div className="dwie">
              <div className="panel poj">
                <h3 className="panel-t">{DLA_KOGO.takTytul}</h3>
                <ul className="lista">
                  {DLA_KOGO.tak.map((t) => (
                    <li key={t}><Ptaszek /><span>{s(t)}</span></li>
                  ))}
                </ul>
              </div>
              <div className="panel poj">
                <h3 className="panel-t">{DLA_KOGO.nieTytul}</h3>
                <ul className="lista">
                  {DLA_KOGO.nie.map((t) => (
                    <li key={t}><Krzyzyk /><span>{s(t)}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
        <Kreska />

        {/* CENA */}
        <section className="sek" aria-labelledby="cena">
          <div className="sek-w">
            <Glowa nad="Cena" tytul={CENA.tytul} id="cena" opis={CENA.netto} />
            <div className="cennik">
              {CENA.formy.map((f) => (
                <div className={`panel poj${f.glowna ? " glowna" : ""}`} key={f.forma}>
                  <h3 className="panel-t">{f.forma}</h3>
                  <p className="kwota">{zl(f.cena)}</p>
                  <p className="cicho">netto za całą grupę</p>
                  <ul className="lista">
                    <li><Ptaszek /><span>{f.czas}</span></li>
                    <li><Ptaszek /><span>{f.grupa}</span></li>
                  </ul>
                </div>
              ))}
            </div>
            <div className="dwie pod-cena">
              <div className="panel poj">
                <h3 className="panel-t">W cenie</h3>
                <ul className="lista">
                  {CENA.wCenie.map((c) => (
                    <li key={c}><Ptaszek /><span>{s(c)}</span></li>
                  ))}
                </ul>
              </div>
              <div className="panel poj">
                <h3 className="panel-t">Koszt na osobę</h3>
                <ul className="rachunek">
                  {CENA.osoby.map((n) => (
                    <li key={n}>
                      <span>{n} osób</span>
                      <b>{zl(Math.round(CENY.wFirmie / n))}</b>
                    </li>
                  ))}
                </ul>
                <p className="maly-tekst">Warsztat w firmie, netto za osobę. {s(CENA.rynek)}</p>
              </div>
            </div>
            <ul className="pewniki">
              {CENA.pewniki.map((x) => (
                <li className="poj" key={x.t}>
                  <Ptaszek />
                  <div>
                    <b>{x.t}</b>
                    <p>{s(x.o)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="akcje srodek poj">
              <a href="#formularz" className="btn">{HERO.cta} <Strzalka /></a>
              <Druk napis={CENA.druk.przycisk} />
            </div>
            <p className="maly-tekst srodek">{s(CENA.druk.opis)}</p>
          </div>
        </section>
        <Kreska w="prawo" />

        {/* PYTANIA */}
        <section className="sek" aria-labelledby="pytania">
          <div className="sek-w pyt">
            <div>
              <p className="mono nad">Pytania</p>
              <h2 id="pytania"><Zdanie tekst={kropka(PYTANIA.tytul)} /></h2>
              <p className="opis poj">{s(PYTANIA.inne)}</p>
              <a className="btn puste maly" href={`mailto:${KONTAKT.email}?subject=Pytanie%20o%20szkolenie%20AI`}>{KONTAKT.email}</a>
            </div>
            <div className="pytania poj">
              {PYTANIA.lista.map((q) => (
                <details key={q.p}>
                  <summary>
                    <span>{s(q.p)}</span>
                    <i aria-hidden="true" />
                  </summary>
                  <p>{s(q.o)}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* KONTAKT */}
        <section className="sek" aria-labelledby="formularz">
          <div className="sek-w kontakt">
            <div className="pocisk">
              <Obrys />
              <p className="mono nad">Kontakt</p>
              <h2 id="formularz"><Zdanie tekst={kropka(FORMULARZ.tytul)} /></h2>
              <p className="opis">{s(FORMULARZ.lead)}</p>
              <p className="dalej-t">{FORMULARZ.dalej.tytul}:</p>
              <ol className="dalej">
                {FORMULARZ.dalej.kroki.map((k, i) => (
                  <li key={k}><span aria-hidden="true">{i + 1}</span>{s(k)}</li>
                ))}
              </ol>
              <p className="obietnica">{s(FORMULARZ.obietnica)}</p>
            </div>
            <Formularz />
          </div>
        </section>
      </main>

      <footer className="stopka">
        {!kivo && <Gwiazdy className="gwiazdy" ziarno={23} />}
        {!kivo && <div className="smuga dolna" aria-hidden="true" />}
        <div className="stopka-w">
          <div>
            <p className="mono nad">Zapytania</p>
            <a className="mail" href={`mailto:${KONTAKT.email}?subject=Szkolenie%20AI%20dla%20firmy`}>{KONTAKT.email}</a>
            <p className="maly-tekst">Odpowiadam osobiście w 24 godziny, w dni robocze.</p>
          </div>
          <nav aria-label="Stopka">
            <div>
              <p className="mono">Strona</p>
              <a href="#rozklad">Rozkład dnia</a>
              <a href="#prowadzacy">Prowadzący</a>
              <a href="#cena">Cena</a>
              <a href="#pytania">Pytania</a>
            </div>
            {/* 21.11 (USER_001): blog i katalog narzędzi jako podstrony strony głównej. */}
            <div>
              <p className="mono">Wiedza</p>
              <a href="/blog">Blog o AI w firmie</a>
              <a href="/ai">Narzędzia AI</a>
            </div>
            <div>
              <p className="mono">Kontakt</p>
              <a href={KONTAKT.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
              <a href={`mailto:${KONTAKT.email}`}>E-mail</a>
            </div>
            <div>
              <p className="mono">Dokumenty</p>
              <UstawieniaCookies className="jcz-link" />
              <a href="/regulamin">Regulamin</a>
              <a href="/polityka-prywatnosci">Polityka prywatności</a>
            </div>
          </nav>
        </div>
        <p className="znak-wodny" aria-hidden="true">CHODAKOWSKI</p>
        <div className="stopka-dol">
          <span>© 2026 Jakub Chodakowski · NIP {KONTAKT.nip}</span>
          <a href="/">jakubchodakowski.com</a>
        </div>
      </footer>

      <a href="#formularz" className="dol btn">{HERO.cta} <Strzalka /></a>
    </div>
  );
}
