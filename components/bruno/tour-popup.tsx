"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Film oprowadzający przy pierwszym logowaniu (USER_001 2.10, wzór z OMG
// tour-popup: pokazuje się RAZ, dopóki bruno_konta.tour_obejrzany_at jest puste).
// Autoodtwarzanie z dźwiękiem jest blokowane przez przeglądarki, więc najpierw
// przycisk „Odtwórz". X albo „Zaczynam" oznacza film jako obejrzany.

export default function TourPopup({ src }: { src: string }) {
  const router = useRouter();
  const [otwarty, setOtwarty] = useState(true);
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

  const zamknij = async () => {
    setOtwarty(false);
    video.current?.pause();
    try {
      await fetch("/api/bruno/tour", { method: "POST" });
    } catch {}
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

  if (!otwarty) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-slate-900/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Film oprowadzający">
      <div className="relative w-full max-w-5xl">
        <button type="button" onClick={zamknij} aria-label="Zamknij" className="absolute -top-10 right-0 text-white/80 hover:text-white text-3xl leading-none px-2">
          ×
        </button>
        <div className="bruno-szklo rounded-3xl overflow-hidden bg-white">
          <div className="px-6 pt-5 pb-3 text-center">
            <div className="bruno-h2 text-xl sm:text-2xl">Cześć, tu Bruno. Pokażę ci w dwie minuty, co tu gdzie jest.</div>
          </div>
          <div className="relative bg-slate-900 aspect-[16/10]">
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
                  <svg viewBox="0 0 24 24" width="34" height="34" fill="#fff" aria-hidden><path d="M8 5v14l11-7z" /></svg>
                </span>
              </button>
            )}
          </div>
          <div className="px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-sm text-slate-500">{koniec ? "Gotowe. Zacznij od „Dostosuj Bruno”, potem pierwszy test." : "Możesz pominąć i wrócić do filmu w Ustawieniach."}</span>
            <button type="button" onClick={zamknij} className="bruno-przycisk px-6 py-2.5 text-sm">
              {koniec ? "Zaczynam" : "Pomiń"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
