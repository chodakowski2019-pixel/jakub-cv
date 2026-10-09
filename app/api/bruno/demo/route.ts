import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";
import { firmowyEmail } from "@/lib/firmowy-email";
import { SKRZYNKA_JAKUBA } from "@/lib/bruno/mail";
import { DEMO_MINUT, slotyMiesiaca, zaproszenieIcs } from "@/lib/bruno/demo-terminy";

export const dynamic = "force-dynamic";

// Zapis na 30-minutową rozmowę z demo Bruno (USER_001 9.10), strona /brunobusiness.
// Kreator 3 kroki (jak Gabi, ale w kolejności USER_001): 1 dane → 2 dzień → 3 godzina.
// GET   = wolne terminy (pon, śr, czw, 3 dziennie, do końca miesiąca).
// POST  = krok 1: dane osobowe. Lead zapisany OD RAZU (status „lead”), USER_001 dostaje mail,
//         nawet jeśli ktoś nie wybierze terminu (USER_001: „jak ktoś przejdzie do drugiego kroku,
//         to się zapisze od razu”). Zwraca id.
// PATCH = krok 3: { id, start } → status „umowione”, maile z zaproszeniem .ics.
// Link do rozmowy wideo: BRUNO_DEMO_LINK (pusty = USER_001 wysyła ręcznie).
// Pola wg Negacza (minimum): imię, firmowy e-mail, telefon, stanowisko, liczba handlowców.

const ROLE = ["Sales Director / Head of Sales", "Sales Team Lead", "Business Owner / CEO", "Other"];

async function zajete(): Promise<Set<string>> {
  const { data } = await supabaseAdmin.from("bruno_demo").select("start").eq("status", "umowione").gte("start", new Date().toISOString());
  return new Set((data ?? []).map((r) => new Date(r.start as string).toISOString()));
}

