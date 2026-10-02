import { Resend } from "resend";
import { ROZMOWA_SEKUND, ROZMOW_DZIENNIE } from "./db";

// Maile Bruno AI przez Resend z hello@jakubchodakowski.com (jak reszta repo).
// Przypomnienia mailem, nie SMS: Twilio nie jest darmowy (USER_001 30.09).

const NADAWCA = "Bruno AI <hello@jakubchodakowski.com>";
export const SKRZYNKA_JAKUBA = "chodakowski2019@gmail.com";

export function bazaUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://jakubchodakowski.com").replace(/\/$/, "");
}

export function mailDziala() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function wyslij(args: { do: string; temat: string; html: string; replyTo?: string }) {
  if (!mailDziala()) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[bruno mail] RESEND_API_KEY brak, mail pominięty:", args.temat, "→", args.do);
      return { ok: true, pominiety: true };
    }
    throw new Error("Brak RESEND_API_KEY");
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: NADAWCA,
    to: args.do,
    replyTo: args.replyTo,
    subject: args.temat,
    html: args.html,
  });
  if (error) throw new Error(`Resend: ${error.message}`);
  return { ok: true };
}

const ramka = (tresc: string) => `
  <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#0f172a;line-height:1.55">
    ${tresc}
    <p style="margin-top:28px;font-size:12px;color:#94a3b8">Bruno AI, Jakub Chodakowski, NIP 6711845485. <a href="${bazaUrl()}/polityka-prywatnosci" style="color:#94a3b8">Polityka prywatności</a></p>
  </div>`;

export function htmlDostep(args: { imie: string | null; kod: string; dni: number }) {
  const link = `${bazaUrl()}/bruno`;
  return ramka(`
    <p style="font-size:15px">${args.imie ? `${args.imie}, ` : ""}Twój dostęp do Bruno AI jest gotowy. Masz <b>${args.dni} dni</b> od pierwszego logowania.</p>
    <p style="font-size:15px;margin-top:18px">Adres: <b>${link}</b></p>
    <p style="font-size:15px;margin:10px 0 4px">Kod logowania:</p>
    <p style="font-size:34px;font-weight:700;letter-spacing:0.18em;margin:0 0 4px">${args.kod}</p>
    <p style="font-size:13px;color:#64748b">Logujesz się tym samym kodem za każdym razem. Możesz go zmienić w panelu, w zakładce „Ustawienia”.</p>
    <p style="margin:22px 0"><a href="${link}" style="display:inline-block;background:#0e7490;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:600">Zaloguj się</a></p>
  `);
}

export function htmlPrzypomnienie(args: { imie: string | null; kart: number; rozmowyDzis: number; dniZostalo: number; dziennie?: number }) {
  const link = `${bazaUrl()}/bruno/panel`;
  const zostalo = Math.max(0, (args.dziennie ?? ROZMOW_DZIENNIE) - args.rozmowyDzis);
  const minuty = ROZMOWA_SEKUND / 60;
  return ramka(`
    <p style="font-size:15px">${args.imie ? `${args.imie}, ` : ""}plan na dziś: <b>${zostalo === 0 ? "zrobione" : `${zostalo} ${zostalo === 1 ? "rozmowa" : "rozmowy"} po ${minuty} ${minuty === 1 ? "minutę" : minuty < 5 ? "minuty" : "minut"}`}</b>.</p>
    ${args.kart ? `<p style="font-size:15px">Do powtórki czeka: <b>${args.kart}</b> ${args.kart === 1 ? "temat" : "tematów"}. Bruno zacznie od najsłabszego.</p>` : ""}
    <p style="margin:22px 0"><a href="${link}" style="display:inline-block;background:#0e7490;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:600">Rozmawiaj z Bruno</a></p>
    <p style="font-size:13px;color:#64748b">Dostęp testowy: ${args.dniZostalo} ${args.dniZostalo === 1 ? "dzień" : "dni"}.</p>
  `);
}

export function htmlWiadomosc(args: { email: string; imie: string | null; firma: string | null; tekst: string }) {
  return `
    <h2>Bruno AI: wiadomość z dymka w panelu</h2>
    <p><b>Od:</b> ${args.imie ?? ""} ${args.firma ? `(${args.firma})` : ""} &lt;${args.email}&gt;</p>
    <blockquote style="border-left:3px solid #0e7490;margin:12px 0;padding:6px 12px;white-space:pre-wrap">${args.tekst.replace(/</g, "&lt;")}</blockquote>
    <p style="margin-top:16px">Kliknij „Odpowiedz": reply-to = tester, odpowiedź trafi prosto do niego.</p>
  `;
}

export function htmlZainteresowany(args: { email: string; imie: string | null; firma: string | null; wiadomosc: string; rozmow: number; sredniaOcena: number | null }) {
  return `
    <h2>Bruno AI: „Chcę pełen dostęp"</h2>
    <p><b>Kto:</b> ${args.imie ?? ""} ${args.firma ? `(${args.firma})` : ""} &lt;${args.email}&gt;</p>
    <p><b>Rozmów w teście:</b> ${args.rozmow}${args.sredniaOcena !== null ? `, średnia ocena ${args.sredniaOcena}/10` : ""}</p>
    ${args.wiadomosc ? `<p><b>Wiadomość:</b><br>${args.wiadomosc.replace(/</g, "&lt;").replace(/\n/g, "<br>")}</p>` : ""}
    <p style="margin-top:16px">Obiecane: kontakt do 3 dni roboczych. Odpisz z tego maila (reply-to = klient) i umów rozmowę.</p>
  `;
}
