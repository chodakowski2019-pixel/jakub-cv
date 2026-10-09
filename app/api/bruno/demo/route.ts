import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";
import { firmowyEmail } from "@/lib/firmowy-email";
import { SKRZYNKA_JAKUBA } from "@/lib/bruno/mail";
import { DEMO_MINUT, slotyMiesiaca, zaproszenieIcs } from "@/lib/bruno/demo-terminy";

export const dynamic = "force-dynamic";

// Zapis na 30-minutową rozmowę z demo Bruno (USER_001 9.10), strona /brunobusiness.
// GET  = wolne terminy (pon, śr, czw, 3 dziennie, do końca miesiąca).
// POST = rezerwacja: zapis w bruno_demo (unikalny termin), mail do klienta
//        i do USER_001 z zaproszeniem .ics. Link do rozmowy wideo: BRUNO_DEMO_LINK
//        (np. stały pokój Zoom/Meet), bez niego USER_001 wysyła link ręcznie.
// Pola formularza wg Negacza (najwięcej zapisów przy minimum pól): imię, firmowy
// e-mail, telefon, stanowisko, liczba handlowców. Nazwa firmy = domena e-maila.

const ROLE = ["Sales Director / Head of Sales", "Sales Team Lead", "Business Owner / CEO", "Other"];

async function zajete(): Promise<Set<string>> {
  const { data } = await supabaseAdmin.from("bruno_demo").select("start").eq("status", "umowione").gte("start", new Date().toISOString());
  return new Set((data ?? []).map((r) => new Date(r.start as string).toISOString()));
}

