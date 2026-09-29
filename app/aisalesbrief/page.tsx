"use client";

import AiSalesBriefForm from "@/components/aisales-brief-form";

// Ankieta wdrożeniowa Bruno AI jako samodzielna strona (link wysyłany klientowi).
// Sam formularz mieszka w components/aisales-brief-form.tsx, bo od 29.09 pokazuje
// się też na /aisaleskontakt zaraz po wysłaniu formularza kontaktowego.
// Wygląd przepisany z /aisaleskontakt (jasne szkło).
const TLO = "#ffffff";

export default function AiSalesBriefPage() {
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
        <AiSalesBriefForm />
      </main>
    </div>
  );
}
