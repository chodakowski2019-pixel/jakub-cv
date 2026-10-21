"use client";

import { useEffect, useMemo, useState } from "react";
import KulaOrb from "@/components/bruno/kula-orb";
import oferty from "./oferty.json";
import s from "./bruno-oferty.module.css";

// Portal ofert pracy dla handlowców, podgląd 15.10 (lejek 1 B2C z /bruno).
// Mail zbieramy w 2 miejscach: alert „co poniedziałek” i wynik próbnej rozmowy z Bruno.
// Liczby rynku = Adzuna 9.10 (SalesAI/oferty/STAN.md). Formularze nic nie wysyłają.

type Oferta = {
  id: number;
  kraj: "US" | "UK";
  tytul: string;
  firma: string;
  miejsce: string;
  zdalnie: boolean;
  rola: string;
  min: number | null;
  max: number | null;
  szac: boolean;
  data: string;
  url: string;
};

const WSZYSTKIE = oferty as Oferta[];
const ROLE = ["All roles", "SDR", "AE", "Account Manager", "Sales Rep", "Manager"];
const RYNEK = {
  US: { ofert: "317,452", zdalnie: "24%", mediana: "$74k" },
  UK: { ofert: "34,441", zdalnie: "14%", mediana: "£39k" },
};

function pensja(o: Oferta) {
  if (!o.min) return null;
  const z = o.kraj === "US" ? "$" : "£";
  const k = (n: number) => `${z}${Math.round(n / 1000)}k`;
  const tekst = o.max && o.max !== o.min ? `${k(o.min)} – ${k(o.max)}` : k(o.min);
  return o.szac ? `${tekst} est.` : tekst;
}

function ile(data: string) {
  const dni = Math.max(0, Math.round((Date.parse("2026-10-09") - Date.parse(data)) / 864e5));
  return dni === 0 ? "Today" : dni === 1 ? "1 day ago" : `${dni} days ago`;
}

