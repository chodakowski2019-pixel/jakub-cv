import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";
import { SKRZYNKA_JAKUBA } from "@/lib/bruno/mail";
import { DEMO_MINUT, ORGANIZATOR_DEMO, slotyMiesiaca, zaproszenieIcs } from "@/lib/bruno/demo-terminy";
import { mailPotwierdzenieDemo } from "@/lib/bruno/mail-demo";

export const dynamic = "force-dynamic";

// Zapis na 30-minutową rozmowę z demo Bruno (USER_001 9.10), strona /brunobusiness.
// 21.10 (USER_001): kreator 1 dzień → 2 godzina → 3 e-mail + telefon; POST na końcu = rezerwacja + maile.
// GET   = wolne terminy (pon, śr, czw, 3 dziennie, do końca miesiąca).
// POST  = { email, telefon, start } → status „umowione”, maile z zaproszeniem .ics. PATCH usunięty 21.10.
// Link do rozmowy wideo: BRUNO_DEMO_LINK (pusty = USER_001 wysyła ręcznie).
// Pola wg Negacza (minimum): imię, firmowy e-mail, telefon, stanowisko, liczba handlowców.
// 14.10 (USER_001): + nazwa firmy i co sprzedają (kolumna produkt); rozmowa TELEFONICZNA, nie wideo (BRUNO_DEMO_LINK nieużywany).

const ROLE = ["Sales Director / Head of Sales", "Sales Team Lead", "Business Owner / CEO", "Other"];

async function zajete(): Promise<Set<string>> {
  const { data } = await supabaseAdmin.from("bruno_demo").select("start").eq("status", "umowione").gte("start", new Date().toISOString());
  return new Set((data ?? []).map((r) => new Date(r.start as string).toISOString()));
}

const esc = (v: unknown) => String(v ?? "").replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]!);

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

