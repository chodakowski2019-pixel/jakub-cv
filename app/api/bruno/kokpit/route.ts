import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto } from "@/lib/bruno/db";
import { pobierzFirme } from "@/lib/bruno/firmy";
import { widokKonta } from "@/lib/bruno/jako";
import { tDla } from "@/lib/bruno/i18n";
import {
  crmWlaczony,
  dodajNotatke,
  dodajZadanie,
  domenaPipedrive,
  nowyDeal,
  notatkiDeala,
  lejekFirmy,
  przesunEtap,
  zadaniaDeala,
  zamknijDeal,
  zmienWartosc,
  type Deal,
  type Lejek,
} from "@/lib/bruno/lejek";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// 4.11 (USER_001): KOKPIT. Handlowiec pisze / mówi, Claude z narzędziami zapisuje w Pipedrive firmy:
// notatka, etap, zadanie, nowy deal, wygrany / przegrany, wartość. Handlowiec widzi i zmienia TYLKO swoje deale
// (pole „Handlowiec Bruno” = jego e-mail), szef wszystkie. Każdy zapis wraca jako „akcja” do listy w kokpicie.
// Tylko firma demo z tokenem (crmWlaczony). Model: BRUNO_KOKPIT_MODEL, domyślnie Opus 5.5.

const MODEL = process.env.BRUNO_KOKPIT_MODEL ?? "claude-opus-5-5";
const MAX_KROKOW = 8;

type Akcja = { opis: string; link?: string | null };

const NARZEDZIA: Anthropic.Tool[] = [
  {
    name: "lista_deali",
    description: "Lista deali z CRM widocznych dla użytkownika (tytuł, id, etap, status, wartość, osoba, firma, handlowiec, ostatnia zmiana). Użyj, żeby znaleźć id deala po nazwie klienta albo odpowiedzieć na pytanie o lejek.",
    input_schema: {
      type: "object",
      properties: {
        szukaj: { type: "string", description: "Fragment tytułu, nazwiska osoby albo nazwy firmy. Puste = wszystkie." },
        status: { type: "string", enum: ["open", "won", "lost", "all"], description: "Domyślnie open." },
        handlowiec: { type: "string", description: "E-mail albo imię handlowca (tylko szef)." },
      },
      additionalProperties: false,
    },
  },
  {
    name: "szczegoly_deala",
    description: "Notatki (10 ostatnich) i zadania jednego deala.",
    input_schema: { type: "object", properties: { deal_id: { type: "integer" } }, required: ["deal_id"], additionalProperties: false },
  },
  {
    name: "dodaj_notatke",
    description: "Dopisuje notatkę do deala (np. z rozmowy albo spotkania). Treść po polsku lub angielsku, krótko, fakty: co ustalono, czego klient chce, obiekcje, następny krok.",
    input_schema: { type: "object", properties: { deal_id: { type: "integer" }, tresc: { type: "string" } }, required: ["deal_id", "tresc"], additionalProperties: false },
  },
  {
    name: "przesun_etap",
    description: "Przesuwa deal na inny etap lejka. Podaj etap_id z listy etapów w kontekście.",
    input_schema: { type: "object", properties: { deal_id: { type: "integer" }, etap_id: { type: "integer" } }, required: ["deal_id", "etap_id"], additionalProperties: false },
  },
  {
    name: "dodaj_zadanie",
    description: "Zakłada zadanie / przypomnienie przy dealu (telefon, mail, spotkanie, wysłać ofertę). Data w formacie YYYY-MM-DD, godzina HH:MM opcjonalnie.",
    input_schema: {
      type: "object",
      properties: {
        deal_id: { type: "integer" },
        temat: { type: "string" },
        data: { type: "string", description: "YYYY-MM-DD" },
        godzina: { type: "string", description: "HH:MM, opcjonalnie" },
        typ: { type: "string", enum: ["call", "meeting", "email", "task"], description: "Domyślnie task." },
      },
      required: ["deal_id", "temat", "data"],
      additionalProperties: false,
    },
  },
  {
    name: "nowy_deal",
    description: "Zakłada nowy deal w CRM (i osobę / firmę, jeśli podane). Przypisany do użytkownika. etap_id z listy etapów, domyślnie pierwszy.",
    input_schema: {
      type: "object",
      properties: {
        tytul: { type: "string" },
        wartosc: { type: "number" },
        osoba: { type: "string" },
        organizacja: { type: "string" },
        etap_id: { type: "integer" },
      },
      required: ["tytul"],
      additionalProperties: false,
    },
  },
  {
    name: "zamknij_deal",
    description: "Oznacza deal jako wygrany albo przegrany. Przy przegranym podaj powód jednym zdaniem.",
    input_schema: {
      type: "object",
      properties: { deal_id: { type: "integer" }, status: { type: "string", enum: ["won", "lost"] }, powod: { type: "string" } },
      required: ["deal_id", "status"],
      additionalProperties: false,
    },
  },
  {
    name: "zmien_wartosc",
    description: "Zmienia wartość deala (kwota).",
    input_schema: { type: "object", properties: { deal_id: { type: "integer" }, wartosc: { type: "number" } }, required: ["deal_id", "wartosc"], additionalProperties: false },
  },
  {
    name: "trenuj_rozmowe",
    description: "Użytkownik chce poćwiczyć / potrenować rozmowę (np. „trenuj rozmowy”, „przećwiczmy”, „zagraj klienta”). Otwiera trening głosowy 1:1 z Bruno. Jeśli chodzi o konkretny deal, podaj deal_id, wtedy Bruno zagra tego klienta na jego etapie. Bez deal_id = trening ogólny.",
    input_schema: { type: "object", properties: { deal_id: { type: "integer" }, temat: { type: "string", description: "Na czym skupić trening (obiekcja, etap), opcjonalnie." } }, additionalProperties: false },
  },
];