export default function BrunoOferty() {
  const [kraj, setKraj] = useState<"US" | "UK">("US");
  const [rola, setRola] = useState("All roles");
  const [zdalnie, setZdalnie] = useState(false);
  const [zPensja, setZPensja] = useState(false);
  const [limit, setLimit] = useState(12);
  const [trening, setTrening] = useState<Oferta | null>(null);

  const lista = useMemo(
    () =>
      WSZYSTKIE.filter(
        (o) =>
          o.kraj === kraj &&
          (rola === "All roles" || o.rola === rola) &&
          (!zdalnie || o.zdalnie) &&
          (!zPensja || o.min),
      ),
    [kraj, rola, zdalnie, zPensja],
  );

  useEffect(() => setLimit(12), [kraj, rola, zdalnie, zPensja]);

  const opisAlertu = [rola === "All roles" ? "Sales" : rola, "jobs", kraj === "US" ? "in the US" : "in the UK", zdalnie ? "· remote" : "", zPensja ? "· with salary" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={s.root}>
      <nav className={s.nav}>
        <a className={s.logo} href="#">
          <span className={s.kropka} /> Bruno AI <span className={s.g}>Jobs</span>
        </a>
        <a className={s.navLink} href="#alert">
          Get job alerts
        </a>
      </nav>

      <header className={s.hero}>
        <p className={s.maly}>Sales jobs · updated daily</p>
        <h1 className={s.h1}>
          Find your next sales job.
          <br />
          <span className={s.g}>Practice the interview first.</span>
        </h1>
        <div className={s.liczby}>
          <div>
            <b>{RYNEK[kraj].ofert}</b>
            <span>open sales jobs</span>
          </div>
          <div>
            <b>{RYNEK[kraj].mediana}</b>
            <span>median salary</span>
          </div>
          <div>
            <b>{RYNEK[kraj].zdalnie}</b>
            <span>remote</span>
          </div>
        </div>
      </header>

      <div className={s.filtry}>
        <div className={s.przelacznik} role="tablist">
          {(["US", "UK"] as const).map((k) => (
            <button key={k} className={kraj === k ? s.wl : ""} onClick={() => setKraj(k)}>
              {k === "US" ? "🇺🇸 United States" : "🇬🇧 United Kingdom"}
            </button>
          ))}
        </div>
        <div className={s.pigulki}>
          {ROLE.map((r) => (
            <button key={r} className={`${s.pig} ${rola === r ? s.pigWl : ""}`} onClick={() => setRola(r)}>
              {r}
            </button>
          ))}
          <button className={`${s.pig} ${zdalnie ? s.pigWl : ""}`} onClick={() => setZdalnie(!zdalnie)}>
            Remote
          </button>
          <button className={`${s.pig} ${zPensja ? s.pigWl : ""}`} onClick={() => setZPensja(!zPensja)}>
            Shows salary
          </button>
        </div>
      </div>

      <main className={s.uklad}>
        <section>
          <p className={s.wynik}>
            {lista.length} jobs <span className={s.g}>· sample of the newest listings</span>
          </p>
          <ul className={s.lista}>
            {lista.slice(0, limit).map((o, i) => (
              <li key={o.id}>
                <article className={s.karta}>
                  <div className={s.kartaGora}>
                    <div className={s.awatar}>{o.firma.slice(0, 1)}</div>
                    <div className={s.kartaTekst}>
                      <h3>{o.tytul}</h3>
                      <p>
                        {o.firma} <span className={s.g}>· {o.miejsce}</span>
                      </p>
                    </div>
                  </div>
                  <div className={s.tagi}>
                    {pensja(o) && <span className={s.tagPensja}>{pensja(o)}</span>}
                    <span className={s.tag}>{o.rola}</span>
                    {o.zdalnie && <span className={s.tag}>Remote</span>}
                    <span className={`${s.tag} ${s.tagCichy}`}>{ile(o.data)}</span>
                  </div>
                  <div className={s.akcje}>
                    <button className={s.btnCzarny} onClick={() => setTrening(o)}>
                      <span className={s.kropkaMala} /> Practice this interview
                    </button>
                    <a className={s.btnJasny} href={o.url} target="_blank" rel="noreferrer">
                      View job
                    </a>
                  </div>
                </article>
                {i === 3 && <AlertWstawka opis={opisAlertu} />}
              </li>
            ))}
          </ul>
          {lista.length > limit && (
            <button className={s.wiecej} onClick={() => setLimit(limit + 12)}>
              Show more jobs
            </button>
          )}
          {lista.length === 0 && <p className={s.pusto}>No jobs with these filters. Try another role.</p>}
          <p className={s.zrodlo}>
            Jobs by <b>Adzuna</b>. We link to the original listing.
          </p>
        </section>

        <aside className={s.bok} id="alert">
          <Alert opis={opisAlertu} />
          <div className={s.bokBruno}>
            <div className={s.kula}>
              <KulaOrb />
            </div>
            <h3>Most reps fail the interview, not the job.</h3>
            <p>Bruno plays the hiring manager. He asks the hard questions, pushes back, and scores you in 3 minutes.</p>
          </div>
        </aside>
      </main>

      <footer className={s.stopka}>
        <span>
          <span className={s.kropka} /> Bruno AI
        </span>
        <span className={s.g}>Preview · nothing is saved</span>
      </footer>

      {trening && <Trening oferta={trening} zamknij={() => setTrening(null)} />}
    </div>
  );
}

function Alert({ opis }: { opis: string }) {
  const [mail, setMail] = useState("");
  const [gotowe, setGotowe] = useState(false);
  return (
    <div className={s.alert}>
      {gotowe ? (
        <>
          <p className={s.alertOk}>✓</p>
          <h3>You&apos;re in.</h3>
          <p className={s.alertOpis}>First email this Monday at 8 am. One email a week. Unsubscribe in one click.</p>
        </>
      ) : (
        <>
          <p className={s.maly}>Every Monday</p>
          <h3>New sales jobs in your inbox.</h3>
          <p className={s.alertOpis}>{opis}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (mail.includes("@")) setGotowe(true);
            }}
          >
            <input type="email" required placeholder="you@email.com" value={mail} onChange={(e) => setMail(e.target.value)} />
            <button className={s.btnCzarny} type="submit">
              Get job alerts
            </button>
          </form>
          <p className={s.drobne}>One email a week. No spam.</p>
        </>
      )}
    </div>
  );
}

