"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

// Film oprowadzający przy pierwszym logowaniu (USER_001 2.10, wzór z OMG
// tour-popup: pokazuje się RAZ, dopóki bruno_konta.tour_obejrzany_at jest puste).
//
// Układ (USER_001 2.10): pełny ekran, tło panelu znika. Zostaje tylko górna
// belka z logo Bruno po lewej i „Wyloguj" po prawej, a pod nią sam film.
// Autoodtwarzanie z dźwiękiem blokują przeglądarki, więc najpierw przycisk
// „Odtwórz". „Pomiń" albo „Zaczynam" oznacza film jako obejrzany.

export default function TourPopup({ src }: { src: string }) {
  const router = useRouter();
  const [otwarty, setOtwarty] = useState(true);
  // Portal do <body>: rodzic ma backdrop-filter, a to łamie `position: fixed`
  // (ta sama pułapka co w OMG tour-popup). Bez portalu popup siedzi w panelu.
  const [zamontowany, setZamontowany] = useState(false);
  useEffect(() => setZamontowany(true), []);
  const [gra, setGra] = useState(false);
  const [koniec, setKoniec] = useState(false);
  const video = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!otwarty) return;
    const stary = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = stary;
    };
  }, [otwarty]);

  const oznaczObejrzany = async () => {
    try {
      await fetch("/api/bruno/tour", { method: "POST" });
    } catch {}
  };

  const zamknij = async () => {
    setOtwarty(false);
    video.current?.pause();
    await oznaczObejrzany();
    router.refresh();
  };

  const wyloguj = async () => {
    video.current?.pause();
    await oznaczObejrzany();
    try {
      await fetch("/api/bruno/wyloguj", { method: "POST" });
    } catch {}
    router.push("/bruno");
    router.refresh();
  };

  const odtworz = () => {
    const v = video.current;
    if (!v) return;
    v.muted = false;
    v.play()
      .then(() => setGra(true))
      .catch(() => {});
  };

  if (!otwarty || !zamontowany) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 bg-white flex flex-col" role="dialog" aria-modal="true" aria-label="Film oprowadzający">
      {/* Tło jak w panelu: białe z rozmytymi plamami. */}
      <div className="bruno-plamy" aria-hidden>
        <i style={{ top: -140, left: -100, width: 620, height: 620, opacity: 0.7, background: "radial-gradient(closest-side, #a5f3fc, transparent)" }} />
        <i style={{ top: "33%", right: -140, width: 560, height: 560, opacity: 0.6, background: "radial-gradient(closest-side, #99f6e4, transparent)" }} />
        <i style={{ bottom: -160, left: "25%", width: 640, height: 520, opacity: 0.5, background: "radial-gradient(closest-side, #bae6fd, transparent)" }} />
      </div>

      <div className="relative z-[1] flex flex-col h-full">
        <header className="bruno-szklo border-x-0 border-t-0 rounded-none shrink-0">
          <div className="h-14 px-4 sm:px-6 flex items-center justify-between">
            <span className="bruno-h2 text-lg">
              <span className="bruno-gradient-tekst">Bruno</span> AI
            </span>
            <button type="button" onClick={wyloguj} className="bruno-wyloguj inline-flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
                <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
                <path d="M14 8l4 4-4 4M18 12H9" />
              </svg>
              Wyloguj
            </button>
          </div>
        </header>

        <main className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 px-4 sm:px-6 py-5">
          <h1 className="bruno-h2 text-xl sm:text-2xl text-center">Cześć, tu Bruno. Pokażę ci, jak zacząć ze mną trening.</h1>

          <div className="relative w-full max-w-5xl rounded-3xl overflow-hidden bg-white aspect-[16/10] max-h-[62vh] shadow-[0_24px_60px_-20px_rgba(15,23,42,0.25)] border border-white/80">
            <video
              ref={video}
              src={src}
              playsInline
              preload="metadata"
              controls={gra}
              onEnded={() => setKoniec(true)}
              className="absolute inset-0 w-full h-full object-contain"
            />
            {!gra && (
              <button type="button" onClick={odtworz} aria-label="Odtwórz film" className="absolute inset-0 grid place-items-center group">
                <span className="size-20 rounded-full bg-gradient-to-br from-cyan-600 to-teal-700 grid place-items-center shadow-[0_12px_40px_rgba(14,116,144,0.5)] transition-transform group-hover:scale-105">
                  <svg viewBox="0 0 24 24" width="34" height="34" fill="#fff" aria-hidden>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-center">
            <span className="text-sm text-slate-500">
              {koniec ? "Gotowe. Zacznij od „Dostosuj Bruno”, potem pierwszy test." : "Film znajdziesz zawsze w Ustawieniach, w sekcji Instrukcja."}
            </span>
            <button type="button" onClick={zamknij} className="bruno-przycisk px-7 py-2.5 text-sm">
              {koniec ? "Zaczynam" : "Pomiń"}
            </button>
          </div>
        </main>
      </div>
    </div>,
    document.body,
  );
}
