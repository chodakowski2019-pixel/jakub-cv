"use client";

import { useEffect, useState, type FormEvent } from "react";

// Brama z kodem przed ofertą (USER_001 24.09: „tylko miejsce na kod i button
// Dalej"). Kod jest soft-bramką, nie zabezpieczeniem: strona ma noindex,
// a adres wysyłamy imiennie. Po wpisaniu kod siedzi w sessionStorage, więc
// odświeżenie karty nie pyta drugi raz. Wygląd taki sam jak oferta pod spodem
// (biała karta, Poppins w nagłówku, niebieski przycisk).

export function BramaKodu({
  kod,
  klucz,
  children,
}: {
  kod: string;
  /** Klucz do sessionStorage, osobny na każdą ofertę. */
  klucz: string;
  children: React.ReactNode;
}) {
  // null = jeszcze nie sprawdzone (pierwszy render po stronie serwera).
  const [otwarte, setOtwarte] = useState<boolean | null>(null);
  const [wpis, setWpis] = useState("");
  const [blad, setBlad] = useState(false);

  useEffect(() => {
    try {
      setOtwarte(sessionStorage.getItem(`brama:${klucz}`) === "1");
    } catch {
      setOtwarte(false);
    }
  }, [klucz]);

  const sprawdz = (e: FormEvent) => {
    e.preventDefault();
    if (wpis.replace(/\s/g, "") === kod) {
      try {
        sessionStorage.setItem(`brama:${klucz}`, "1");
      } catch {}
      setOtwarte(true);
    } else {
      setBlad(true);
    }
  };

  if (otwarte === null) return <div className="min-h-screen bg-white" />;
  if (otwarte) return <>{children}</>;

  return (
    <div className="grid min-h-screen place-items-center bg-white px-5 text-[#1d1d1f] antialiased">
      <form
        onSubmit={sprawdz}
        className="w-full max-w-sm rounded-3xl border border-black/[0.08] bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_12px_40px_-24px_rgba(0,0,0,0.12)]"
      >
        <label
          htmlFor="kod"
          // USER_001 24.09: pogrubione, wyśrodkowane, czarne.
          className="block text-center text-[11px] font-bold uppercase tracking-[0.2em] text-[#1d1d1f]"
        >
          Kod dostępu
        </label>
        <input
          id="kod"
          name="kod"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          value={wpis}
          onChange={(e) => {
            setWpis(e.target.value);
            setBlad(false);
          }}
          aria-invalid={blad}
          className={`mt-3 w-full rounded-2xl border bg-[#f5f5f7] px-4 py-3.5 text-center text-2xl tracking-[0.3em] outline-none transition-colors focus:border-[#0071e3] focus:bg-white ${
            blad ? "border-red-500" : "border-black/[0.08]"
          }`}
          style={{ fontFamily: "var(--font-poppins), ui-sans-serif, system-ui, sans-serif", fontWeight: 600 }}
        />
        {blad && <p className="mt-2 text-sm text-red-600">Nieprawidłowy kod.</p>}
        <button
          type="submit"
          className="mt-5 w-full rounded-full bg-[#0071e3] px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(0,113,227,0.28)] transition-colors hover:bg-[#0060c2]"
        >
          Dalej
        </button>
      </form>
    </div>
  );
}
