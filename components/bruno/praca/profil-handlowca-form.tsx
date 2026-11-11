"use client";

import { useEffect, useState } from "react";
import d from "./dolacz.module.css";
import { CV_MAKS_B, DNI_WERYFIKACJI, FOTO_BOK, KROKI, bladPola, type Odpowiedzi, type Pytanie } from "@/lib/bruno/praca/profil-handlowca";

// 11.11 (USER_001): formularz profilu handlowca po założeniu konta. 5 kroków, na końcu komunikat o weryfikacji do 7 dni.
// Szkic trzymany w sessionStorage, żeby odświeżenie strony nie kasowało odpowiedzi.
const SZKIC = "praca_profil_szkic";

export function Weryfikacja({ email }: { email: string }) {
  return (
    <div className={`${d.karta} ${d.status}`}>
      <span className={d.statusZnak}>
        <i /> W trakcie weryfikacji
      </span>
      <h1 className={d.statusH}>Weryfikujemy informacje o Tobie</h1>
      <p className={d.statusP}>
        Zajmie to do {DNI_WERYFIKACJI} dni. Wynik wyślemy na adres {email}.
      </p>
    </div>
  );
}

/** Zmniejsza zdjęcie do FOTO_BOK px na dłuższym boku i oddaje JPEG. Null = plik nie jest obrazem. */
export async function zmniejszZdjecie(plik: File): Promise<Blob | null> {
  const obraz = await createImageBitmap(plik).catch(() => null);
  if (!obraz) return null;
  const skala = Math.min(1, FOTO_BOK / Math.max(obraz.width, obraz.height));
  const plotno = document.createElement("canvas");
  plotno.width = Math.round(obraz.width * skala);
  plotno.height = Math.round(obraz.height * skala);
  plotno.getContext("2d")?.drawImage(obraz, 0, 0, plotno.width, plotno.height);
  return new Promise((r) => plotno.toBlob(r, "image/jpeg", 0.86));
}

