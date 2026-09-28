"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";

// Ankieta wdrożeniowa SalesAI. Wygląd przepisany z /aisaleskontakt (jasne szkło).
//
// Jeden formularz dla wszystkich (decyzja USER_001 28.09): bez wstrzykiwania
// czegokolwiek linkiem, ten sam adres dostaje każdy klient.
//
// Skrócony 28.09 z 18 pól do 11. Wyleciało wszystko, co albo wiadomo już
// z rozmowy (wielkość zespołu, branża klienta, wartość transakcji), albo było
// pytaniem dla większej firmy niż realny klient (żargon, zakazy prawne,
// konkurencja). Imię i mail też wypadły (USER_001 28.09): z formularza
// rozpoznajemy nadawcę po nazwie firmy, link i tak idzie imiennie.
const TLO = "#ffffff";

const KANALY = ["Telefon", "Spotkanie online", "Spotkanie u klienta"];

const ETAPY = [
  "Pierwszy kontakt",
  "Badanie potrzeb",
  "Prezentacja oferty",
  "Obiekcje",
  "Negocjacja ceny",
  "Domykanie",
  "Follow-up po ofercie",
];

const INNE = "Inne";

const ZACHOWANIA = [
  "Spieszy się, ucina rozmowę",
  "Milczy, nie daje sygnałów",
  "Agresywny, atakuje cenę",
  "Uprzejmy, ale ucieka w 'prześlij ofertę'",
  "Wie dużo, sprawdza handlowca",
  "Odsyła do kogoś innego",
  INNE,
];

type Plik = { nazwa: string; sciezka?: string; stan: "wysylanie" | "ok" | "blad" };

type Form = {
  firma: string;
  coSprzedajesz: string;
  ktoDecyduje: string;
  ileOsobDecyzja: string;
  zachowania: string[];
  zachowaniaInne: string;
  kanal: string;
  etapy: string[];
  przebieg: string;
  obiekcje: string;
  sukces: string;
  powodPrzegranej: string;
  uwagi: string;
};

const PUSTY: Form = {
  firma: "",
  coSprzedajesz: "",
  ktoDecyduje: "",
  ileOsobDecyzja: "",
  zachowania: [],
  zachowaniaInne: "",
  kanal: "",
  etapy: [],
  przebieg: "",
  obiekcje: "",
  sukces: "",
  powodPrzegranej: "",
  uwagi: "",
};

