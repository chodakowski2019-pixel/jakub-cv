"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CV_MAKS_B, KROKI, bladPola, type Odpowiedzi, type Pytanie } from "@/lib/bruno/praca/profil-handlowca";
import { zmniejszZdjecie } from "./profil-handlowca-form";
import g from "./gielda.module.css";

// 11.11 (USER_001): panel handlowca, zakładka „Edycja profilu”: wszystkie pola profilu na jednej stronie (te same pytania
// co formularz po rejestracji, KROKI), zdjęcie, CV w PDF, linki. Zapis tym samym API co formularz:
// POST /api/bruno/praca/profil-handlowca. Po zapisie profil wraca do weryfikacji (tak działa API).
export default function ProfilEdycja({ start, zdjecie, cvNazwa, maProfil }: { start: Odpowiedzi; /** Obecne zdjęcie (link podpisany) albo null. */ zdjecie: string | null; cvNazwa: string | null; /** Profil już istnieje: zgoda na pokazanie firmom była dana przy pierwszym wysłaniu. */ maProfil: boolean }) {
  const router = useRouter();
  const [odp, setOdp] = useState<Odpowiedzi>(start);
  const [bledy, setBledy] = useState<Record<string, string>>({});
  const [zgoda, setZgoda] = useState(maProfil);
  const [stan, setStan] = useState<"" | "wysylam" | "zapisane">("");
  const [blad, setBlad] = useState("");
  const [cv, setCv] = useState<File | null>(null);
  const [foto, setFoto] = useState<Blob | null>(null);
  const [fotoPodglad, setFotoPodglad] = useState(zdjecie ?? "");
  const [bladPliku, setBladPliku] = useState<{ cv?: string; foto?: string }>({});

  function ustaw(klucz: string, wartosc: string | string[]) {
    setOdp((o) => ({ ...o, [klucz]: wartosc }));
    setBledy(({ [klucz]: _, ...reszta }) => reszta);
    setStan("");
  }
  function przelacz(p: Extract<Pytanie, { typ: "wiele" }>, v: string) {
    const teraz = (odp[p.klucz] as string[] | undefined) ?? [];
    if (teraz.includes(v)) return ustaw(p.klucz, teraz.filter((x) => x !== v));
    if (p.maks && teraz.length >= p.maks) return;
    ustaw(p.klucz, [...teraz, v]);
  }
  function wybierzCv(plik: File | undefined) {
    if (!plik) return;
    if (!/\.pdf$/i.test(plik.name)) return setBladPliku((b) => ({ ...b, cv: "CV tylko w formacie PDF." }));
    if (plik.size > CV_MAKS_B) return setBladPliku((b) => ({ ...b, cv: "Plik może mieć najwyżej 3 MB." }));
    setBladPliku((b) => ({ ...b, cv: undefined }));
    setCv(plik);
    setStan("");
  }
  async function wybierzFoto(plik: File | undefined) {
    if (!plik) return;
    const male = await zmniejszZdjecie(plik);
    if (!male) return setBladPliku((b) => ({ ...b, foto: "Zdjęcie w formacie JPG, PNG albo WEBP." }));
    setBladPliku((b) => ({ ...b, foto: undefined }));
    setFoto(male);
    setFotoPodglad(URL.createObjectURL(male));
    setStan("");
  }

  async function zapisz(e: React.FormEvent) {
    e.preventDefault();
    const b: Record<string, string> = {};
    for (const p of KROKI.flatMap((k) => k.pytania)) {
      const x = bladPola(p, odp[p.klucz]);
      if (x) b[p.klucz] = x;
    }
    setBledy(b);
    const pierwszy = Object.keys(b)[0];
    if (pierwszy) {
      document.getElementById(`pole-${pierwszy}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
      return setBlad("Popraw zaznaczone pola.");
    }
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
      if (j?.klucz) {
        setBledy({ [j.klucz]: j.blad });
        document.getElementById(`pole-${j.klucz}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      return setBlad(j?.blad ?? "Brak połączenia. Spróbuj ponownie.");
    }
    setStan("zapisane");
    setCv(null);
    setFoto(null);
    // Pasek (zdjęcie, imię) i „Mój profil” czytają dane z serwera.
    router.refresh();
  }

  const ostatni = KROKI.length - 1;
  return (
    <div className="p-strona">
      <div className="p-naglowek">
        <div>
          <h1>Edycja profilu</h1>
          <p className={g.podtytul}>Po zapisaniu zmian profil wraca do weryfikacji.</p>
        </div>
      </div>
      <form className={g.form} onSubmit={zapisz} noValidate>
        {KROKI.map((k, nr) => (
          <section className="p-karta" key={k.tytul}>
            <div className="p-karta-hd"><h3>{k.tytul}</h3></div>
            <div className="p-karta-p">
              {nr === ostatni && (
                <div className={g.dwa}>
                  <div className={g.pytanie}>
                    <span className={g.nazwa}>Zdjęcie <small>(nieobowiązkowe)</small></span>
                    <label className={g.plik}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {fotoPodglad ? <img className={g.plikFoto} src={fotoPodglad} alt="" /> : <span className={g.plikFoto} aria-hidden="true" />}
                      <span>
                        <b>{fotoPodglad ? "Zmień zdjęcie" : "Dodaj zdjęcie"}</b>
                        <small>JPG, PNG albo WEBP. Twarz na jasnym tle.</small>
                      </span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => wybierzFoto(e.target.files?.[0])} />
                    </label>
                    {bladPliku.foto && <p className={g.bladPola}>{bladPliku.foto}</p>}
                  </div>
                  <div className={g.pytanie}>
                    <span className={g.nazwa}>CV w PDF <small>(nieobowiązkowe)</small></span>
                    <label className={g.plik}>
                      <span className={g.plikPdf} aria-hidden="true">PDF</span>
                      <span>
                        <b>{cv ? cv.name : cvNazwa ?? "Dodaj CV"}</b>
                        <small>{cv || cvNazwa ? "Kliknij, żeby zmienić plik." : "Jeden plik PDF, najwyżej 3 MB."}</small>
                      </span>
                      <input type="file" accept="application/pdf,.pdf" onChange={(e) => wybierzCv(e.target.files?.[0])} />
                    </label>
                    {bladPliku.cv && <p className={g.bladPola}>{bladPliku.cv}</p>}
                  </div>
                </div>
              )}
              {k.pytania.map((p) => {
                const id = `pole-${p.klucz}`;
                const b = bledy[p.klucz];
                if (p.typ === "jedna" || p.typ === "wiele") {
                  const wybrane = p.typ === "wiele" ? ((odp[p.klucz] as string[] | undefined) ?? []) : [odp[p.klucz]];
                  return (
                    <fieldset key={p.klucz} id={id} className={g.pytanie}>
                      <legend>{p.pytanie}</legend>
                      <div className={g.opcje}>
                        {p.opcje.map((o) => (
                          <button key={o.v} type="button" aria-pressed={wybrane.includes(o.v)} className={`${g.opcja} ${wybrane.includes(o.v) ? g.opcjaWl : ""}`} onClick={() => (p.typ === "wiele" ? przelacz(p, o.v) : ustaw(p.klucz, o.v))}>
                            {o.l}
                          </button>
                        ))}
                      </div>
                      {b && <p className={g.bladPola}>{b}</p>}
                    </fieldset>
                  );
                }
                const wspolne = { id, className: g.wpis, value: (odp[p.klucz] as string | undefined) ?? "", placeholder: p.podpowiedz, maxLength: p.maks, "aria-invalid": !!b };
                return (
                  <div key={p.klucz} className={g.pytanie}>
                    <label htmlFor={id}>
                      {p.pytanie} {p.opcjonalne && <small>(nieobowiązkowe)</small>}
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
                    {b && <p className={g.bladPola}>{b}</p>}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {!maProfil && (
          <label className={g.zgoda}>
            <input type="checkbox" checked={zgoda} onChange={(e) => setZgoda(e.target.checked)} />
            <span>
              Zgadzam się, żeby mój profil po weryfikacji widzieli pracodawcy zarejestrowani w SalesBruno.pl. Zasady opisuje{" "}
              <a href="/praca/polityka-prywatnosci" target="_blank">polityka prywatności</a>.
            </span>
          </label>
        )}

        <div className={g.zapis}>
          {blad ? <span className={g.bladPola} style={{ marginTop: 0 }}>{blad}</span> : stan === "zapisane" ? <span className={g.zapisOk}>✓ Zapisane. Profil czeka na weryfikację.</span> : <span>Zmiany zapisują się po kliknięciu.</span>}
          <button type="submit" className="p-btn" disabled={stan === "wysylam"}>
            {stan === "wysylam" ? "Zapisuję…" : "Zapisz profil"}
          </button>
        </div>
      </form>
    </div>
  );
}
