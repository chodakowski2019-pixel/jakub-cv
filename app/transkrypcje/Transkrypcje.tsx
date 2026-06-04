"use client";

import { useEffect, useRef, useState } from "react";
import { extractVideoId, buildWatchUrl, thumbUrl, buildShareLink } from "@/lib/transkrypcje/youtube";

type Phase = "idle" | "loading" | "paywall" | "redirecting" | "success" | "canceled";

const PROMO_WINDOW = 143; // 2:23
// Stripe Payment Links. jobId doczepiamy jako client_reference_id -> webhook wie,
// który film/job obsłużyć i komu wysłać PDF. Dwa linki = dynamiczna cena z licznika.
const PAY_LINK_PROMO = "https://buy.stripe.com/aFa00i56EfSc0g53jOebu02"; // 4,97 zł
const PAY_LINK_FULL = "https://buy.stripe.com/6oUdR8dDagWg8MB1bGebu03"; // 15 zł
const LOADING_STEPS = [
  "Pobieram audio z YouTube…",
  "Transkrybuję mowę…",
  "Analizuję treść…",
  "Składam streszczenie…",
];

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function VideoCard({ id, title }: { id: string; title: string | null }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.1] bg-white/[0.04] mb-5 text-left">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={thumbUrl(id)} alt="" className="w-24 h-14 object-cover rounded-lg flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-sm text-white leading-snug line-clamp-2">{title || "Film z YouTube"}</p>
      </div>
    </div>
  );
}