// Pasek postępu zastąpił napis "CZĘŚĆ 1 / 3" (USER_001 28.09): trzy kreski,
// wypełnione do bieżącej części, wyśrodkowane nad tytułem.
// Od 28.09 formularz jest kreatorem: jeden ekran naraz, przyciski Wstecz
// i Dalej. Trzy ekrany po 2-6 pól czyta się inaczej niż jedna ściana.
function Pasek({ krok }: { krok: number }) {
  return (
    <div className="flex justify-center gap-1.5 mb-5" role="img" aria-label={`Część ${krok} z 3`}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`h-1.5 w-12 rounded-full transition-colors duration-200 ${
            i <= krok ? "bg-gradient-to-r from-cyan-700 to-teal-700" : "bg-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

// Sekcja stoi POZA komponentem strony z rozmysłem. Zdefiniowana w środku byłaby
// przy każdym naciśnięciu klawisza nowym typem komponentu, React odmontowałby
// całe pudło i pole traciłoby kursor po pierwszej literze.
// Z tego samego powodu klasa szkła leci przez `style jsx global`: scope'owany
// styled-jsx nie dosięga JSX-a innego komponentu.
function Sekcja({ krok, tytul, children }: { krok: number; tytul: string; children: React.ReactNode }) {
  return (
    <section className="brief-szklo rounded-3xl p-6 sm:p-8">
      <Pasek krok={krok} />
      <h2 className="text-xl sm:text-2xl font-bold font-[var(--font-poppins)] tracking-[-0.015em] leading-tight text-center mb-6">
        {tytul}
      </h2>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

export default function AiSalesBriefPage() {
  const [krok, setKrok] = useState(1);
  const [form, setForm] = useState<Form>(PUSTY);
  const [pliki, setPliki] = useState<Plik[]>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");

  const pole =
    (k: keyof Form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const przelacz = (k: "zachowania" | "etapy", v: string) =>
    setForm((f) => ({
      ...f,
      [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v],
    }));

  // Plik idzie prosto do Supabase Storage po podpisany URL z naszego API.
  // Gdyby szedł przez nasz endpoint, zatrzymałby się na limicie 4,5 MB
  // na treść żądania, a nagranie rozmowy to dziesiątki megabajtów.
  const dodajPliki = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const wybrane = Array.from(e.target.files ?? []);
    e.target.value = "";
    for (const plik of wybrane) {
      setPliki((p) => [...p, { nazwa: plik.name, stan: "wysylanie" }]);
      try {
        const res = await fetch("/api/aisalesbrief/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nazwa: plik.name, rozmiar: plik.size }),
        });
        if (!res.ok) throw new Error("brak podpisu");
        const { signedUrl, sciezka } = await res.json();

        const wgranie = await fetch(signedUrl, {
          method: "PUT",
          headers: { "Content-Type": plik.type || "application/octet-stream" },
          body: plik,
        });
        if (!wgranie.ok) throw new Error("wgranie odrzucone");

        setPliki((p) => p.map((x) => (x.nazwa === plik.name && x.stan === "wysylanie" ? { ...x, sciezka, stan: "ok" } : x)));
      } catch {
        setPliki((p) => p.map((x) => (x.nazwa === plik.name && x.stan === "wysylanie" ? { ...x, stan: "blad" } : x)));
      }
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Enter w polu tekstowym wysyla formularz nawet bez przycisku submit
    // na ekranie. Bez tej blokady ankieta poszlaby z pierwszego ekranu.
    if (krok !== 3) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/aisalesbrief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          nagrania: pliki.filter((p) => p.stan === "ok").map((p) => p.sciezka),
        }),
      });
      setStatus(res.ok ? "ok" : "error");
      if (res.ok) track("salesai_brief", { firma: form.firma });
    } catch {
      setStatus("error");
    }
  };

  const inputCls =
    "w-full bg-white border border-slate-300/90 rounded-xl px-4 py-3 text-base text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/15 transition-all duration-150";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1.5 tracking-[0.01em]";
  const opisCls = "block text-[11px] text-slate-400 mb-1.5 leading-snug";

  const chip = (wybrany: boolean) =>
    `px-3.5 py-2 rounded-xl text-[13px] border shadow-sm active:scale-[0.97] transition-all duration-150 ${
      wybrany
        ? "bg-cyan-600 border-cyan-600 text-white font-medium"
        : "bg-white border-slate-300/90 text-slate-600 hover:border-slate-400 hover:text-slate-900"
    }`;

  const inneWybrane = form.zachowania.includes(INNE);

  // Kazdy ekran pilnuje sam siebie: "Dalej" jest martwy, dopoki jego wlasne
  // pola nie sa wypelnione. Dzieki temu nikt nie dochodzi do konca kreatora
  // i nie dowiaduje sie dopiero tam, ze czegos brakuje dwa ekrany wstecz.
  const kompletKroku: Record<number, boolean> = {
    1: Boolean(form.firma && form.coSprzedajesz),
    2: Boolean(
      form.ktoDecyduje &&
        form.ileOsobDecyzja &&
        form.zachowania.length > 0 &&
        (!inneWybrane || form.zachowaniaInne),
    ),
    3: Boolean(
      form.kanal &&
        form.etapy.length > 0 &&
        form.przebieg &&
        form.obiekcje &&
        form.sukces &&
        form.powodPrzegranej &&
        !pliki.some((p) => p.stan === "wysylanie"),
    ),
  };

  // Po zmianie ekranu widok musi wrocic na gore, bo trzeci ekran jest dlugi
  // i bez tego czlowiek laduje w srodku nowej sekcji.
  const idz = (nowy: number) => {
    setKrok(nowy);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen text-slate-900 font-[var(--font-open-sans)]" style={{ background: TLO }}>
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden bg-white">
        <div
          className="absolute -top-32 -left-24 w-[620px] h-[620px] rounded-full blur-[120px] opacity-70"
          style={{ background: "radial-gradient(closest-side, #a5f3fc, transparent)" }}
        />
        <div
          className="absolute top-1/3 -right-32 w-[560px] h-[560px] rounded-full blur-[120px] opacity-60"
          style={{ background: "radial-gradient(closest-side, #99f6e4, transparent)" }}
        />
        <div
          className="absolute -bottom-40 left-1/4 w-[640px] h-[520px] rounded-full blur-[130px] opacity-50"
          style={{ background: "radial-gradient(closest-side, #bae6fd, transparent)" }}
        />
      </div>

      <main className="relative px-5 sm:px-6 py-12 sm:py-16">
        {status === "ok" ? (
          <div className="brief-szklo max-w-md mx-auto rounded-3xl p-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-white/70 border-2 border-cyan-600/40 flex items-center justify-center mb-6">
              <svg
                className="w-10 h-10 text-cyan-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-3 font-[var(--font-poppins)] tracking-[-0.01em]">Mam wszystko.</h1>
            <p className="text-slate-700 leading-relaxed">
              Ustawiam trening pod Twoją rozmowę i odzywam się w ciągu 48 godzin.
            </p>
            <p className="text-sm text-slate-500 mt-4">Jakub Chodakowski</p>
          </div>
        ) : (
          <form onSubmit={submit} className="max-w-2xl mx-auto flex flex-col gap-6">
            {krok === 1 && (
            <Sekcja krok={1} tytul="Twoja firma i produkt">
              <div>
                <label className={labelCls} htmlFor="firma">
                  Nazwa firmy *
                </label>
                <input
                  id="firma"
                  required
                  autoComplete="organization"
                  className={inputCls}
                  placeholder="STYROBUD"
                  value={form.firma}
                  onChange={pole("firma")}
                />
              </div>

              <div>
                <label className={labelCls} htmlFor="coSprzedajesz">
                  Co sprzedajesz? *
                </label>
                <span className={opisCls}>Jedno, dwa zdania. Tak, jak powiedziałbyś to klientowi przez telefon.</span>
                <textarea
                  id="coSprzedajesz"
                  required
                  rows={3}
                  className={inputCls}
                  placeholder="Prefabrykaty betonowe dla firm budowlanych. Produkcja na zamówienie, dostawa w 14 dni."
                  value={form.coSprzedajesz}
                  onChange={pole("coSprzedajesz")}
                />
              </div>
            </Sekcja>
            )}

            {krok === 2 && (
            <Sekcja krok={2} tytul="Twój klient">
              <div>
                <label className={labelCls} htmlFor="ktoDecyduje">
                  Kto po stronie klienta podejmuje decyzję? *
                </label>
                <span className={opisCls}>Stanowisko, nie nazwisko. Np. kierownik budowy, właściciel zakładu, dyrektor zakupów.</span>
                <input
                  id="ktoDecyduje"
                  required
                  className={inputCls}
                  placeholder="Kierownik budowy"
                  value={form.ktoDecyduje}
                  onChange={pole("ktoDecyduje")}
                />
              </div>

              <div>
                <label className={labelCls} htmlFor="ileOsobDecyzja">
                  Ile osób po stronie klienta bierze udział w decyzji? *
                </label>
                <span className={opisCls}>Jeden człowiek decyduje sam czy musi to przez kogoś przepchnąć?</span>
                <input
                  id="ileOsobDecyzja"
                  required
                  className={inputCls}
                  placeholder="Zwykle dwie: kierownik i właściciel"
                  value={form.ileOsobDecyzja}
                  onChange={pole("ileOsobDecyzja")}
                />
              </div>

              <fieldset>
                <legend className={labelCls}>Jak taki klient zachowuje się w rozmowie? *</legend>
                <span className={opisCls}>Zaznacz wszystko, co pasuje. To ustawia trudność treningu.</span>
                <div className="flex flex-wrap gap-2">
                  {ZACHOWANIA.map((z) => (
                    <button
                      key={z}
                      type="button"
                      aria-pressed={form.zachowania.includes(z)}
                      onClick={() => przelacz("zachowania", z)}
                      className={chip(form.zachowania.includes(z))}
                    >
                      {z}
                    </button>
                  ))}
                </div>
                {inneWybrane && (
                  <input
                    aria-label="Opisz, jak zachowuje się klient"
                    required
                    className={`${inputCls} mt-3`}
                    placeholder="Opisz, jak zachowuje się Twój klient"
                    value={form.zachowaniaInne}
                    onChange={pole("zachowaniaInne")}
                  />
                )}
              </fieldset>
            </Sekcja>
            )}

            {krok === 3 && (
            <Sekcja krok={3} tytul="Twoja rozmowa">
              <fieldset>
                <legend className={labelCls}>Gdzie odbywa się rozmowa? *</legend>
                <div className="flex flex-wrap gap-2">
                  {KANALY.map((k) => (
                    <button
                      key={k}
                      type="button"
                      aria-pressed={form.kanal === k}
                      onClick={() => setForm((f) => ({ ...f, kanal: k }))}
                      className={chip(form.kanal === k)}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className={labelCls}>Który etap chcesz trenować? *</legend>
                <span className={opisCls}>Zaznacz wszystkie, na których dziś tracisz najwięcej.</span>
                <div className="flex flex-wrap gap-2">
                  {ETAPY.map((e) => (
                    <button
                      key={e}
                      type="button"
                      aria-pressed={form.etapy.includes(e)}
                      onClick={() => przelacz("etapy", e)}
                      className={chip(form.etapy.includes(e))}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div>
                <label className={labelCls} htmlFor="przebieg">
                  Przebieg rozmowy krok po kroku *
                </label>
                <span className={opisCls}>Od pierwszego zdania do końca. Jeśli masz skrypt, wklej go tutaj w całości.</span>
                <textarea
                  id="przebieg"
                  required
                  rows={7}
                  className={inputCls}
                  placeholder={"1. Przedstawienie się i powód telefonu\n2. Pytanie o aktualnego dostawcę\n3. Pytanie o terminy dostaw\n4. Propozycja wyceny\n5. Umówienie się na wysłanie oferty"}
                  value={form.przebieg}
                  onChange={pole("przebieg")}
                />
              </div>

              <div>
                <label className={labelCls} htmlFor="obiekcje">
                  Najczęstsze obiekcje *
                </label>
                <span className={opisCls}>
                  Przepisz zdania, które realnie słyszysz. Nie „obiekcja cenowa", tylko „macie drożej niż konkurencja".
                </span>
                <textarea
                  id="obiekcje"
                  required
                  rows={5}
                  className={inputCls}
                  placeholder={"1. Mamy już dostawcę i jesteśmy zadowoleni\n2. To jest drogie, konkurencja daje taniej\n3. Prześlij ofertę mailem, odezwiemy się"}
                  value={form.obiekcje}
                  onChange={pole("obiekcje")}
                />
              </div>

              <div>
                <label className={labelCls} htmlFor="sukces">
                  Co znaczy, że rozmowa się udała? *
                </label>
                <span className={opisCls}>Bez tego AI nie ma czego oceniać. Umówione spotkanie? Wysłana wycena? Podpis?</span>
                <input
                  id="sukces"
                  required
                  className={inputCls}
                  placeholder="Klient zgadza się na wycenę i podaje ilości"
                  value={form.sukces}
                  onChange={pole("sukces")}
                />
              </div>

              <div>
                <label className={labelCls} htmlFor="powodPrzegranej">
                  Najczęstszy powód, dla którego przegrywasz *
                </label>
                <textarea
                  id="powodPrzegranej"
                  required
                  rows={3}
                  className={inputCls}
                  placeholder="Klient ma dostawcę od lat i nie chce zmieniać. Odpuszczam po pierwszym 'nie'."
                  value={form.powodPrzegranej}
                  onChange={pole("powodPrzegranej")}
                />
              </div>

              <div>
                <label className={labelCls} htmlFor="nagrania">
                  Nagrania rozmów <span className="font-normal text-slate-400">(opcjonalnie)</span>
                </label>
                <span className={opisCls}>
                  mp3, m4a, wav, mp4, mov. Jedno nagranie mówi więcej niż połowa tego formularza. Potrzebna zgoda drugiej strony.
                </span>
                <input
                  id="nagrania"
                  type="file"
                  multiple
                  accept="audio/*,video/*,.mp3,.m4a,.wav,.ogg,.mp4,.mov,.webm"
                  onChange={dodajPliki}
                  className="w-full text-[13px] text-slate-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border file:border-slate-300/90 file:bg-white file:text-[13px] file:font-medium file:text-slate-700 hover:file:border-slate-400 file:cursor-pointer"
                />
                {pliki.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-1.5">
                    {pliki.map((p, i) => (
                      <li key={`${p.nazwa}-${i}`} className="text-[12px] flex items-center gap-2">
                        <span className="text-slate-700 truncate">{p.nazwa}</span>
                        <span
                          className={
                            p.stan === "ok"
                              ? "text-cyan-700 font-medium shrink-0"
                              : p.stan === "blad"
                                ? "text-red-700 shrink-0"
                                : "text-slate-400 shrink-0"
                          }
                        >
                          {p.stan === "ok" ? "wgrane" : p.stan === "blad" ? "nie poszło" : "wysyłam..."}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <label className={labelCls} htmlFor="uwagi">
                  Jeżeli chcesz coś dodać, napisz tutaj
                </label>
                <textarea id="uwagi" rows={4} className={inputCls} value={form.uwagi} onChange={pole("uwagi")} />
              </div>
            </Sekcja>
            )}

            {status === "error" && (
              <p className="text-red-700 text-sm text-center">
                Coś poszło nie tak. Napisz na hello@jakubchodakowski.com
              </p>
            )}

            <div className="flex gap-3">
              {krok > 1 && (
                <button
                  type="button"
                  onClick={() => idz(krok - 1)}
                  className="py-4 px-6 rounded-2xl bg-white border border-slate-300/90 text-slate-600 font-semibold text-sm shadow-sm active:scale-[0.98] hover:border-slate-400 hover:text-slate-900 transition-all duration-150"
                >
                  ← Wstecz
                </button>
              )}

              {krok < 3 ? (
                <button
                  type="button"
                  onClick={() => idz(krok + 1)}
                  disabled={!kompletKroku[krok]}
                  className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-cyan-700 to-teal-700 text-white font-semibold text-sm active:scale-[0.98] hover:brightness-110 transition-all duration-150 shadow-lg shadow-cyan-800/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  Dalej →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={status === "sending" || !kompletKroku[3]}
                  className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-cyan-700 to-teal-700 text-white font-semibold text-sm active:scale-[0.98] hover:brightness-110 transition-all duration-150 shadow-lg shadow-cyan-800/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  {status === "sending" ? "Wysyłam..." : "Wyślij ankietę →"}
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-500 text-center leading-relaxed pb-4">
              Dane trafiają wyłącznie do Jakuba Chodakowskiego, NIP 6711845485, i służą wyłącznie do ustawienia
              treningu.
            </p>
          </form>
        )}
      </main>

      <style jsx global>{`
        .brief-szklo {
          background: rgba(255, 255, 255, 0.55);
          backdrop-filter: blur(28px) saturate(180%);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.85);
          box-shadow:
            0 24px 60px -20px rgba(15, 23, 42, 0.22),
            0 2px 10px -4px rgba(15, 23, 42, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }
        @media (prefers-reduced-transparency: reduce) {
          .brief-szklo {
            background: #ffffff;
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            border-color: rgb(203 213 225);
          }
        }
      `}</style>
    </div>
  );
}
