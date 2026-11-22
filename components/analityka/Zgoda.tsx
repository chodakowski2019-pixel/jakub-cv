"use client";

// 22.11.2026: baner zgód + wszystkie narzędzia analityczne i piksele marki jakubchodakowski.com.
// Wzór: zwiazki-lp/src/components/zgoda-cookies.tsx (lovemyself): skrypt narzędzia NIE trafia do strony przed zgodą
// (to mocniej niż sam Google Consent Mode, gdzie skrypt startuje i tylko deklaruje brak zbierania).
// Dwie zgody: analityka (GA4, Clarity) i marketing (Google Ads, Meta, TikTok, LinkedIn). Identyfikatory: lib/analityka.ts.
// Cofnięcie zgody: przycisk „Ustawienia cookies” w stopce (UstawieniaCookies niżej). Odebranie zgody przeładowuje stronę,
// bo załadowanego skryptu nie da się wyjąć ze strony.

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { ANALITYKA, KLUCZ_ZGODY, ZDARZENIE_OTWORZ_ZGODY, czytajZgody, hostMarki, hostTestowy, type Zgody } from "@/lib/analityka";
import "./zgoda.css";

// Strony Bruno, które lokalnie (localhost) żyją w tym samym repo. Na jakubchodakowski.com i tak przekierowują na salesbruno.
const SCIEZKI_BRUNO = ["/bruno", "/praca", "/start", "/pro", "/academy", "/akademia", "/wyszukiwarka", "/formularzbruno", "/podglad/bruno", "/handlowcy"];

type Okno = Window & { fbq?: (...a: unknown[]) => void; ttq?: { page: () => void } };

const JEST_NARZEDZIE = Object.values(ANALITYKA).some(Boolean);

