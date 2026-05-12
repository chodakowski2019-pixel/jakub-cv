"use client";

import { useState, useEffect } from "react";

type Props = {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
};

export default function ZoomableImage({ src, alt, className = "", containerClassName = "" }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`block w-full cursor-zoom-in ${containerClassName}`}
        aria-label={`Powiększ: ${alt}`}
      >
        <img src={src} alt={alt} className={className} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-10 cursor-zoom-out animate-in fade-in duration-200"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            className="absolute top-5 right-5 md:top-8 md:right-8 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur text-white flex items-center justify-center transition-colors"
            aria-label="Zamknij"
          >
            <span className="text-xl leading-none">×</span>
          </button>
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