export async function GET() {
  try {
    const z = await zajete();
    return NextResponse.json({ sloty: slotyMiesiaca().filter((s) => !z.has(s)), minut: DEMO_MINUT });
  } catch (e) {
    console.error("[bruno demo] terminy", e);
    return NextResponse.json({ blad: "terminy" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const pl = b.jezyk === "pl";
  const T = (en: string, plT: string) => (pl ? plT : en);
  // Pułapka na boty: ukryte pole „www”.
  if (String(b.www ?? "")) return NextResponse.json({ ok: true });

  const imie = String(b.imie ?? "").trim().slice(0, 80);
  const email = String(b.email ?? "").trim().toLowerCase().slice(0, 120);
  const telefon = String(b.telefon ?? "").replace(/[^\d+]/g, "").slice(0, 20);
  const stanowisko = ROLE.includes(String(b.stanowisko)) ? String(b.stanowisko) : null;
  const handlowcy = Math.round(Number(b.handlowcy));
  const start = new Date(String(b.start ?? ""));

  if (imie.length < 2) return NextResponse.json({ blad: T("Enter your name.", "Podaj imię.") }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !firmowyEmail(email))
    return NextResponse.json({ blad: T("Use your work email (not Gmail, Yahoo, Outlook.com).", "Podaj firmowy e-mail (nie Gmail, Yahoo, Outlook.com).") }, { status: 400 });
  if (telefon.replace(/\D/g, "").length < 7) return NextResponse.json({ blad: T("Enter a valid phone number.", "Podaj poprawny numer telefonu.") }, { status: 400 });
  if (!stanowisko) return NextResponse.json({ blad: T("Choose your role.", "Wybierz stanowisko.") }, { status: 400 });
  if (!Number.isFinite(handlowcy) || handlowcy < 1 || handlowcy > 100000)
    return NextResponse.json({ blad: T("Enter how many sales reps you have.", "Podaj liczbę handlowców.") }, { status: 400 });
  if (Number.isNaN(start.getTime()) || !slotyMiesiaca().includes(start.toISOString()))
    return NextResponse.json({ blad: T("This time is not available. Pick another one.", "Ten termin jest niedostępny. Wybierz inny.") }, { status: 400 });

  const firma = email.split("@")[1] ?? null;
  const { data, error } = await supabaseAdmin
    .from("bruno_demo")
    .insert({ start: start.toISOString(), imie, email, telefon, stanowisko, handlowcy, firma, jezyk: pl ? "pl" : "en", zrodlo: String(b.zrodlo ?? "").slice(0, 60) || null })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return NextResponse.json({ blad: T("Someone just booked this time. Pick another one.", "Ten termin właśnie się zajął. Wybierz inny.") }, { status: 409 });
    console.error("[bruno demo] zapis", error);
    return NextResponse.json({ blad: T("Could not book. Try again.", "Nie udało się zapisać. Spróbuj ponownie.") }, { status: 500 });
  }

  // Maile: błąd wysyłki nie cofa rezerwacji (termin już zajęty w bazie).
  try {
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const link = process.env.BRUNO_DEMO_LINK || "";
      const kiedyUK = new Intl.DateTimeFormat(pl ? "pl-PL" : "en-GB", { timeZone: "Europe/London", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(start);
      const kiedyPL = new Intl.DateTimeFormat("pl-PL", { timeZone: "Europe/Warsaw", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(start);
      const tytul = T("Bruno AI demo with Jakub Chodakowski", "Demo Bruno AI z Jakubem Chodakowskim");
      const opis = T(
        `${DEMO_MINUT}-minute call. I will ask about your team, then show you Bruno playing your own customer. ${link ? `Join: ${link}` : "I will send the video call link before the call."}`,
        `Rozmowa ${DEMO_MINUT} minut. Zapytam o Twój zespół, potem pokażę, jak Bruno gra Waszego klienta. ${link ? `Link: ${link}` : "Link do rozmowy wideo wyślę przed spotkaniem."}`,
      );
      const ics = zaproszenieIcs({ start: start.toISOString(), tytul, opis, organizator: "hello@jakubchodakowski.com", uczestnik: email, uid: data.id });
      const zalacznik = [{ filename: "bruno-demo.ics", content: Buffer.from(ics).toString("base64") }];
      await resend.emails.send({
        from: "Jakub Chodakowski <hello@jakubchodakowski.com>",
        to: email,
        replyTo: "hello@jakubchodakowski.com",
        subject: T(`Booked: Bruno AI demo, ${kiedyUK} (UK time)`, `Umówione: demo Bruno AI, ${kiedyUK} (czas UK)`),
        html: `<p>${T("Hi", "Cześć")} ${imie},</p><p>${T("Your call is booked", "Rozmowa umówiona")}: <b>${kiedyUK}</b> ${T("(UK time)", "(czas UK)")}, ${DEMO_MINUT} ${T("minutes", "minut")}.</p><p>${opis}</p><p>${T("The calendar invite is attached. Need another time? Just reply to this email.", "Zaproszenie do kalendarza jest w załączniku. Potrzebujesz innej godziny? Odpisz na tego maila.")}</p><p>Jakub Chodakowski<br/>Bruno AI</p>`,
        attachments: zalacznik,
      });
      await resend.emails.send({
        from: "Bruno AI <hello@jakubchodakowski.com>",
        to: SKRZYNKA_JAKUBA,
        replyTo: email,
        subject: `DEMO Bruno: ${imie}, ${firma}, ${handlowcy} handl., ${kiedyPL} (PL)`,
        html: `<h2>Nowa rozmowa z demo</h2><p><b>Kiedy:</b> ${kiedyPL} (czas PL) = ${kiedyUK} (UK)</p><p><b>Imię:</b> ${imie}<br/><b>E-mail:</b> ${email}<br/><b>Telefon:</b> ${telefon}<br/><b>Stanowisko:</b> ${stanowisko}<br/><b>Handlowców:</b> ${handlowcy}<br/><b>Firma (domena):</b> ${firma}<br/><b>Język strony:</b> ${pl ? "PL" : "EN"}</p><p>Przed rozmową: wczytaj stronę ${firma} w „Dostosuj Bruno” (moduł oferty), żeby Bruno grał ich klienta.${link ? "" : " Wyślij link do rozmowy wideo."}</p>`,
        attachments: zalacznik,
      });
    }
  } catch (e) {
    console.error("[bruno demo] mail", e);
  }

  return NextResponse.json({ ok: true, start: start.toISOString() });
}
