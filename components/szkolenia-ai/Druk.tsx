"use client";

// „Oferta do druku (PDF)”: drugi, lżejszy krok dla osoby, która musi pokazać ofertę szefowi.
// Przed drukiem otwiera wszystkie pytania, żeby odpowiedzi trafiły na kartkę.
export default function Druk({ napis }: { napis: string }) {
  return (
    <button
      type="button"
      className="btn puste druk"
      onClick={() => {
        document.querySelectorAll<HTMLDetailsElement>(".sza .pytania details").forEach((d) => (d.open = true));
        window.print();
      }}
    >
      {napis}
    </button>
  );
}