function resend() {
  return process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
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

/** Krok 1: dane osobowe, zapis leada od razu. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const pl = b.jezyk === "pl";
  const T = (en: string, plT: string) => (pl ? plT : en);
  if (String(b.www ?? "")) return NextResponse.json({ ok: true, id: null });

  const imie = String(b.imie ?? "").trim().slice(0, 80);
  const email = String(b.email ?? "").trim().toLowerCase().slice(0, 120);
  const telefon = String(b.telefon ?? "").replace(/[^\d+]/g, "").slice(0, 20);
  const stanowisko = ROLE.includes(String(b.stanowisko)) ? String(b.stanowisko) : null;
  const handlowcy = Math.round(Number(b.handlowcy));

  if (imie.length < 2) return NextResponse.json({ blad: T("Enter your name.", "Podaj imię.") }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !firmowyEmail(email))
    return NextResponse.json({ blad: T("Use your work email (not Gmail, Yahoo, Outlook.com).", "Podaj firmowy e-mail (nie Gmail, Yahoo, Outlook.com).") }, { status: 400 });
  if (telefon.replace(/\D/g, "").length < 7) return NextResponse.json({ blad: T("Enter a valid phone number.", "Podaj poprawny numer telefonu.") }, { status: 400 });
  if (!stanowisko) return NextResponse.json({ blad: T("Choose your role.", "Wybierz stanowisko.") }, { status: 400 });
  if (!Number.isFinite(handlowcy) || handlowcy < 1 || handlowcy > 100000)
    return NextResponse.json({ blad: T("Enter how many sales reps you have.", "Podaj liczbę handlowców.") }, { status: 400 });

  const firma = email.split("@")[1] ?? null;
  const { data, error } = await supabaseAdmin
    .from("bruno_demo")
    .insert({ start: null, status: "lead", imie, email, telefon, stanowisko, handlowcy, firma, jezyk: pl ? "pl" : "en", zrodlo: String(b.zrodlo ?? "").slice(0, 60) || null })
    .select("id")
    .single();
  if (error || !data) {
    console.error("[bruno demo] lead", error);
    return NextResponse.json({ blad: T("Could not save. Try again.", "Nie udało się zapisać. Spróbuj ponownie.") }, { status: 500 });
  }

  try {
    await resend()?.emails.send({
      from: "Bruno AI <hello@jakubchodakowski.com>",
      to: SKRZYNKA_JAKUBA,
      replyTo: email,
      subject: `LEAD Bruno (bez terminu jeszcze): ${imie}, ${firma}, ${handlowcy} handl.`,
      html: `<h2>Nowy lead z /brunobusiness (krok 1 z 3)</h2><p>Zostawił dane, terminu jeszcze nie wybrał. Jeśli w ciągu kilku minut nie przyjdzie mail „DEMO Bruno”, zadzwoń albo napisz.</p><p><b>Imię:</b> ${imie}<br/><b>E-mail:</b> ${email}<br/><b>Telefon:</b> ${telefon}<br/><b>Stanowisko:</b> ${stanowisko}<br/><b>Handlowców:</b> ${handlowcy}<br/><b>Firma (domena):</b> ${firma}<br/><b>Język strony:</b> ${pl ? "PL" : "EN"}</p>`,
    });
  } catch (e) {
    console.error("[bruno demo] mail lead", e);
  }
  return NextResponse.json({ ok: true, id: data.id });
}

/** Krok 3: wybór godziny → rezerwacja. */
export async function PATCH(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const pl = b.jezyk === "pl";
  const T = (en: string, plT: string) => (pl ? plT : en);
  const id = String(b.id ?? "");
  const start = new Date(String(b.start ?? ""));
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ blad: T("Fill in your details first.", "Najpierw uzupełnij dane.") }, { status: 400 });
  if (Number.isNaN(start.getTime()) || !slotyMiesiaca().includes(start.toISOString()))
    return NextResponse.json({ blad: T("This time is not available. Pick another one.", "Ten termin jest niedostępny. Wybierz inny.") }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("bruno_demo")
    .update({ start: start.toISOString(), status: "umowione" })
    .eq("id", id)
    .eq("status", "lead")
    .select("id, imie, email, telefon, stanowisko, handlowcy, firma")
    .maybeSingle();
  if (error) {
    if (error.code === "23505") return NextResponse.json({ blad: T("Someone just booked this time. Pick another one.", "Ten termin właśnie się zajął. Wybierz inny.") }, { status: 409 });
    console.error("[bruno demo] rezerwacja", error);
    return NextResponse.json({ blad: T("Could not book. Try again.", "Nie udało się zapisać. Spróbuj ponownie.") }, { status: 500 });
  }
  if (!data) return NextResponse.json({ blad: T("This booking is already done. Refresh the page.", "Ta rezerwacja jest już zrobiona. Odśwież stronę.") }, { status: 409 });

  // Maile: błąd wysyłki nie cofa rezerwacji.
  try {
    const r = resend();
    if (r) {
      const link = process.env.BRUNO_DEMO_LINK || "";
      const kiedyUK = new Intl.DateTimeFormat(pl ? "pl-PL" : "en-GB", { timeZone: "Europe/London", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(start);
      const kiedyPL = new Intl.DateTimeFormat("pl-PL", { timeZone: "Europe/Warsaw", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(start);
      const tytul = T("Bruno AI demo with Jakub Chodakowski", "Demo Bruno AI z Jakubem Chodakowskim");
      const opis = T(
        `${DEMO_MINUT}-minute call. I will ask about your team, then show you Bruno playing your own customer. ${link ? `Join: ${link}` : "I will send the video call link before the call."}`,
        `Rozmowa ${DEMO_MINUT} minut. Zapytam o Twój zespół, potem pokażę, jak Bruno gra Waszego klienta. ${link ? `Link: ${link}` : "Link do rozmowy wideo wyślę przed spotkaniem."}`,
      );
      const ics = zaproszenieIcs({ start: start.toISOString(), tytul, opis, organizator: "hello@jakubchodakowski.com", uczestnik: data.email, uid: data.id });
      const zalacznik = [{ filename: "bruno-demo.ics", content: Buffer.from(ics).toString("base64") }];
      await r.emails.send({
        from: "Jakub Chodakowski <hello@jakubchodakowski.com>",
        to: data.email,
        replyTo: "hello@jakubchodakowski.com",
        subject: T(`Booked: Bruno AI demo, ${kiedyUK} (UK time)`, `Umówione: demo Bruno AI, ${kiedyUK} (czas UK)`),
        html: `<p>${T("Hi", "Cześć")} ${data.imie},</p><p>${T("Your call is booked", "Rozmowa umówiona")}: <b>${kiedyUK}</b> ${T("(UK time)", "(czas UK)")}, ${DEMO_MINUT} ${T("minutes", "minut")}.</p><p>${opis}</p><p>${T("The calendar invite is attached. Need another time? Just reply to this email.", "Zaproszenie do kalendarza jest w załączniku. Potrzebujesz innej godziny? Odpisz na tego maila.")}</p><p>Jakub Chodakowski<br/>Bruno AI</p>`,
        attachments: zalacznik,
      });
      await r.emails.send({
        from: "Bruno AI <hello@jakubchodakowski.com>",
        to: SKRZYNKA_JAKUBA,
        replyTo: data.email,
        subject: `DEMO Bruno: ${data.imie}, ${data.firma}, ${data.handlowcy} handl., ${kiedyPL} (PL)`,
        html: `<h2>Rozmowa z demo umówiona</h2><p><b>Kiedy:</b> ${kiedyPL} (czas PL) = ${kiedyUK} (UK)</p><p><b>Imię:</b> ${data.imie}<br/><b>E-mail:</b> ${data.email}<br/><b>Telefon:</b> ${data.telefon}<br/><b>Stanowisko:</b> ${data.stanowisko}<br/><b>Handlowców:</b> ${data.handlowcy}<br/><b>Firma (domena):</b> ${data.firma}</p><p>Przed rozmową: wczytaj stronę ${data.firma} w „Dostosuj Bruno” (moduł oferty), żeby Bruno grał ich klienta.${link ? "" : " Wyślij link do rozmowy wideo."}</p>`,
        attachments: zalacznik,
      });
    }
  } catch (e) {
    console.error("[bruno demo] mail", e);
  }
  return NextResponse.json({ ok: true, start: start.toISOString() });
}