export default function Transkrypcje({ initialId }: { initialId?: string } = {}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [remaining, setRemaining] = useState(PROMO_WINDOW);
  const [creatorMode, setCreatorMode] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoRan = useRef(false);

  // odczyt parametrów wejściowych (deep-link z komentarza, powrót ze Stripe, tryb twórcy)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success")) {
      setPhase("success");
      return;
    }
    if (params.get("canceled")) {
      setPhase("canceled");
      return;
    }
    if (params.get("creator") === "1") {
      setCreatorMode(true);
      return;
    }

    const deep = params.get("v") ?? params.get("url");
    const id = initialId ?? (deep ? extractVideoId(deep) : null);
    if (id && !autoRan.current) {
      autoRan.current = true;
      const canonical = buildWatchUrl(id);
      setUrl(canonical);
      setVideoId(id);
      // tytuł filmu (best-effort)
      fetch(`/api/transkrypcje/oembed?v=${id}`)
        .then((r) => r.json())
        .then((d) => d.title && setVideoTitle(d.title))
        .catch(() => {});
      // auto-start flow
      void runGenerate(canonical);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // animacja kroków podczas "ładowania"
  useEffect(() => {
    if (phase !== "loading") return;
    const id = setInterval(() => setStepIdx((i) => (i + 1) % LOADING_STEPS.length), 800);
    return () => clearInterval(id);
  }, [phase]);

  // licznik promocji — deadline w localStorage (per film), żeby refresh nie resetował
  useEffect(() => {
    if (phase !== "paywall") return;
    const key = `promo_deadline_${videoId ?? "default"}`;
    let deadline = Number(localStorage.getItem(key));
    if (!deadline) {
      deadline = Date.now() + PROMO_WINDOW * 1000;
      localStorage.setItem(key, String(deadline));
    }
    const tick = () => setRemaining(Math.max(0, Math.round((deadline - Date.now()) / 1000)));
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, videoId]);

  const promoActive = remaining > 0;
  const priceLabel = promoActive ? "4,97 zł" : "15,00 zł";

  async function runGenerate(targetUrl: string) {
    setError(null);
    if (!targetUrl.trim()) {
      setError("Wklej link do filmu z YouTube.");
      return;
    }
    setPhase("loading");
    setStepIdx(0);
    const startedAt = Date.now();
    try {
      const res = await fetch("/api/transkrypcje/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Coś poszło nie tak.");
      const wait = Math.max(0, 3200 - (Date.now() - startedAt));
      setTimeout(() => {
        setJobId(data.jobId);
        setPhase("paywall");
      }, wait);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd serwera.");
      setPhase("idle");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = extractVideoId(url);
    if (id) {
      setVideoId(id);
      fetch(`/api/transkrypcje/oembed?v=${id}`)
        .then((r) => r.json())
        .then((d) => d.title && setVideoTitle(d.title))
        .catch(() => {});
    }
    void runGenerate(url);
  }

  function handlePay() {
    if (!jobId) return;
    setPhase("redirecting");
    // promo aktywne -> link 4,97; po wygaśnięciu licznika -> link 15 zł
    const link = remaining > 0 ? PAY_LINK_PROMO : PAY_LINK_FULL;
    window.location.href = `${link}?client_reference_id=${encodeURIComponent(jobId)}`;
  }

  return (
    <main className="min-h-screen px-6 py-20 flex flex-col items-center">
      <style>{`@keyframes softpulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.82 } }`}</style>
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <span className="inline-block w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 mb-5" />
          <h1 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4 bg-gradient-to-b from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
            Nie masz czasu oglądać? Przeczytaj
          </h1>
          <div className="text-neutral-100 max-w-lg mx-auto leading-relaxed text-lg">
            <p className="mb-3">
              Zaoszczędź <span className="text-cyan-300">90% czasu</span> i otrzymaj:
            </p>
            <ul className="inline-block text-left space-y-1.5 mb-4">
              {["najważniejsze punkty filmu", "streszczenie", "pełną transkrypcję"].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <span className="text-cyan-400">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <p>PDF na maila w minutę, po polsku.</p>
          </div>
        </div>

        {/* TRYB TWÓRCY — generator linków do komentarzy */}
        {creatorMode && <CreatorGenerator />}

        {/* SUCCESS */}
        {phase === "success" && (
          <div className="rounded-2xl border border-cyan-500/40 bg-white/[0.05] backdrop-blur-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">Płatność przyjęta! 🎉</h2>
            <p className="text-neutral-300">
              Twój PDF z transkrypcją i streszczeniem jest w drodze na podany e-mail. Dotrze w ciągu
              kilku minut — sprawdź też folder SPAM.
            </p>
            <button
              onClick={() => {
                window.history.replaceState({}, "", "/transkrypcje");
                setPhase("idle");
                setUrl("");
                setJobId(null);
                setVideoId(null);
                setVideoTitle(null);
              }}
              className="mt-6 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-medium"
            >
              Zrób kolejną
            </button>
          </div>
        )}

        {/* CANCELED */}
        {phase === "canceled" && (
          <div className="rounded-2xl border border-white/[0.1] bg-white/[0.04] backdrop-blur-xl p-8 text-center">
            <h2 className="text-xl font-bold text-white mb-2">Płatność anulowana</h2>
            <p className="text-neutral-300 mb-6">Nic nie pobraliśmy. Możesz spróbować ponownie.</p>
            <button
              onClick={() => {
                window.history.replaceState({}, "", "/transkrypcje");
                setPhase("idle");
              }}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-medium"
            >
              Wróć
            </button>
          </div>
        )}

        {/* FORM */}
        {!creatorMode && (phase === "idle" || phase === "loading") && (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-white/[0.08] bg-white/[0.05] backdrop-blur-xl p-6">
            {videoId && <VideoCard id={videoId} title={videoTitle} />}
            <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-2">
              Link do filmu YouTube
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              disabled={phase === "loading"}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white placeholder-neutral-500 outline-none focus:border-cyan-400/60 transition-colors disabled:opacity-50"
            />
            {error && <p className="text-rose-400 text-sm mt-3">{error}</p>}
            <button
              type="submit"
              disabled={phase === "loading"}
              className="mt-4 w-full px-6 py-3.5 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:hover:scale-100"
            >
              {phase === "loading" ? "Przetwarzam…" : "Zamień film w tekst"}
            </button>

            {phase === "loading" && (
              <div className="mt-6 flex items-center justify-center gap-3 text-neutral-300 text-sm">
                <span className="w-4 h-4 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
                <span>{LOADING_STEPS[stepIdx]}</span>
              </div>
            )}
          </form>
        )}

        {/* SEKCJA SPRZEDAŻOWA — tylko na ekranie startowym */}
        {!creatorMode && phase === "idle" && (
          <div className="mt-12">
            {/* Korzyści */}
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { ico: "⏱️", t: "Odzyskaj swój czas", d: "2 godziny filmu? Przeczytasz esencję w 2 minuty." },
                { ico: "📄", t: "Nic Ci nie umknie", d: "Pełna transkrypcja, streszczenie i lista kluczowych punktów — w jednym PDF." },
                { ico: "🇵🇱", t: "Po polsku, każdy film", d: "Wykład, podcast, wywiad, szkolenie — bez względu na język oryginału." },
              ].map((b, i) => (
                <div key={i} className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.05] backdrop-blur-xl">
                  <div className="text-2xl mb-3">{b.ico}</div>
                  <h3 className="text-white font-semibold mb-1.5">{b.t}</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">{b.d}</p>
                </div>
              ))}
            </div>

            {/* Jak to działa */}
            <div className="mt-10">
              <h2 className="text-center text-sm uppercase tracking-widest text-neutral-400 mb-6">Jak to działa</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { n: "1", t: "Wklej link", d: "Skopiuj adres filmu z YouTube i wklej powyżej." },
                  { n: "2", t: "My robimy robotę", d: "Transkrybujemy i streszczamy w kilka sekund." },
                  { n: "3", t: "Czytaj zamiast oglądać", d: "Cała wartość filmu ląduje w PDF na Twoim mailu." },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 text-white text-sm font-bold flex items-center justify-center">
                      {s.n}
                    </span>
                    <div>
                      <p className="text-white font-medium text-sm">{s.t}</p>
                      <p className="text-neutral-400 text-sm leading-relaxed">{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dla kogo + zaufanie */}
            <div className="mt-10 text-center">
              <p className="text-neutral-400 text-sm">
                Dla każdego, kto ma za dużo do obejrzenia i za mało czasu:{" "}
                <span className="text-neutral-200">studenci · twórcy · dziennikarze · marketerzy</span>
              </p>
              <p className="text-neutral-500 text-xs mt-3">
                Jednorazowa płatność. Bez subskrypcji. Plik prosto na Twój e-mail.
              </p>
            </div>
          </div>
        )}

        {/* PAYWALL — prawdziwy popup (overlay na całą stronę) */}
        {(phase === "paywall" || phase === "redirecting") && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <div className="w-full max-w-md rounded-2xl border border-cyan-500/40 bg-[#0d161d] shadow-2xl shadow-cyan-500/20 p-7 text-center">
              <h2 className="text-2xl font-bold text-white mb-3">Twoje streszczenie jest gotowe!</h2>
              {videoId && <VideoCard id={videoId} title={videoTitle} />}

              <div className="flex items-center justify-center gap-3 mb-3 mt-5">
                {promoActive && <span className="text-neutral-500 line-through text-lg">15,00 zł</span>}
                <span className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                  {priceLabel}
                </span>
              </div>

              {promoActive ? (
                <div className="mb-5 px-4 py-3 rounded-xl border-2 border-red-500/80 bg-red-600/20 animate-[softpulse_2.2s_ease-in-out_infinite]">
                  <p className="text-red-100 text-sm">Cena promocyjna kończy się za…</p>
                  <p className="font-mono font-bold text-3xl text-white mt-1">{fmt(remaining)}</p>
                </div>
              ) : (
                <p className="text-sm text-neutral-400 mb-5">Promocja zakończona.</p>
              )}

              {error && <p className="text-rose-400 text-sm mb-3">{error}</p>}

              <button
                onClick={handlePay}
                disabled={phase === "redirecting"}
                className="w-full px-6 py-3.5 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
              >
                {phase === "redirecting" ? "Przekierowanie…" : "Chcę otrzymać streszczenie"}
              </button>
              <p className="text-[11px] text-neutral-500 mt-3">Bezpieczna płatność przez Stripe.</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// Generator linków do wklejania w komentarzach pod filmami (tylko /transkrypcje?creator=1)
function CreatorGenerator() {
  const [src, setSrc] = useState("");
  const [copied, setCopied] = useState(false);
  const [title, setTitle] = useState<string | null>(null);
  const id = extractVideoId(src);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = id ? buildShareLink(origin, id, title ?? undefined) : "";

  // pobierz tytuł, gdy mamy poprawne ID -> ładniejszy link
  useEffect(() => {
    if (!id) {
      setTitle(null);
      return;
    }
    let alive = true;
    fetch(`/api/transkrypcje/oembed?v=${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (alive && d.title) setTitle(d.title);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-white/[0.05] backdrop-blur-xl p-6 mb-8">
      <h2 className="text-lg font-bold text-white mb-1">Generator linku do komentarza</h2>
      <p className="text-neutral-400 text-sm mb-4">
        Wklej link do filmu. Dostaniesz gotowy link — wstaw go w komentarzu pod tym filmem.
      </p>
      <input
        type="url"
        value={src}
        onChange={(e) => {
          setSrc(e.target.value);
          setCopied(false);
        }}
        placeholder="https://www.youtube.com/watch?v=…"
        className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white placeholder-neutral-500 outline-none focus:border-cyan-400/60 transition-colors"
      />
      {src && !id && <p className="text-rose-400 text-sm mt-3">To nie wygląda na link YouTube.</p>}
      {link && (
        <div className="mt-4">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.04] border border-white/[0.1]">
            <code className="text-cyan-300 text-sm truncate flex-1">{link}</code>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(link);
                setCopied(true);
              }}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-xs font-semibold flex-shrink-0"
            >
              {copied ? "Skopiowano ✓" : "Kopiuj"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