/**
 * 21.10 (USER_001): JEDEN zapis na końcu kreatora (1 dzień → 2 godzina → 3 e-mail + telefon).
 * { email, telefon, start, jezyk, zrodlo } → od razu status „umowione” + maile z zaproszeniem .ics.
 * Pola imie / firma / handlowcy / produkt / stanowisko = opcjonalne (z panelu demo przychodzą z konta).
 * Było: POST = lead z 8 polami (status „lead”), PATCH = termin.
 */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const pl = b.jezyk === "pl";
  const T = (en: string, plT: string) => (pl ? plT : en);
  if (String(b.www ?? "")) return NextResponse.json({ ok: true });

  const imie = String(b.imie ?? "").trim().slice(0, 80);
  const email = String(b.email ?? "").trim().toLowerCase().slice(0, 120);
  const telefon = String(b.telefon ?? "").replace(/[^\d+]/g, "").slice(0, 20);
  const stanowisko = ROLE.includes(String(b.stanowisko)) ? String(b.stanowisko) : null;
  const handlowcyN = Math.round(Number(b.handlowcy));
  const handlowcy = Number.isFinite(handlowcyN) && handlowcyN >= 1 && handlowcyN <= 100000 ? handlowcyN : null;
  const nazwaFirmy = String(b.firma ?? "").trim().slice(0, 120);
  const produkt = String(b.produkt ?? "").trim().slice(0, 200) || null;
  const start = new Date(String(b.start ?? ""));

  // 21.10 (USER_001): każdy poprawny e-mail przechodzi (także gmail), etykieta na stronie zostaje „Firmowy e-mail”.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ blad: T("Enter a valid email.", "Podaj poprawny e-mail.") }, { status: 400 });
  if (telefon.replace(/\D/g, "").length < 7) return NextResponse.json({ blad: T("Enter a valid phone number.", "Podaj poprawny numer telefonu.") }, { status: 400 });
  if (Number.isNaN(start.getTime()) || !slotyMiesiaca().includes(start.toISOString()))
    return NextResponse.json({ blad: T("This time is not available. Pick another one.", "Ten termin jest niedostępny. Wybierz inny.") }, { status: 400 });

  const domena = email.split("@")[1] ?? null;
  const firma = nazwaFirmy ? `${nazwaFirmy}${domena ? ` (${domena})` : ""}` : domena;
  const wiersz = { start: start.toISOString(), status: "umowione", imie, email, telefon, stanowisko, handlowcy, firma, jezyk: pl ? "pl" : "en", zrodlo: String(b.zrodlo ?? "").slice(0, 60) || null };
  let { data, error } = await supabaseAdmin.from("bruno_demo").insert({ ...wiersz, produkt }).select("*").single();
  // 14.10: kolumna produkt z lib/bruno/sql/2026-10-14-demo-produkt.sql; bez niej zapis bez produktu.
  if (error && (error.code === "PGRST204" || error.code === "42703")) {
    ({ data, error } = await supabaseAdmin.from("bruno_demo").insert(wiersz).select("*").single());
  }
  if (error || !data) {
    if (error?.code === "23505") return NextResponse.json({ blad: T("Someone just booked this time. Pick another one.", "Ten termin właśnie się zajął. Wybierz inny.") }, { status: 409 });
    console.error("[bruno demo] rezerwacja", error);
    return NextResponse.json({ blad: T("Could not book. Try again.", "Nie udało się zapisać. Spróbuj ponownie.") }, { status: 500 });
  }

  // Maile: błąd wysyłki nie cofa rezerwacji.
  try {
    const r = resend();
    if (r) {
      // 18.10 (USER_001): SPOTKANIE ONLINE, link Jakub wysyła sam przed spotkaniem.
      const kiedyUK = new Intl.DateTimeFormat(pl ? "pl-PL" : "en-GB", { timeZone: "Europe/London", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(start);
      const kiedyPL = new Intl.DateTimeFormat("pl-PL", { timeZone: "Europe/Warsaw", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(start);
      const m = mailPotwierdzenieDemo({ imie: data.imie, start: start.toISOString(), jezyk: pl ? "pl" : "en", telefon: null });
      const ics = zaproszenieIcs({ start: start.toISOString(), tytul: m.tytulKal, opis: m.opisKal, organizator: ORGANIZATOR_DEMO, uczestnik: data.email, uid: data.id, lokalizacja: null, miejsce: pl ? "Online (link w mailu)" : "Online (link by email)" });
      const zalacznik = [{ filename: "bruno-demo.ics", content: Buffer.from(ics).toString("base64") }];
      await r.emails.send({
        from: "Jakub Chodakowski <hello@jakubchodakowski.com>",
        to: data.email,
        replyTo: "hello@jakubchodakowski.com",
        subject: m.temat,
        html: m.html,
        text: m.text,
        attachments: zalacznik,
      });
      const kto = [data.imie, data.firma, data.handlowcy ? `${data.handlowcy} handl.` : null].filter(Boolean).join(", ") || data.email;
      await r.emails.send({
        from: "Bruno AI <hello@jakubchodakowski.com>",
        to: SKRZYNKA_JAKUBA,
        replyTo: data.email,
        subject: `SPOTKANIE ONLINE Bruno: ${kto}, ${kiedyPL} (PL)`,
        html: `<h2>Spotkanie ONLINE umówione: wyślij link (Meet / Zoom) na ${data.email}</h2><p><b>Kiedy:</b> ${kiedyPL} (czas PL) = ${kiedyUK} (UK)</p><p><b>E-mail:</b> ${data.email}<br/><b>Telefon:</b> ${data.telefon}<br/><b>Imię:</b> ${esc(data.imie || "brak (formularz tylko e-mail + telefon)")}<br/><b>Firma:</b> ${esc(data.firma ?? "")}<br/><b>Stanowisko:</b> ${esc(data.stanowisko ?? "")}<br/><b>Handlowców:</b> ${data.handlowcy ?? ""}<br/><b>Co sprzedają:</b> ${esc(data.produkt ?? "")}<br/><b>Źródło:</b> ${esc(data.zrodlo ?? "")}</p><p>Przed spotkaniem: zadzwoń (${data.telefon}), zapytaj o zespół i obiekcję; wczytaj stronę firmy (${esc(domena ?? "")}) w „Dostosuj Bruno”, żeby Bruno grał ich klienta. Link do spotkania wysyłasz sam na ${data.email}.</p>`,
        attachments: zalacznik,
      });
    }
  } catch (e) {
    console.error("[bruno demo] mail", e);
  }
  return NextResponse.json({ ok: true, id: data.id, start: start.toISOString() });
}
