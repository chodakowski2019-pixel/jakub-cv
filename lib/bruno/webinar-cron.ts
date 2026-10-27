import { supabaseAdmin } from "@/lib/supabase";
import { wyslij } from "./mail";
import { NADAWCA_WEBINARU, mailWebinarDzis, mailWebinarJutro, mailWebinarStart, mailWebinarZaGodzine } from "./mail-webinar";
import { DOMENA } from "./domeny";
import { WEBINAR, dataPLDzis } from "./webinar";

// 27.10 (USER_001): przypomnienia o webinarze. Wołane z /api/bruno/przypomnienia w przebiegu o 8:00 PL
// (cron Vercela 6 i 7 UTC, przepuszczany tylko ten o 8:00 czasu polskiego; plan Hobby = raz dziennie).
//  - dzień przed (3.11, 8:00): M1 „jutro” do każdego bez `mail_jutro`,
//  - w dniu (4.11, 8:00): M2 „dziś” do każdego bez `mail_dzis` + plan w Resend (scheduledAt): M3 18:00, M4 18:55.
// Kto zapisze się 4.11 po 8:00, dostaje M0 (z linkiem) i nic więcej: cron już nie biegnie, a to wystarcza.
// Każdy krok pilnuje własnej kolumny, więc drugi przebieg tego samego dnia nic nie dubluje.

type Zapis = { id: number; imie: string; email: string; mail_jutro: string | null; mail_dzis: string | null; resend_za_godzine: string | null; resend_start: string | null };

const REPLY_TO = "hello@jakubchodakowski.com";

export async function webinarCron(teraz = new Date()): Promise<{ dzien: string; jutro: number; dzis: number; zaplanowane: number; bledy: number } | { dzien: string; pominieto: string }> {
  const dzien = dataPLDzis(teraz);
  if (dzien !== WEBINAR.dataPLDzienPrzed && dzien !== WEBINAR.dataPL) return { dzien, pominieto: "nie dzień webinaru ani dzień przed" };

  const { data, error } = await supabaseAdmin.from("bruno_webinar_zapisy").select("id, imie, email, mail_jutro, mail_dzis, resend_za_godzine, resend_start").eq("webinar", WEBINAR.klucz);
  if (error) {
    console.error("[bruno webinar cron] baza", error.message);
    return { dzien, pominieto: `baza: ${error.message}` };
  }
  const zapisy = (data ?? []) as Zapis[];
  const baza = DOMENA.pl;
  const wynik = { dzien, jutro: 0, dzis: 0, zaplanowane: 0, bledy: 0 };

  for (const z of zapisy) {
    try {
      if (dzien === WEBINAR.dataPLDzienPrzed && !z.mail_jutro) {
        const m = mailWebinarJutro({ imie: z.imie, baza });
        await wyslij({ do: z.email, od: NADAWCA_WEBINARU, replyTo: REPLY_TO, rodzaj: "webinar", temat: m.temat, html: m.html });
        await supabaseAdmin.from("bruno_webinar_zapisy").update({ mail_jutro: new Date().toISOString() }).eq("id", z.id);
        wynik.jutro++;
      }
      if (dzien === WEBINAR.dataPL) {
        if (!z.mail_dzis) {
          const m = mailWebinarDzis({ imie: z.imie, baza });
          await wyslij({ do: z.email, od: NADAWCA_WEBINARU, replyTo: REPLY_TO, rodzaj: "webinar", temat: m.temat, html: m.html });
          await supabaseAdmin.from("bruno_webinar_zapisy").update({ mail_dzis: new Date().toISOString() }).eq("id", z.id);
          wynik.dzis++;
        }
        // Resend przyjmuje scheduledAt do 72 h naprzód, 8:00 → 18:00 tego dnia mieści się z zapasem.
        if (!z.resend_za_godzine) {
          const m = mailWebinarZaGodzine({ imie: z.imie });
          const r = await wyslij({ do: z.email, od: NADAWCA_WEBINARU, replyTo: REPLY_TO, rodzaj: "webinar", temat: m.temat, html: m.html, scheduledAt: new Date(WEBINAR.start - 60 * 60 * 1000).toISOString() });
          await supabaseAdmin.from("bruno_webinar_zapisy").update({ resend_za_godzine: r.id ?? "pominiety" }).eq("id", z.id);
          wynik.zaplanowane++;
        }
        if (!z.resend_start) {
          const m = mailWebinarStart({ imie: z.imie });
          const r = await wyslij({ do: z.email, od: NADAWCA_WEBINARU, replyTo: REPLY_TO, rodzaj: "webinar", temat: m.temat, html: m.html, scheduledAt: new Date(WEBINAR.start - 5 * 60 * 1000).toISOString() });
          await supabaseAdmin.from("bruno_webinar_zapisy").update({ resend_start: r.id ?? "pominiety" }).eq("id", z.id);
          wynik.zaplanowane++;
        }
      }
    } catch (e) {
      wynik.bledy++;
      console.error("[bruno webinar cron]", z.email, e);
    }
  }
  return wynik;
}