export default function ProfilHandlowcaForm({ email, imie, telefon }: { email: string; imie: string | null; telefon: string | null }) {
  const [krok, setKrok] = useState(0);
  const [odp, setOdp] = useState<Odpowiedzi>({ ...(imie ? { imie } : {}), ...(telefon ? { telefon } : {}) });
  const [zgoda, setZgoda] = useState(false);
  const [bledy, setBledy] = useState<Record<string, string>>({});
  const [stan, setStan] = useState<"" | "wysylam" | "wyslane">("");
  const [blad, setBlad] = useState("");
  const [cv, setCv] = useState<File | null>(null);
  const [foto, setFoto] = useState<Blob | null>(null);
  const [fotoPodglad, setFotoPodglad] = useState("");
  const [bladPliku, setBladPliku] = useState<{ cv?: string; foto?: string }>({});

  function wybierzCv(plik: File | undefined) {
    if (!plik) return;
    if (!/\.pdf$/i.test(plik.name)) return setBladPliku((b) => ({ ...b, cv: "CV tylko w formacie PDF." }));
    if (plik.size > CV_MAKS_B) return setBladPliku((b) => ({ ...b, cv: "Plik może mieć najwyżej 3 MB." }));
    setBladPliku((b) => ({ ...b, cv: undefined }));
    setCv(plik);
  }

  async function wybierzFoto(plik: File | undefined) {
    if (!plik) return;
    const male = await zmniejszZdjecie(plik);
    if (!male) return setBladPliku((b) => ({ ...b, foto: "Zdjęcie w formacie JPG, PNG albo WEBP." }));
    setBladPliku((b) => ({ ...b, foto: undefined }));
    setFoto(male);
    setFotoPodglad((stary) => {
      if (stary) URL.revokeObjectURL(stary);
      return URL.createObjectURL(male);
    });
  }

  useEffect(() => {
    try {
      const s = sessionStorage.getItem(SZKIC);
      if (s) setOdp((o) => ({ ...o, ...JSON.parse(s) }));
    } catch {}
  }, []);

  function ustaw(klucz: string, wartosc: string | string[]) {
    const nowe = { ...odp, [klucz]: wartosc };
    setOdp(nowe);
    setBledy(({ [klucz]: _, ...reszta }) => reszta);
    try {
      sessionStorage.setItem(SZKIC, JSON.stringify(nowe));
    } catch {}
  }

  function przelacz(p: Extract<Pytanie, { typ: "wiele" }>, v: string) {
    const teraz = (odp[p.klucz] as string[] | undefined) ?? [];
    if (teraz.includes(v)) return ustaw(p.klucz, teraz.filter((x) => x !== v));
    if (p.maks && teraz.length >= p.maks) return;
    ustaw(p.klucz, [...teraz, v]);
  }

  function bledyKroku(nr: number) {
    const b: Record<string, string> = {};
    for (const p of KROKI[nr].pytania) {
      const x = bladPola(p, odp[p.klucz]);
      if (x) b[p.klucz] = x;
    }
    return b;
  }

  function idzDo(nr: number) {
    setKrok(nr);
    setBlad("");
    window.scrollTo({ top: 0 });
  }

  async function dalej(e: React.FormEvent) {
    e.preventDefault();
    const b = bledyKroku(krok);
    setBledy(b);
    if (Object.keys(b).length) return;
    if (krok + 1 < KROKI.length) return idzDo(krok + 1);
    if (!zgoda) return setBlad("Zaznacz zgodę na pokazanie profilu pracodawcom.");
    setBlad("");
    setStan("wysylam");
    const dane = new FormData();
    dane.set("odpowiedzi", JSON.stringify(odp));
    dane.set("zgoda", "tak");
    if (cv) dane.set("cv", cv);
    if (foto) dane.set("zdjecie", foto, "zdjecie.jpg");
    const r = await fetch("/api/bruno/praca/profil-handlowca", { method: "POST", body: dane }).catch(() => null);
    const j = await r?.json().catch(() => null);
    if (!r?.ok || !j?.ok) {
      setStan("");
      if (typeof j?.krok === "number") {
        setKrok(j.krok);
        if (j.klucz) setBledy({ [j.klucz]: j.blad });
      }
      return setBlad(j?.blad ?? "Brak połączenia. Spróbuj ponownie.");
    }
    try {
      sessionStorage.removeItem(SZKIC);
    } catch {}
    setStan("wyslane");
    window.scrollTo({ top: 0 });
  }

  if (stan === "wyslane") return <Weryfikacja email={email} />;

  const k = KROKI[krok];
  const ostatni = krok === KROKI.length - 1;
  return (
    <form className={d.karta} onSubmit={dalej} noValidate>
      <div className={d.postep} aria-hidden="true">
        {KROKI.map((x, i) => (
          <i key={x.tytul} className={i <= krok ? d.zrobione : ""} />
        ))}
      </div>
      <span className={d.krokNr}>
        Krok {krok + 1} z {KROKI.length}
      </span>
      <h1 className={d.krokH}>{k.tytul}</h1>

      {k.pytania.map((p) => {
        const id = `pole-${p.klucz}`;
        const b = bledy[p.klucz];
        if (p.typ === "jedna" || p.typ === "wiele") {
          const wybrane = p.typ === "wiele" ? ((odp[p.klucz] as string[] | undefined) ?? []) : [odp[p.klucz]];
          return (
            <fieldset key={p.klucz} className={d.pytanie}>
              <legend>{p.pytanie}</legend>
              <div className={d.opcje}>
                {p.opcje.map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    aria-pressed={wybrane.includes(o.v)}
                    className={`${d.opcja} ${wybrane.includes(o.v) ? d.opcjaWl : ""}`}
                    onClick={() => (p.typ === "wiele" ? przelacz(p, o.v) : ustaw(p.klucz, o.v))}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
              {b && <p className={d.bladPola}>{b}</p>}
            </fieldset>
          );
        }
        const wspolne = {
          id,
          className: d.wpis,
          value: (odp[p.klucz] as string | undefined) ?? "",
          placeholder: p.podpowiedz,
          maxLength: p.maks,
          "aria-invalid": !!b,
        };
        return (
          <div key={p.klucz} className={d.pytanie}>
            <label className={d.etykieta} htmlFor={id}>
              {p.pytanie}
              {p.opcjonalne && " (nieobowiązkowe)"}
            </label>
            {p.typ === "dlugi" ? (
              <textarea {...wspolne} onChange={(e) => ustaw(p.klucz, e.target.value)} />
            ) : (
              <input
                {...wspolne}
                type={p.typ === "tel" ? "tel" : p.typ === "url" ? "url" : "text"}
                inputMode={p.typ === "liczba" ? "numeric" : undefined}
                autoComplete={p.typ === "tel" ? "tel" : p.klucz === "miasto" ? "address-level2" : p.klucz === "imie" ? "name" : "off"}
                onChange={(e) => ustaw(p.klucz, p.typ === "liczba" ? e.target.value.replace(/\D/g, "") : e.target.value)}
              />
            )}
            {b && <p className={d.bladPola}>{b}</p>}
          </div>
        );
      })}

      {ostatni && (
        <>
          <div className={d.pytanie}>
            <span className={d.etykieta}>Zdjęcie (nieobowiązkowe)</span>
            <label className={d.plik}>
              {fotoPodglad ? <img className={d.plikFoto} src={fotoPodglad} alt="" /> : <span className={d.plikFoto} aria-hidden="true" />}
              <span>
                <b>{foto ? "Zmień zdjęcie" : "Dodaj zdjęcie"}</b>
                <small>JPG, PNG albo WEBP. Twarz na jasnym tle.</small>
              </span>
              <input id="plik-zdjecie" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => wybierzFoto(e.target.files?.[0])} />
            </label>
            {bladPliku.foto && <p className={d.bladPola}>{bladPliku.foto}</p>}
          </div>
          <div className={d.pytanie}>
            <span className={d.etykieta}>CV w PDF (nieobowiązkowe)</span>
            <label className={d.plik}>
              <span className={d.plikPdf} aria-hidden="true">
                PDF
              </span>
              <span>
                <b>{cv ? cv.name : "Dodaj CV"}</b>
                <small>{cv ? "Kliknij, żeby zmienić plik." : "Jeden plik PDF, najwyżej 3 MB."}</small>
              </span>
              <input id="plik-cv" type="file" accept="application/pdf,.pdf" onChange={(e) => wybierzCv(e.target.files?.[0])} />
            </label>
            {bladPliku.cv && <p className={d.bladPola}>{bladPliku.cv}</p>}
          </div>
        </>
      )}
      {ostatni && (
        <label className={d.zgoda}>
          <input type="checkbox" id="zgoda-pracodawcy" checked={zgoda} onChange={(e) => setZgoda(e.target.checked)} />
          <span>
            Zgadzam się, żeby mój profil po weryfikacji widzieli pracodawcy zarejestrowani w SalesBruno.pl. Zasady opisuje{" "}
            <a href="/praca/polityka-prywatnosci" target="_blank">
              polityka prywatności
            </a>
            .
          </span>
        </label>
      )}
      {blad && <p className={d.bladPola}>{blad}</p>}

      <div className={d.akcje}>
        {krok > 0 && (
          <button type="button" className={`${d.cta} ${d.ctaJasny}`} onClick={() => idzDo(krok - 1)}>
            Wstecz
          </button>
        )}
        <button type="submit" className={d.cta} disabled={stan === "wysylam"}>
          {stan === "wysylam" ? "Wysyłam…" : ostatni ? "Wyślij do weryfikacji" : "Dalej"}
        </button>
      </div>
    </form>
  );
}
