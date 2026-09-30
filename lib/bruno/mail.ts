import { Resend } from "resend";

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

export function htmlKodLogowania(kod: string) {
  return ramka(`
    <p style="font-size:15px">Twój kod logowania do Bruno AI:</p>
    <p style="font-size:34px;font-weight:700;letter-spacing:0.18em;margin:12px 0">${kod}</p>
    <p style="font-size:13px;color:#64748b">Ważny 15 minut. Jeśli to nie Ty, zignoruj tę wiadomość.</p>
  `);
}

export function htmlPrzypomnienie(args: { imie: string | null; kart: number; rozmowyDzis: number; dniZostalo: number }) {
  const link = `${bazaUrl()}/bruno/panel`;
  const zostalo = Math.max(0, 3 - args.rozmowyDzis);
  return ramka(`
    <p style="font-size:15px">${args.imie ? `${args.imie}, ` : ""}plan na dziś: <b>${zostalo === 0 ? "zrobione" : `${zostalo} ${zostalo === 1 ? "rozmowa" : "rozmowy"} po 5 minut`}</b>.</p>
    ${args.kart ? `<p style="font-size:15px">Do powtórki czeka: <b>${args.kart}</b> ${args.kart === 1 ? "temat" : "tematów"}. Bruno zacznie od najsłabszego.</p>` : ""}
    <p style="margin:22px 0"><a href="${link}" style="display:inline-block;background:#0e7490;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:600">Rozmawiaj z Bruno</a></p>
    <p style="font-size:13px;color:#64748b">Dostęp testowy: ${args.dniZostalo} ${args.dniZostalo === 1 ? "dzień" : "dni"}.</p>
  `);
}

export function htmlZainteresowany(args: { email: string; imie: string | null; firma: string | null; wiadomosc: string; rozmow: number; sredniaOcena: number | null }) {
  return `
    <h2>Bruno AI: „Jestem zainteresowany"</h2>
    <p><b>Kto:</b> ${args.imie ?? ""} ${args.firma ? `(${args.firma})` : ""} &lt;${args.email}&gt;</p>
    <p><b>Rozmów w teście:</b> ${args.rozmow}${args.sredniaOcena !== null ? `, średnia ocena ${args.sredniaOcena}/10` : ""}</p>
    <p><b>Wiadomość:</b><br>${args.wiadomosc.replace(/</g, "&lt;").replace(/\n/g, "<br>") || "(brak)"}</p>
    <p style="margin-top:16px">Odpisz z tego maila (reply-to = klient) i umów rozmowę.</p>
  `;
}
