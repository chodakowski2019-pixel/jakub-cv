import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { SKRZYNKA_JAKUBA, wyslij } from "@/lib/bruno/mail";
import { akapit, kopertaBruno, kroki, przycisk, tabelaParami } from "@/lib/bruno/szablon-mail.mjs";
import { BRUNO, CRM, HANDLOWCZYNIE, KLIENT, LINK_PLATNOSC_1, WERSJA, policz, zl, type Nagrania, type Platnosc, type Wariant } from "@/app/oferta/ewatex/dane";

export const dynamic = "force-dynamic";

// 4.11 (USER_001): akceptacja umów Ewatex z salesbruno.pl/oferta/ewatex. Zapis do bruno_zamowienia (jak /oferta/zamowienie:
// pakiet 1 = Bruno, 3 = Bruno + CRM; wybory w `uwagi`), potem mail z podsumowaniem do Ewy i do Jakuba (forma dokumentowa).
// Zapis w bazie nie blokuje maila: brak wiersza = log, mail i tak idzie.

const STRONA = "https://salesbruno.pl/oferta/ewatex";
const PDF = "https://salesbruno.pl/pdf/umowa-ewatex.pdf";
const MAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  // 4.11: Ewa bierze oba (decyzja z USER_001), opcja „sam Bruno” nie istnieje na stronie.
  // Bruno z góry za 3 mies., płatne z drugą ratą CRM; nagrania zostają (standard). Bez wyboru na stronie.
  const wariant: Wariant = "oba";
  const platnosc: Platnosc = "zgory";
  const nagrania: Nagrania = "standard";
  const podpis = String(b.podpis ?? "").trim().replace(/\s+/g, " ").slice(0, 120);
  const email = String(b.email ?? "").trim().toLowerCase().slice(0, 200);
  const telefon = String(b.telefon ?? "").trim().slice(0, 40) || null;
  const trzecia = String(b.trzecia ?? "").trim().toLowerCase().slice(0, 200);
  if (podpis.split(" ").length < 2) return NextResponse.json({ blad: "Wpisz imię i nazwisko jako podpis." }, { status: 400 });
  if (!MAIL_OK.test(email)) return NextResponse.json({ blad: "E-mail niepoprawny." }, { status: 400 });
  if (trzecia && !MAIL_OK.test(trzecia)) return NextResponse.json({ blad: "E-mail trzeciej handlowczyni niepoprawny." }, { status: 400 });
  // 5.11: jedna zgoda = umowa (PDF) + polityka prywatności + powierzenie danych.
  if (b.umowa !== true) return NextResponse.json({ blad: "Brak akceptacji umowy." }, { status: 400 });

  const teraz = new Date();
  const data = teraz.toLocaleString("pl-PL", { timeZone: "Europe/Warsaw", dateStyle: "long", timeStyle: "short" });
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;
  const agent = (req.headers.get("user-agent") ?? "").slice(0, 300);
  const k = policz(wariant, platnosc);
  const oba = wariant === "oba";
  const osoby = [KLIENT.email, ...HANDLOWCZYNIE.map((h) => h.email), ...(trzecia ? [trzecia] : [])];
  const wybory = { wersja: WERSJA, wariant, platnosc, nagrania, podpis, trzecia: trzecia || null, umowa: PDF, data, ip };

  let id: number | null = null;
  try {
    const { data: w, error } = await supabaseAdmin
      .from("bruno_zamowienia")
      .insert({
        pakiet: oba ? 3 : 1,
        konta: BRUNO.konta,
        firma: KLIENT.nazwa,
        nip: KLIENT.nip,
        email,
        telefon,
        osoby,
        uwagi: JSON.stringify(wybory),
        kwota_start: k.start,
        kwota_miesiac: k.kolejne + k.utrzymanie,
        wersja_oferty: WERSJA,
        regulamin_at: teraz.toISOString(),
        polityka_at: teraz.toISOString(),
        ip,
        agent,
      })
      .select("id")
      .single();
    if (error) console.error("[bruno ewatex] zapis", error.message);
    else id = w.id;
  } catch (err) {
    console.error("[bruno ewatex] zapis", err);
  }

  const wiersze: [string, string][] = [
    ["Zakres", "Umowa współpracy: Bruno AI + CRM (1 umowa)"],
    ["Klient", `${KLIENT.nazwa}, NIP ${KLIENT.nip}, KRS ${KLIENT.krs}`],
    ["Podpisała", `${podpis}, ${KLIENT.funkcja}`],
    ["Data i godzina", data],
    ["Bruno", `${BRUNO.konta} konta × ${zl(BRUNO.cenaKonto)}, ${BRUNO.okresMiesiecy} mies., razem ${zl(BRUNO.trzyMiesiace)}, płatne z drugą ratą CRM, potem decyzja`],
    ["Nagrania", "zostają (standard)"],
    ["CRM", `${zl(CRM.budowaZBruno)} (50 % teraz, 50 % po odbiorze) + utrzymanie ${zl(CRM.utrzymanie)}/mies.`],
    ["Dziś na fakturze", `${zl(k.start)} (zaliczka CRM)`],
    ["Po odbiorze CRM", `${zl(k.drugaRata)} (${zl(k.crm / 2)} CRM + ${zl(k.bruno)} Bruno)`],
    ["Konta", osoby.join(", ")],
  ];
  const tresc = () =>
    kopertaBruno({
      jezyk: "pl",
      naglowek: `EWATEX PODPISAŁA: ${oba ? "Bruno + CRM" : "Bruno"} (${zl(k.start)})`,
      tresc: [
        akapit(`Akceptacja ze strony ${STRONA}. IP ${ip ?? "?"}. Zamówienie nr ${id ?? "brak zapisu w bazie"}.`),
        tabelaParami(wiersze),
        przycisk({ tekst: "Umowa (PDF)", link: PDF }),
        kroki(
          [
            `WYŚLIJ SAM do Ewy: potwierdzenie z umową (PDF ${PDF}) + link Stripe ${LINK_PLATNOSC_1} na ${zl(k.start)}. Z automatu nic nie poszło.`,
            "Po wpłacie: faktura, konta Bruno + panel Ewy.",
            "Lejek B2B PL: Ewatex → podpisane.",
            "Umówić: dzień 7 spotkanie z handlowczynią, dzień 14 z Ewą (odbiór).",
          ],
          { tytul: "Co dalej" },
        ),
      ].join("\n"),
    });

  // 5.11 (USER_001): do Ewy NIC nie idzie z automatu. Potwierdzenie z umową i fakturę wysyła USER_001 sam. Mail tylko do Jakuba.
  try {
    await wyslij({ do: SKRZYNKA_JAKUBA, temat: `EWATEX PODPISAŁA: ${oba ? "Bruno + CRM" : "Bruno"}, ${zl(k.start)}`, html: tresc(), replyTo: email, rodzaj: "inny" });
  } catch (err) {
    console.error("[bruno ewatex] mail do Jakuba", err);
    return NextResponse.json({ blad: "Zapisane, ale mail nie wyszedł. Napisz SMS, że podpisałaś." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id });
}