function AlertWstawka({ opis }: { opis: string }) {
  return (
    <div className={s.wstawka}>
      <Alert opis={opis} />
    </div>
  );
}

function Trening({ oferta, zamknij }: { oferta: Oferta; zamknij: () => void }) {
  const [krok, setKrok] = useState<"start" | "rozmowa" | "mail" | "koniec">("start");
  const [mail, setMail] = useState("");
  const [sek, setSek] = useState(0);

  useEffect(() => {
    if (krok !== "rozmowa") return;
    const t = setInterval(() => setSek((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [krok]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && zamknij();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [zamknij]);

  const zegar = `${Math.floor(sek / 60)}:${String(sek % 60).padStart(2, "0")}`;

  return (
    <div className={s.tlo} onClick={zamknij}>
      <div className={s.okno} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className={s.zamknij} onClick={zamknij} aria-label="Close">
          ×
        </button>

        {krok === "start" && (
          <>
            <p className={s.maly}>Mock interview · 3 min · free</p>
            <h2 className={s.h2}>
              {oferta.tytul}
              <br />
              <span className={s.g}>at {oferta.firma}</span>
            </h2>
            <div className={s.kula}>
              <KulaOrb />
            </div>
            <p className={s.oknoOpis}>Bruno plays the hiring manager. He will ask:</p>
            <ol className={s.pytania}>
              <li>“Tell me about a deal you lost. Why?”</li>
              <li>“Sell me our product. You have 60 seconds.”</li>
              <li>“Your number is 20% below target. What do you do Monday?”</li>
            </ol>
            <button className={s.btnPomarancz} onClick={() => setKrok("rozmowa")}>
              Start the interview
            </button>
            <p className={s.drobne}>No sign-up. Uses your microphone.</p>
          </>
        )}

        {krok === "rozmowa" && (
          <>
            <p className={s.maly}>Live · {zegar}</p>
            <div className={`${s.kula} ${s.kulaDuza}`}>
              <KulaOrb tempo="mowi" />
            </div>
            <p className={s.mowi}>Bruno is speaking</p>
            <p className={s.cytat}>
              “Hi, I run the sales team at {oferta.firma}. I&apos;ve seen forty people for this role. Tell me in one minute why it
              should be you.”
            </p>
            <button className={s.btnCzarny} onClick={() => setKrok("mail")}>
              End interview
            </button>
          </>
        )}

        {krok === "mail" && (
          <>
            <p className={s.maly}>Your score is ready</p>
            <h2 className={s.h2}>Where should we send it?</h2>
            <div className={s.zamazane}>
              <div>
                <b>?/10</b>
                <span>Overall</span>
              </div>
              <div>
                <b>?</b>
                <span>Best moment</span>
              </div>
              <div>
                <b>?</b>
                <span>Fix this first</span>
              </div>
            </div>
            <form
              className={s.oknoForm}
              onSubmit={(e) => {
                e.preventDefault();
                if (mail.includes("@")) setKrok("koniec");
              }}
            >
              <input type="email" required placeholder="you@email.com" value={mail} onChange={(e) => setMail(e.target.value)} />
              <button className={s.btnPomarancz} type="submit">
                Send my score
              </button>
            </form>
            <label className={s.zgoda}>
              <input type="checkbox" defaultChecked /> Also send me new {oferta.rola} jobs every Monday
            </label>
          </>
        )}

        {krok === "koniec" && (
          <>
            <p className={s.alertOk}>✓</p>
            <h2 className={s.h2}>Check your inbox.</h2>
            <p className={s.oknoOpis}>Your score and the 3 things to fix before the real interview are on the way.</p>
            <a className={s.btnCzarny} href="#">
              Practice 3 more calls free
            </a>
          </>
        )}
      </div>
    </div>
  );
}
