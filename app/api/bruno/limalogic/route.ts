import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { SKRZYNKA_JAKUBA, wyslij } from "@/lib/bruno/mail";
import { akapit, kopertaBruno, kroki, przycisk, tabelaParami } from "@/lib/bruno/szablon-mail.mjs";
import { ANALIZA, KLIENT, LINK_PLATNOSC, WERSJA, zl } from "@/app/oferta/limalogic/dane";

export const dynamic = "force-dynamic";

// 5.11 (USER_001): akceptacja umowy „Analiza sprzedaży” z salesbruno.pl/oferta/limalogic. Zapis do bruno_zamowienia
// (pakiet 2 = analiza jak opłata startowa pakietu 2, wybory w `uwagi`), potem mail TYLKO do Jakuba (do klienta nic z automatu:
// potwierdzenie z PDF, fakturę i link do płatności wysyła USER_001 sam). Zapis w bazie nie blokuje maila.

const STRONA = "https://salesbruno.pl/oferta/limalogic";
const PDF = "https://salesbruno.pl/pdf/umowa-limalogic.pdf";
const MAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const podpis = String(b.podpis ?? "").trim().replace(/\s+/g, " ").slice(0, 120);
  const email = String(b.email ?? "").trim().toLowerCase().slice(0, 200);
  const telefon = String(b.telefon ?? "").trim().slice(0, 40) || null;
  if (podpis.split(" ").length < 2) return NextResponse.json({ blad: "Wpisz imię i nazwisko jako podpis." }, { status: 400 });
  if (!MAIL_OK.test(email)) return NextResponse.json({ blad: "E-mail niepoprawny." }, { status: 400 });
  if (b.umowa !== true) return NextResponse.json({ blad: "Brak akceptacji umowy." }, { status: 400 });

  const teraz = new Date();
  const data = teraz.toLocaleString("pl-PL", { timeZone: "Europe/Warsaw", dateStyle: "long", timeStyle: "short" });
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;
  const agent = (req.headers.get("user-agent") ?? "").slice(0, 300);
  const wybory = { wersja: WERSJA, produkt: "analiza-sprzedazy", podpis, umowa: PDF, data, ip };

  let id: number | null = null;
  try {
    const { data: w, error } = await supabaseAdmin
      .from("bruno_zamowienia")
      .insert({
        pakiet: 2,
        konta: 0,
        firma: KLIENT.nazwa,
        nip: KLIENT.nip,
        email,
        telefon,
        osoby: [KLIENT.email],
        uwagi: JSON.stringify(wybory),
        kwota_start: ANALIZA.cena,
        kwota_miesiac: 0,
        wersja_oferty: WERSJA,
        regulamin_at: teraz.toISOString(),
        polityka_at: teraz.toISOString(),
        ip,
        agent,
      })
      .select("id")
      .single();
    if (error) console.error("[bruno limalogic] zapis", error.message);
    else id = w.id;
  } catch (err) {
    console.error("[bruno limalogic] zapis", err);
  }

  const wiersze: [string, string][] = [
    ["Zakres", "Umowa: analiza sprzedaży (bez Bruno)"],
    ["Klient", `${KLIENT.nazwa}, NIP ${KLIENT.nip}, KRS ${KLIENT.krs}`],
    ["Podpisał", `${podpis}, ${KLIENT.funkcja}`],
    ["Data i godzina", data],
    ["Kwota", `${zl(ANALIZA.cena)} jednorazowo, 100 % z góry, faktura 7 dni`],
    ["E-mail / telefon", `${email}${telefon ? ` / ${telefon}` : ""}`],
  ];
  const html = kopertaBruno({
    jezyk: "pl",
    naglowek: `LIMALOGIC PODPISAŁ: analiza sprzedaży (${zl(ANALIZA.cena)})`,
    tresc: [
      akapit(`Akceptacja ze strony ${STRONA}. IP ${ip ?? "?"}. Zamówienie nr ${id ?? "brak zapisu w bazie"}.`),
      tabelaParami(wiersze),
      przycisk({ tekst: "Umowa (PDF)", link: PDF }),
      kroki(
        [
          `WYŚLIJ SAM do Łukasza: potwierdzenie z umową (PDF ${PDF}) + faktura ${zl(ANALIZA.cena)} + link do płatności${LINK_PLATNOSC ? ` ${LINK_PLATNOSC}` : " (Stripe, do utworzenia)"}. Z automatu nic nie poszło.`,
          "Po wpłacie: link do formularza + 2 konta do sprawdzianu mentalnego (Łukasz + 1 osoba).",
          "Umówić spotkanie online 60 min w jego terminie (grudzień).",
          "Lejek B2B PL: Limalogic → podpisane.",
        ],
        { tytul: "Co dalej" },
      ),
    ].join("\n"),
  });

  try {
    await wyslij({ do: SKRZYNKA_JAKUBA, temat: `LIMALOGIC PODPISAŁ: analiza sprzedaży, ${zl(ANALIZA.cena)}`, html, replyTo: email, rodzaj: "inny" });
  } catch (err) {
    console.error("[bruno limalogic] mail do Jakuba", err);
    return NextResponse.json({ blad: "Zapisane, ale mail nie wyszedł. Napisz do mnie, że podpisałeś." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id });
}