/** 5.11 (pkt 3): załącznik (PDF / nagranie) = tekst doklejony do wiadomości użytkownika. */
type Zalacznik = { nazwa: string; typ: "pdf" | "audio"; tekst: string };
const zZalacznikami = (tresc: string, z: Zalacznik[] | undefined) =>
  !z?.length ? tresc : `${tresc}\n\n${z.map((x) => `[Załącznik: ${x.nazwa} (${x.typ === "audio" ? "nagranie, transkrypcja" : "PDF"})]\n${x.tekst.slice(0, 50000)}\n[Koniec załącznika]`).join("\n\n")}`;

function dealDoTekstu(d: Deal, lejek: Lejek, imiona: Map<string, string>) {
  const etap = lejek.etapy.find((e) => e.id === d.etap_id)?.nazwa ?? d.etap_id;
  return `#${d.id} „${d.tytul}” · etap: ${etap} · ${d.status} · ${d.wartosc} ${d.waluta}${d.osoba ? ` · osoba: ${d.osoba}` : ""}${d.organizacja ? ` · firma: ${d.organizacja}` : ""}${d.handlowiec ? ` · handlowiec: ${imiona.get(d.handlowiec) ?? d.handlowiec}` : ""}${d.aktualizacja ? ` · zmiana: ${d.aktualizacja.slice(0, 10)}` : ""}${d.powod_przegranej ? ` · powód: ${d.powod_przegranej}` : ""}`;
}