function Skrypty({ z }: { z: Zgody }) {
  const sciezka = usePathname();
  const pierwsza = useRef(true);
  const { ga4, googleAds, clarity, metaPixel, tiktokPixel, linkedinPartner } = ANALITYKA;
  const gtagId = (z.analityka && ga4) || (z.marketing && googleAds) || "";
  const zgoda = (t: boolean) => (t ? "granted" : "denied");

  // Odsłona przy przejściu między podstronami bez przeładowania (GA4 liczy to sam przez „Pomiar zaawansowany”).
  useEffect(() => {
    if (pierwsza.current) {
      pierwsza.current = false;
      return;
    }
    const w = window as Okno;
    w.fbq?.("track", "PageView");
    w.ttq?.page();
  }, [sciezka]);

  return (
    <>
      {gtagId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gtagId}`} strategy="afterInteractive" />
          <Script id="jc-gtag" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
gtag('consent','default',{analytics_storage:'${zgoda(z.analityka)}',ad_storage:'${zgoda(z.marketing)}',ad_user_data:'${zgoda(z.marketing)}',ad_personalization:'${zgoda(z.marketing)}'});
gtag('js',new Date());
${z.analityka && ga4 ? `gtag('config','${ga4}');` : ""}
${z.marketing && googleAds ? `gtag('config','${googleAds}');` : ""}`}
          </Script>
        </>
      )}
      {z.analityka && clarity && (
        // id NIE może brzmieć „clarity” (lekcja z lovemyself: window.clarity psuje snippet).
        <Script id="jc-ms-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window,document,"clarity","script","${clarity}");window.clarity("consent");`}
        </Script>
      )}
      {z.marketing && metaPixel && (
        <Script id="jc-meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${metaPixel}');fbq('track','PageView');`}
        </Script>
      )}
      {z.marketing && tiktokPixel && (
        <Script id="jc-tiktok-pixel" strategy="afterInteractive">
          {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};
n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
ttq.load('${tiktokPixel}');ttq.page();}(window,document,'ttq');`}
        </Script>
      )}
      {z.marketing && linkedinPartner && (
        <Script id="jc-linkedin-insight" strategy="afterInteractive">
          {`window._linkedin_data_partner_ids=window._linkedin_data_partner_ids||[];window._linkedin_data_partner_ids.push("${linkedinPartner}");
(function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=[]}
var s=document.getElementsByTagName("script")[0];var b=document.createElement("script");b.type="text/javascript";b.async=true;
b.src="https://snap.licdn.com/li.lms-analytics/insight.min.js";s.parentNode.insertBefore(b,s);})(window.lintrk);`}
        </Script>
      )}
    </>
  );
}

export default function Zgoda() {
  const sciezka = usePathname() ?? "";
  const [host, setHost] = useState<{ marka: boolean; test: boolean } | null>(null);
  const [zgody, setZgody] = useState<Zgody | null>(null);
  const [baner, setBaner] = useState(false);
  const [ustawienia, setUstawienia] = useState(false);
  const [szkic, setSzkic] = useState<Zgody>({ analityka: false, marketing: false });
  const zgodyRef = useRef<Zgody | null>(null);

  useEffect(() => {
    setHost({ marka: hostMarki(location.host), test: hostTestowy(location.host) });
    const z = czytajZgody();
    zgodyRef.current = z;
    setZgody(z);
    setBaner(z === null);
    const otworz = () => {
      setSzkic(zgodyRef.current ?? { analityka: false, marketing: false });
      setUstawienia(true);
      setBaner(true);
    };
    window.addEventListener(ZDARZENIE_OTWORZ_ZGODY, otworz);
    return () => window.removeEventListener(ZDARZENIE_OTWORZ_ZGODY, otworz);
  }, []);

  function zapisz(nowe: Zgody) {
    const stare = zgodyRef.current;
    try {
      localStorage.setItem(KLUCZ_ZGODY, JSON.stringify({ ...nowe, data: new Date().toISOString() }));
    } catch {
      // zapis się nie udał, decyzja działa do końca wizyty
    }
    zgodyRef.current = nowe;
    setZgody(nowe);
    setBaner(false);
    setUstawienia(false);
    if (stare && ((stare.analityka && !nowe.analityka) || (stare.marketing && !nowe.marketing))) location.reload();
  }

  if (!host?.marka || SCIEZKI_BRUNO.some((p) => sciezka.startsWith(p))) return null;
  // 22.11: dopóki w lib/analityka.ts nie ma żadnego numeru, na żywej stronie nie ma o co pytać, więc baneru nie ma.
  // Lokalnie (localhost) baner jest zawsze, żeby dało się go oglądać.
  if (!host.test && !JEST_NARZEDZIE) return null;

  return (
    <>
      {zgody && !host.test && <Skrypty z={zgody} />}
      {baner && (
        <div className="jcz" role="dialog" aria-label="Zgoda na pliki cookies">
          <div className="jcz-karta">
            <p className="jcz-tekst">
              Używam plików cookies do statystyk i reklam. Włączam je tylko za zgodą.{" "}
              <a href="/polityka-prywatnosci#cookies">Polityka prywatności</a>
            </p>
            {ustawienia && (
              <div className="jcz-opcje">
                <label className="jcz-opcja">
                  <input type="checkbox" checked disabled />
                  <span>
                    <b>Niezbędne</b> Działanie strony. Zawsze włączone.
                  </span>
                </label>
                <label className="jcz-opcja">
                  <input type="checkbox" checked={szkic.analityka} onChange={(e) => setSzkic({ ...szkic, analityka: e.target.checked })} />
                  <span>
                    <b>Statystyki</b> Google Analytics i Microsoft Clarity. Pokazują, co działa na stronie.
                  </span>
                </label>
                <label className="jcz-opcja">
                  <input type="checkbox" checked={szkic.marketing} onChange={(e) => setSzkic({ ...szkic, marketing: e.target.checked })} />
                  <span>
                    <b>Marketing</b> Meta, TikTok, LinkedIn i Google Ads. Mierzą reklamy.
                  </span>
                </label>
              </div>
            )}
            <div className="jcz-przyciski">
              {ustawienia ? (
                <button type="button" className="jcz-btn" onClick={() => zapisz(szkic)}>
                  Zapisz wybór
                </button>
              ) : (
                <button type="button" className="jcz-btn" onClick={() => { setSzkic(zgody ?? { analityka: false, marketing: false }); setUstawienia(true); }}>
                  Ustawienia
                </button>
              )}
              <button type="button" className="jcz-btn" onClick={() => zapisz({ analityka: false, marketing: false })}>
                Odrzuć
              </button>
              <button type="button" className="jcz-btn jcz-btn-glowny" onClick={() => zapisz({ analityka: true, marketing: true })}>
                Akceptuję
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Przycisk w stopce: ponowne otwarcie ustawień zgód (RODO: cofnięcie zgody ma być tak łatwe jak jej udzielenie). */
export function UstawieniaCookies({ className, przed }: { className?: string; przed?: React.ReactNode }) {
  const [widac, setWidac] = useState(JEST_NARZEDZIE);
  useEffect(() => {
    if (hostTestowy(location.host)) setWidac(true);
  }, []);
  if (!widac) return null;
  return (
    <>
    {przed}
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(ZDARZENIE_OTWORZ_ZGODY))}>
      Ustawienia cookies
    </button>
    </>
  );
}
