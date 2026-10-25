import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabase";
import { nowyKod, zaszyfrujKod } from "./auth";
import type { Konfig } from "./db";
import { type DemoDane, DOMENA_DEMO, WERSJE_DOMYSLNE, wygenerujWersje, zasiejZespol, type WynikSeeda } from "./demo-zespol";
import type { Firma } from "./firmy";
import { zapewnijKarty } from "./fsrs";

// 25.10 (USER_001): DEMO POD FIRMĘ w 2 minuty przed spotkaniem. Jedna funkcja dla skryptu
// (scripts/bruno-demo-firma.ts) i dla Admina (/api/bruno/admin/demo-firma): czyta stronę firmy
// (produkt, klient, obiekcje branży, argumenty), ściąga logo, zakłada firmę, konto SZEFA (kod) i 5 handlowców
// z 30 rozmowami na produkcie firmy. Bez klucza modelu: produkt = tekst ze strony, rozmowy = wersje domyślne.

export const slugFirmy = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

function htmlDoTekstu(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6]|tr|br|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

/** Logo ze strony: apple-touch-icon (kwadrat, do kółka) → og:image → icon → favicon Google (zawsze coś jest). */
function logoZHtml(html: string, baza: URL): string {
  const atr = (tag: string, re: RegExp) => {
    const m = html.match(new RegExp(`<${tag}[^>]*${re.source}[^>]*>`, "i"));
    if (!m) return null;
    const href = m[0].match(/\b(?:href|content)=["']([^"']+)["']/i)?.[1];
    try {
      return href ? new URL(href, baza).toString() : null;
    } catch {
      return null;
    }
  };
  return (
    atr("link", /rel=["'][^"']*apple-touch-icon[^"']*["']/) ??
    atr("meta", /property=["']og:image["']/) ??
    atr("link", /rel=["'][^"']*\bicon\b[^"']*["']/) ??
    `https://www.google.com/s2/favicons?domain=${baza.hostname}&sz=128`
  );
}

export async function czytajStrone(url: string): Promise<{ tekst: string; logo: string; www: string }> {
  const u = new URL(url.startsWith("http") ? url : `https://${url}`);
  if (!/^https?:$/.test(u.protocol)) throw new Error("Adres musi zaczynać się od https://");
  const odp = await fetch(u.toString(), {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; BrunoAI/1.0; +https://salesbruno.pl)", Accept: "text/html,application/xhtml+xml" },
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  });
  if (!odp.ok) throw new Error(`Strona odpowiedziała ${odp.status}.`);
  const html = await odp.text();
  const tekst = htmlDoTekstu(html).slice(0, 60_000);
  if (tekst.length < 200) throw new Error("Na stronie prawie nie ma tekstu (ładuje się skryptem). Podaj inny adres, np. podstronę z ofertą.");
  return { tekst, logo: logoZHtml(html, u), www: u.toString() };
}

type PolaKonfig = Pick<Konfig, "produkt" | "klient" | "obiekcje" | "skrypt">;

/** Ten sam prompt, co „Wczytaj ofertę” w panelu (app/api/bruno/oferta): produkt, klient, obiekcje, argumenty. */
export async function konfiguracjaZeStrony(nazwa: string, tekst: string, pl: boolean): Promise<PolaKonfig> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Brak ANTHROPIC_API_KEY.");
  const klient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const odp = await klient.messages.create({
    model: process.env.BRUNO_TRENER_MODEL ?? "claude-sonnet-5",
    max_tokens: 1500,
    system: pl
      ? "Jesteś asystentem, który z materiałów firmy (strona) przygotowuje wsad dla AI grającego KLIENTA w treningu sprzedaży. Potrzebne są FAKTY o ofercie (produkt, ceny, warunki, co klient dostaje), portret typowego klienta (kto kupuje, czego się boi, kto decyduje) i obiekcje, jakie taki klient realnie podnosi, każda z jednym zdaniem wyjaśnienia. Argumenty handlowe zbierz osobno jako punkty do skryptu. Pisz po polsku, bez marketingowych przymiotników, nie zmyślaj."
      : "You are an assistant that turns company materials (website) into input for an AI that plays the CUSTOMER in sales training. We need FACTS about the offer (product, prices, terms, what the customer gets), a profile of the typical customer (who buys, what they fear, who decides), and the objections this customer really raises, each with one sentence explaining what they mean. Collect the sales points separately as bullet points for a script. Plain American English, no marketing adjectives, don't make anything up.",
    messages: [{ role: "user", content: `${pl ? "FIRMA" : "COMPANY"}: ${nazwa}\n\n${pl ? "TEKST ZE STRONY" : "TEXT FROM THE WEBSITE"}:\n\n${tekst}` }],
    tools: [
      {
        name: "konfiguracja_bruno",
        description: "Fields for the training tool based on the company materials.",
        input_schema: {
          type: "object",
          properties: {
            produkt: { type: "string", description: "What the company sells, to whom, how much it costs. 2-5 sentences, only facts." },
            klient: { type: "string", description: "Who the typical customer is: situation, fears, who decides. 2-4 sentences." },
            obiekcje: { type: "array", items: { type: "object", properties: { obiekcja: { type: "string" }, wyjasnienie: { type: "string" } }, required: ["obiekcja", "wyjasnienie"] }, description: "4-6 objections in the customer's own words + what they mean." },
            argumenty: { type: "array", items: { type: "string" }, description: "3-8 sales points/proof from the materials." },
          },
          required: ["produkt", "klient", "obiekcje"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "konfiguracja_bruno" },
  });
  const blok = odp.content.find((c) => c.type === "tool_use");
  if (!blok || blok.type !== "tool_use") throw new Error("Model nie zwrócił konfiguracji.");
  const r = blok.input as { produkt?: string; klient?: string; obiekcje?: { obiekcja: string; wyjasnienie?: string }[]; argumenty?: string[] };
  const obiekcje = (Array.isArray(r.obiekcje) ? r.obiekcje : []).filter((o) => o?.obiekcja?.trim()).map((o) => (o.wyjasnienie?.trim() ? `${o.obiekcja.trim()} | ${o.wyjasnienie.trim()}` : o.obiekcja.trim()));
  const argumenty = (Array.isArray(r.argumenty) ? r.argumenty : []).filter((a) => typeof a === "string" && a.trim());
  return {
    produkt: String(r.produkt ?? "").slice(0, 1500),
    klient: String(r.klient ?? "").slice(0, 2000),
    obiekcje: obiekcje.join("\n").slice(0, 3000),
    skrypt: argumenty.length ? `${pl ? "Argumenty z oferty:" : "Points from the offer:"}\n${argumenty.map((a) => `- ${a.trim()}`).join("\n")}`.slice(0, 4000) : "",
  };
}

/** Bez modelu: produkt = początek tekstu ze strony, klient i obiekcje = ogólne dla B2B. */
function konfiguracjaBezModelu(nazwa: string, tekst: string, pl: boolean): PolaKonfig {
  const produkt = tekst.replace(/\s+/g, " ").slice(0, 600);
  return pl
    ? {
        produkt: `${nazwa}: ${produkt}`,
        klient: "Właściciel albo dyrektor w firmie z 5-50 pracownikami. Decyduje sam albo ze wspólnikiem. Boi się, że wyda pieniądze i nic się nie zmieni.",
        obiekcje: "Za drogo | nie widzi jeszcze, co dostaje za tę cenę\nMamy już dostawcę | nie chce zmieniać, bo zmiana to ryzyko\nMuszę to przemyśleć | odkłada decyzję, nie ma argumentu dla wspólnika\nNie teraz, może za kwartał | brak pilności\nPrześlij ofertę na maila | chce skończyć rozmowę bez „nie”",
        skrypt: "",
      }
    : {
        produkt: `${nazwa}: ${produkt}`,
        klient: "Owner or director at a company with 5-50 employees. Decides alone or with a partner. Afraid of spending money and seeing no change.",
        obiekcje: "Too expensive | doesn't see yet what they get for the price\nWe already have a vendor | doesn't want to change, change is risk\nI need to think about it | postpones, has no argument for the partner\nNot now, maybe next quarter | no urgency\nSend me an email | wants to end the call without saying no",
        skrypt: "",
      };
}

export type Zlecenie = {
  url?: string;
  nazwa: string;
  jezyk?: "pl" | "en" | string | null;
  /** E-mail szefa (domyślnie szef.<slug>@demo.salesbruno.pl). */
  szef?: string | null;
  imie?: string | null;
  /** 6 cyfr albo puste = losowy. */
  kod?: string | null;
  /** Tylko handlowcy i rozmowy od nowa (treść rozmów z bazy). */
  reset?: boolean;
  /** Nie wołaj modelu (test, brak klucza): wersje domyślne. */
  bezModelu?: boolean;
};

export type WynikDemo = { firma: Firma; szef: string; kod: string | null; konfig: PolaKonfig; zespol: WynikSeeda; zModelu: boolean; uwagi: string[] };

export async function zalozDemoFirmy(z: Zlecenie, log: (s: string) => void = () => {}): Promise<WynikDemo> {
  const nazwa = z.nazwa.trim();
  if (!nazwa) throw new Error("Podaj nazwę firmy.");
  const id = slugFirmy(nazwa);
  if (!id) throw new Error("Nazwa firmy bez liter ani cyfr.");
  const jezyk = z.jezyk === "en" ? "en" : "pl";
  const pl = jezyk === "pl";
  const emailSzefa = (z.szef ?? "").trim().toLowerCase() || `szef.${id}@${DOMENA_DEMO}`;
  const uwagi: string[] = [];
  const modelJest = Boolean(process.env.ANTHROPIC_API_KEY) && !z.bezModelu;

  const { data: istniejaca } = await supabaseAdmin.from("bruno_firmy").select("*").eq("id", id).maybeSingle();
  let firma = (istniejaca as Firma | null) ?? null;
  let konfig: Konfig;
  let kod: string | null = null;

  if (z.reset) {
    if (!firma) throw new Error(`Firmy „${id}” nie ma w bazie. Załóż ją najpierw z adresem strony.`);
    const { data: k } = await supabaseAdmin.from("bruno_konfig").select("*").eq("email", emailSzefa).maybeSingle();
    if (!k) throw new Error(`Brak konfiguracji szefa ${emailSzefa}.`);
    konfig = k as Konfig;
  } else {
    const url = (z.url ?? "").trim();
    if (!url) throw new Error("Podaj adres strony firmy.");
    log(`Czytam ${url}…`);
    const strona = await czytajStrone(url);
    log(`Tekst: ${strona.tekst.length} znaków, logo: ${strona.logo}`);
    let pola: PolaKonfig;
    if (modelJest) {
      log("Model układa produkt, klienta i obiekcje…");
      try {
        pola = await konfiguracjaZeStrony(nazwa, strona.tekst, pl);
      } catch (e) {
        uwagi.push(`Model nie odczytał strony (${e instanceof Error ? e.message : e}); produkt wzięty wprost z tekstu strony.`);
        pola = konfiguracjaBezModelu(nazwa, strona.tekst, pl);
      }
    } else {
      uwagi.push("Bez klucza modelu: produkt z tekstu strony, obiekcje ogólne. Popraw w „Dostosuj Bruno”.");
      pola = konfiguracjaBezModelu(nazwa, strona.tekst, pl);
    }
    const { data: f, error } = await supabaseAdmin
      .from("bruno_firmy")
      .upsert({ id, nazwa, www: strona.www, logo_url: strona.logo, jezyk, demo: true }, { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw new Error(`firma: ${error.message}`);
    firma = f as Firma;
    konfig = {
      email: emailSzefa,
      produkt: pola.produkt,
      klient: pola.klient,
      obiekcje: pola.obiekcje,
      udana_rozmowa: pl ? "Umówione spotkanie z datą albo decyzja na tak." : "A booked meeting with a date or a yes.",
      skrypt: pola.skrypt,
      postac: "czerwony",
      godzina_przypomnienia: 8,
      etap: "cold",
      rejestr: pl ? "pan" : "ty",
      glos: "m",
      segment: "b2b",
    };

    // Konto SZEFA: pełny dostęp, rok, kod do logowania (podany albo losowy). Konto istniejące bez kodu dostaje nowy.
    const { data: stare } = await supabaseAdmin.from("bruno_konta").select("kod_hash").eq("email", emailSzefa).maybeSingle();
    kod = /^\d{6}$/.test(z.kod ?? "") ? (z.kod as string) : stare?.kod_hash ? null : nowyKod();
    const { error: e1 } = await supabaseAdmin.from("bruno_konta").upsert(
      {
        email: emailSzefa,
        imie: (z.imie ?? "").trim() || "Jakub",
        firma: nazwa,
        firma_id: id,
        rola: "owner",
        handlowcy: 5,
        demo: true,
        plan: "pelny",
        jezyk,
        dni: 365,
        limit_sekund: 36_000,
        rozmow_dziennie: 5,
        fiszek_dziennie: 50,
        aktywne: true,
        nieudane: 0,
        blokada_do: null,
        profil_at: new Date().toISOString(),
        tour_obejrzany_at: new Date().toISOString(),
        ...(kod ? { kod_hash: zaszyfrujKod(kod) } : {}),
      },
      { onConflict: "email" },
    );
    if (e1) throw new Error(`konto szefa: ${e1.message}`);
    const { error: e2 } = await supabaseAdmin.from("bruno_konfig").upsert({ ...konfig, zaktualizowano: new Date().toISOString() }, { onConflict: "email" });
    if (e2) throw new Error(`konfig szefa: ${e2.message}`);
    await zapewnijKarty(emailSzefa, konfig, jezyk);
    log(`SZEF: ${emailSzefa}${kod ? ` | kod: ${kod}` : " | kod bez zmian"}`);
  }

  // Treść rozmów: raz na firmę (model), potem z bazy. Bez modelu: wersje domyślne.
  let dane = (firma.demo_dane as DemoDane | null) ?? null;
  let zModelu = Boolean(dane?.wersje?.length && (dane as DemoDane & { zrodlo?: string }).zrodlo !== "domyslne");
  if (!dane || !Array.isArray(dane.wersje) || dane.wersje.length < 3 || (!zModelu && modelJest)) {
    if (modelJest) {
      log("Model pisze 3 wersje rozmowy (dobra, średnia, słaba)…");
      try {
        dane = await wygenerujWersje(firma, konfig);
        zModelu = true;
      } catch (e) {
        uwagi.push(`Model nie napisał rozmów (${e instanceof Error ? e.message : e}); użyte wersje domyślne.`);
        dane = WERSJE_DOMYSLNE[jezyk];
        zModelu = false;
      }
    } else {
      dane = WERSJE_DOMYSLNE[jezyk];
      zModelu = false;
    }
    const { error } = await supabaseAdmin.from("bruno_firmy").update({ demo_dane: dane }).eq("id", id);
    if (error) throw new Error(`demo_dane: ${error.message}`);
  }
  const zespol = await zasiejZespol(firma, konfig, dane);
  return { firma, szef: emailSzefa, kod, konfig: { produkt: konfig.produkt, klient: konfig.klient, obiekcje: konfig.obiekcje, skrypt: konfig.skrypt }, zespol, zModelu, uwagi };
}