export async function POST(req: Request) {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ blad: "401" }, { status: 401 });
  const konto = await pobierzKonto(email);
  const t = tDla(konto?.jezyk);
  const firma = await pobierzFirme(konto?.firma_id);
  if (!konto || !crmWlaczony(firma) || !firma) return NextResponse.json({ blad: t("CRM not connected.", "CRM nie jest podpięty.") }, { status: 403 });
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ blad: "Brak ANTHROPIC_API_KEY." }, { status: 500 });

  const b = (await req.json().catch(() => ({}))) as { wiadomosci?: { rola: string; tresc: string; zalaczniki?: Zalacznik[] }[] };
  const historia = (b.wiadomosci ?? [])
    .filter((w) => (w.rola === "user" || w.rola === "assistant") && (typeof w.tresc === "string" && w.tresc.trim() || w.zalaczniki?.length))
    .map((w) => ({ rola: w.rola, tresc: w.rola === "user" ? zZalacznikami(String(w.tresc ?? "").trim() || "(tylko załącznik)", w.zalaczniki) : String(w.tresc ?? "") }))
    .slice(-20);
  if (!historia.length || historia[historia.length - 1].rola !== "user") return NextResponse.json({ blad: t("Empty message.", "Pusta wiadomość.") }, { status: 400 });

  // 8.11: firma bez Pipedrive = domyślny pusty lejek; narzędzia zapisu odpowiadają „CRM niepodpięty”.
  const token = firma.pipedrive_token ?? "";
  // 4.11: szef w „Bruno handlowca” (?jako=) rozmawia jak ten handlowiec: widzi i zmienia tylko jego deale.
  const w = await widokKonta(konto, firma, new URL(req.url).searchParams.get("jako"));
  const szef = w.szef;
  const ja = w.konto.email.toLowerCase();
  const imieKonta = w.konto.imie ?? w.konto.email;
  const jezyk = konto.jezyk === "pl" ? "pl" : "en";

  let lejek: Lejek;
  let handlowcy: { email: string; imie: string }[];
  try {
    [lejek, handlowcy] = await Promise.all([
      lejekFirmy(firma),
      Promise.resolve((szef ? w.handlowcy : [w.konto]).map((x) => ({ email: x.email.toLowerCase(), imie: x.imie ?? x.email }))),
    ]);
  } catch (e) {
    return NextResponse.json({ blad: `CRM: ${String((e as Error)?.message ?? e)}` }, { status: 502 });
  }
  const imiona = new Map(handlowcy.map((h) => [h.email, h.imie]));
  const domena = token ? await domenaPipedrive(token) : null;
  const linkDeala = (id: number) => (domena ? `${domena}/deal/${id}` : null);

  const widoczne = () => (szef ? lejek.deale : lejek.deale.filter((d) => d.handlowiec === ja));
  const mojDeal = (id: number): Deal => {
    const d = widoczne().find((x) => x.id === id);
    if (!d) throw new Error(szef ? `Nie ma deala #${id} w tym lejku.` : `Deal #${id} nie jest Twój albo nie istnieje.`);
    return d;
  };

  const dzis = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });
  const system = [
    `Jesteś Bruno, asystentem CRM firmy „${firma.nazwa}”. Użytkownik: ${imieKonta} (${szef ? "szef, widzi cały zespół" : "handlowiec, widzi tylko swoje deale"}). Dziś: ${dzis}.`,
    `Zadanie: użytkownik opowiada, co się wydarzyło (spotkanie, telefon, ustalenia), albo pyta o lejek. Ty SAM wykonujesz zmiany w CRM narzędziami: notatka, etap, zadanie, nowy deal, wygrany/przegrany, wartość. Nie pytaj o potwierdzenie przy oczywistych rzeczach; dopytaj TYLKO, gdy nie wiesz, o który deal chodzi (kilka pasuje) albo brakuje daty zadania.`,
    `Zasady: najpierw znajdź deal (lista_deali z „szukaj”), potem zapisuj. Notatka = fakty z wypowiedzi, krótko, bez wymyślania. „Do piątku” = policz datę od dziś. Po zapisie odpowiedz 1-3 zdaniami: co zapisałeś i jaki jest następny krok. Odpowiadaj ${jezyk === "pl" ? "po polsku" : "in American English"}, prosto, bez żargonu.`,
    `Format odpowiedzi: krótko. Maks 3 zdania albo lista do 5 punktów („- ”). Nazwy klientów, kwoty i daty pogrub (**tak**). Bez nagłówków, bez tabel, bez emoji, bez powtarzania pytania.`,
    `Załączniki: użytkownik może dołączyć PDF (oferta, umowa) albo nagranie rozmowy (transkrypcja w treści między [Załącznik] i [Koniec załącznika]). Wtedy: znajdź deal (z treści albo z wiadomości), zapisz notatkę ze streszczeniem (ustalenia, kwoty, obiekcje, następny krok, max 8 linii) i jeśli z treści wynika zadanie albo etap, zrób to też. Odpowiedz 3 najważniejszymi faktami. Jeśli nie wiesz, do którego deala, zapytaj jednym zdaniem.`,
    `Trening: gdy użytkownik chce ćwiczyć / trenować rozmowę, wywołaj trenuj_rozmowe (z deal_id, jeśli mówi o kliencie). Odpowiedz jednym zdaniem.`,
    !token ? `CRM NIE JEST PODPIĘTY: nie masz klientów ani deali. Pomagaj jako trener i doradca sprzedaży (plan rozmowy, odpowiedź na obiekcję, mail, analiza nagrania), proponuj trening. Nie udawaj zapisu w CRM.` : "",
    `Etapy lejka „${lejek.pipeline.nazwa}” (id: nazwa): ${lejek.etapy.map((e) => `${e.id}: ${e.nazwa}`).join(", ")}.`,
    `Handlowcy: ${handlowcy.map((h) => `${h.imie} <${h.email}>`).join(", ")}.`,
    `Deale użytkownika (otwarte, ${Math.min(widoczne().filter((d) => d.status === "open").length, 80)} z ${widoczne().filter((d) => d.status === "open").length}):\n${widoczne()
      .filter((d) => d.status === "open")
      .slice(0, 80)
      .map((d) => dealDoTekstu(d, lejek, imiona))
      .join("\n")}`,
  ].filter(Boolean).join("\n\n");

  const klient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  // 8.11: ostatnia wiadomość (z transkrypcją załącznika) do 60 000 znaków; wcześniej cięło do 3 000 i nagranie znikało.
  const messages: Anthropic.MessageParam[] = historia.map((w, i) => ({ role: w.rola as "user" | "assistant", content: w.tresc.slice(0, i === historia.length - 1 ? 60000 : 3000) }));
  const akcje: Akcja[] = [];
  let przekieruj: string | null = null;

  const wykonaj = async (nazwa: string, input: Record<string, unknown>): Promise<string> => {
    if (!token && nazwa !== "trenuj_rozmowe" && nazwa !== "lista_deali") return "CRM nie jest jeszcze podpięty, nic nie zapisano. Powiedz to użytkownikowi jednym zdaniem i pomóż bez zapisu (rada, plan rozmowy, trening).";
    switch (nazwa) {
      case "trenuj_rozmowe": {
        const id = Number(input.deal_id);
        const d = Number.isFinite(id) && id > 0 ? widoczne().find((x) => x.id === id) ?? null : null;
        const temat = typeof input.temat === "string" ? input.temat.trim().slice(0, 300) : "";
        if (d) {
          const etap = lejek.etapy.find((e) => e.id === d.etap_id)?.nazwa ?? "?";
          const n = await notatkiDeala(token, d.id, 4).catch(() => []);
          const sytuacja = [
            jezyk === "pl" ? `Zagraj klienta: ${d.osoba ?? "osoba decyzyjna"}${d.organizacja ? ` z firmy ${d.organizacja}` : ""}. Deal „${d.tytul}”, wartość ${d.wartosc} ${d.waluta}, etap lejka: ${etap}.` : `Play the customer: ${d.osoba ?? "decision maker"}${d.organizacja ? ` from ${d.organizacja}` : ""}. Deal “${d.tytul}”, value ${d.wartosc} ${d.waluta}, stage: ${etap}.`,
            n.length ? (jezyk === "pl" ? `Co wiemy z notatek: ${n.map((x) => x.tresc).join(" | ").slice(0, 900)}.` : `From notes: ${n.map((x) => x.tresc).join(" | ").slice(0, 900)}.`) : "",
            temat ? (jezyk === "pl" ? `Skup się na: ${temat}.` : `Focus on: ${temat}.`) : "",
          ].filter(Boolean).join(" ");
          przekieruj = `/bruno/rozmowa?sytuacja=${encodeURIComponent(sytuacja.slice(0, 2900))}`;
          akcje.push({ opis: `${t("Training", "Trening")}: ${d.tytul}`, link: null });
          return `Otwieram trening: Bruno zagra ${d.osoba ?? d.tytul}.`;
        }
        przekieruj = temat ? `/bruno/rozmowa?sytuacja=${encodeURIComponent(temat)}` : "/bruno/rozmowa";
        akcje.push({ opis: t("Training opened", "Trening otwarty"), link: null });
        return "Otwieram trening rozmów.";
      }
      case "lista_deali": {
        const szukaj = String(input.szukaj ?? "").trim().toLowerCase();
        const status = String(input.status ?? "open");
        const kto = String(input.handlowiec ?? "").trim().toLowerCase();
        let lista = widoczne();
        if (status !== "all") lista = lista.filter((d) => d.status === status);
        if (szukaj) lista = lista.filter((d) => [d.tytul, d.osoba, d.organizacja].some((x) => (x ?? "").toLowerCase().includes(szukaj)));
        if (kto && szef) lista = lista.filter((d) => d.handlowiec === kto || (imiona.get(d.handlowiec ?? "") ?? "").toLowerCase() === kto);
        if (!lista.length) return "Brak deali pasujących do kryteriów.";
        return lista.slice(0, 60).map((d) => dealDoTekstu(d, lejek, imiona)).join("\n");
      }
      case "szczegoly_deala": {
        const d = mojDeal(Number(input.deal_id));
        const [n, z] = await Promise.all([notatkiDeala(token, d.id), zadaniaDeala(token, d.id)]);
        return `${dealDoTekstu(d, lejek, imiona)}\nNotatki:\n${n.map((x) => `- ${x.kiedy.slice(0, 10)}: ${x.tresc}`).join("\n") || "-"}\nZadania:\n${z.map((x) => `- ${x.data} ${x.zrobione ? "✓" : "○"} ${x.temat} (${x.typ})`).join("\n") || "-"}`;
      }
      case "dodaj_notatke": {
        const d = mojDeal(Number(input.deal_id));
        const tresc = String(input.tresc ?? "").trim().slice(0, 4000);
        if (!tresc) throw new Error("Pusta notatka.");
        await dodajNotatke(token, d.id, `<p>${tresc.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c).replace(/\n/g, "<br>")}</p><p><i>${imieKonta} przez Bruno</i></p>`);
        akcje.push({ opis: `${t("Note added", "Notatka dodana")}: ${d.tytul}`, link: linkDeala(d.id) });
        return `Notatka zapisana w dealu #${d.id}.`;
      }
      case "przesun_etap": {
        const d = mojDeal(Number(input.deal_id));
        const etap = lejek.etapy.find((e) => e.id === Number(input.etap_id));
        if (!etap) throw new Error("Nie ma takiego etapu.");
        await przesunEtap(token, d.id, etap.id);
        d.etap_id = etap.id;
        akcje.push({ opis: `${d.tytul} → ${etap.nazwa}`, link: linkDeala(d.id) });
        return `Deal #${d.id} jest teraz na etapie „${etap.nazwa}”.`;
      }
      case "dodaj_zadanie": {
        const d = mojDeal(Number(input.deal_id));
        const data = String(input.data ?? "");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) throw new Error("Data musi być w formacie YYYY-MM-DD.");
        const godzina = typeof input.godzina === "string" && /^\d{2}:\d{2}$/.test(input.godzina) ? input.godzina : null;
        const temat = String(input.temat ?? "").trim().slice(0, 250);
        await dodajZadanie(token, { dealId: d.id, temat, data, godzina, typ: typeof input.typ === "string" ? input.typ : "task" });
        akcje.push({ opis: `${t("Task", "Zadanie")} ${data}${godzina ? ` ${godzina}` : ""}: ${temat} (${d.tytul})`, link: linkDeala(d.id) });
        return `Zadanie „${temat}” na ${data} dodane do deala #${d.id}.`;
      }
      case "nowy_deal": {
        const tytul = String(input.tytul ?? "").trim().slice(0, 250);
        if (!tytul) throw new Error("Brak tytułu deala.");
        const etapId = typeof input.etap_id === "number" && lejek.etapy.some((e) => e.id === input.etap_id) ? input.etap_id : lejek.etapy[0]?.id ?? null;
        const r = await nowyDeal(token, {
          tytul,
          wartosc: typeof input.wartosc === "number" ? input.wartosc : 0,
          waluta: lejek.deale[0]?.waluta ?? "PLN",
          etapId,
          osoba: typeof input.osoba === "string" ? input.osoba : null,
          organizacja: typeof input.organizacja === "string" ? input.organizacja : null,
          handlowiec: ja,
          poleHandlowca: lejek.pole_handlowca,
        });
        lejek.deale.push({
          id: r.id,
          tytul,
          etap_id: etapId ?? 0,
          status: "open",
          wartosc: typeof input.wartosc === "number" ? input.wartosc : 0,
          waluta: lejek.deale[0]?.waluta ?? "PLN",
          handlowiec: ja,
          osoba: typeof input.osoba === "string" ? input.osoba : null,
          organizacja: typeof input.organizacja === "string" ? input.organizacja : null,
          aktualizacja: null,
          powod_przegranej: null,
          nastepna_aktywnosc: null,
          nastepna_aktywnosc_temat: null,
          ostatni_kontakt: null,
          dodano: null,
        });
        akcje.push({ opis: `${t("New deal", "Nowy deal")}: ${tytul}`, link: linkDeala(r.id) });
        return `Deal #${r.id} „${tytul}” założony.`;
      }
      case "zamknij_deal": {
        const d = mojDeal(Number(input.deal_id));
        const status = input.status === "won" ? "won" : "lost";
        await zamknijDeal(token, d.id, status, typeof input.powod === "string" ? input.powod : null);
        d.status = status;
        akcje.push({ opis: `${d.tytul}: ${status === "won" ? t("won", "wygrany") : t("lost", "przegrany")}`, link: linkDeala(d.id) });
        return `Deal #${d.id} oznaczony jako ${status}.`;
      }
      case "zmien_wartosc": {
        const d = mojDeal(Number(input.deal_id));
        const w = Number(input.wartosc);
        if (!Number.isFinite(w) || w < 0) throw new Error("Zła kwota.");
        await zmienWartosc(token, d.id, w);
        d.wartosc = w;
        akcje.push({ opis: `${d.tytul}: ${w} ${d.waluta}`, link: linkDeala(d.id) });
        return `Wartość deala #${d.id} = ${w} ${d.waluta}.`;
      }
      default:
        throw new Error(`Nieznane narzędzie ${nazwa}.`);
    }
  };

  try {
    let odpowiedz = "";
    for (let krok = 0; krok < MAX_KROKOW; krok++) {
      const res = await klient.messages.create({
        model: MODEL,
        max_tokens: 4000,
        system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
        tools: NARZEDZIA,
        messages,
      });
      if (res.stop_reason === "refusal") {
        odpowiedz = t("I can't help with that here.", "Nie mogę tego tu zrobić.");
        break;
      }
      const tekst = res.content.filter((c): c is Anthropic.TextBlock => c.type === "text").map((c) => c.text).join("\n").trim();
      const wywolania = res.content.filter((c): c is Anthropic.ToolUseBlock => c.type === "tool_use");
      if (!wywolania.length) {
        odpowiedz = tekst;
        break;
      }
      messages.push({ role: "assistant", content: res.content });
      const wyniki: Anthropic.ToolResultBlockParam[] = [];
      for (const w of wywolania) {
        try {
          const out = await wykonaj(w.name, (w.input ?? {}) as Record<string, unknown>);
          wyniki.push({ type: "tool_result", tool_use_id: w.id, content: out });
        } catch (e) {
          wyniki.push({ type: "tool_result", tool_use_id: w.id, content: `Błąd: ${String((e as Error)?.message ?? e)}`, is_error: true });
        }
      }
      messages.push({ role: "user", content: wyniki });
      if (krok === MAX_KROKOW - 1) odpowiedz = tekst || t("Done.", "Zrobione.");
    }
    return NextResponse.json({ odpowiedz: odpowiedz || (akcje.length ? t("Done.", "Zrobione.") : ""), akcje, przekieruj });
  } catch (e) {
    console.error("[bruno kokpit]", e);
    return NextResponse.json({ blad: String((e as Error)?.message ?? e).slice(0, 300), akcje }, { status: 500 });
  }
}
