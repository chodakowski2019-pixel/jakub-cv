import { supabaseAdmin } from "@/lib/supabase";
import { wyslij } from "@/lib/bruno/mail";
import { NADAWCA_WEBINARU, ADRES_WEBINARU } from "@/lib/bruno/mail-webinar";
import { linkCV, type KontoPraca } from "./konta";
import { KROKI, miastoZWielkiej, telefonGrupami, type Odpowiedzi, type StatusProfilu } from "./profil-handlowca";

// 11.11 (USER_001): konto właściciela giełdy. Po zalogowaniu widzi w panelu (/praca/panel) dwie zakładki:
// „Handlowcy” (wszystkie profile, wejście w profil, odhaczenie „zweryfikowany”) i „Firmy” (konta firm i ich wyszukiwania).
// 11.11 wieczór (USER_001): pierwsze odhaczenie „Zweryfikowany” wysyła handlowcowi mail „Twój profil został zweryfikowany”
// (raz na profil, pilnuje kolumna mail_weryfikacji_at). Odznaczenie i odrzucenie niczego nie wysyłają.

/** Kto jest administratorem giełdy: KONTO FIRMY (typ „pracodawca”) z tym e-mailem. Tylko konto firmy, bo rejestracja
 * nie sprawdza, czy e-mail należy do rejestrującego: konto firmy na ten adres już istnieje, więc nikt nie założy drugiego.
 * 12.11: konto handlowca na ten adres usunięte (USER_001: „usuń moje 3 testowe konta”), stąd warunek na typ konta. */
const ADMINI = ["chodak.job72@gmail.com"];

export function czyAdminGieldy(konto: Pick<KontoPraca, "email" | "typ"> | null | undefined): boolean {
  return !!konto && konto.typ === "pracodawca" && ADMINI.includes(konto.email.trim().toLowerCase());
}

const t = (v: unknown) => (typeof v === "string" ? v : "");
const podpisz = async (sciezka: string | null) => (sciezka ? (await supabaseAdmin.storage.from("praca-cv").createSignedUrl(sciezka, 3600)).data?.signedUrl ?? null : null);

export type HandlowiecAdmin = {
  id: string;
  imie: string;
  email: string;
  telefon: string;
  stanowisko: string;
  miasto: string;
  lata: string;
  status: StatusProfilu;
  zdjecie: string | null;
  maCV: boolean;
  /** Ile firm odblokowało kontakt. */
  firm: number;
  wyslano: string;
};

/** Wszystkie profile handlowców, najnowsze na górze, razem z tymi w weryfikacji i odrzuconymi. */
export async function listaHandlowcow(): Promise<HandlowiecAdmin[]> {
  const [{ data: profile, error }, { data: odbl }] = await Promise.all([
    supabaseAdmin
      .from("praca_profile_handlowcow")
      .select("konto_id,odpowiedzi,status,zdjecie_sciezka,updated_at,konto:praca_konta(email,telefon,cv_sciezka)")
      .order("updated_at", { ascending: false })
      .limit(2000),
    supabaseAdmin.from("praca_odblokowania").select("handlowiec_id"),
  ]);
  if (error) console.error("[praca admin] handlowcy", error.message);
  const ile = new Map<string, number>();
  for (const x of odbl ?? []) ile.set(x.handlowiec_id as string, (ile.get(x.handlowiec_id as string) ?? 0) + 1);
  type W = { konto_id: string; odpowiedzi: Odpowiedzi; status: StatusProfilu; zdjecie_sciezka: string | null; updated_at: string; konto: { email: string; telefon: string | null; cv_sciezka: string | null } | null };
  return Promise.all(
    ((profile ?? []) as unknown as W[]).map(async (w) => ({
      id: w.konto_id,
      imie: t(w.odpowiedzi?.imie) || "Bez imienia",
      email: w.konto?.email ?? "",
      telefon: telefonGrupami(t(w.odpowiedzi?.telefon) || w.konto?.telefon || ""),
      stanowisko: t(w.odpowiedzi?.stanowisko),
      miasto: miastoZWielkiej(t(w.odpowiedzi?.miasto)),
      lata: t(w.odpowiedzi?.lata),
      status: w.status,
      zdjecie: await podpisz(w.zdjecie_sciezka),
      maCV: !!w.konto?.cv_sciezka,
      firm: ile.get(w.konto_id) ?? 0,
      wyslano: w.updated_at,
    })),
  );
}

/** 12.11: od kiedy formularz zapisuje etap. Starsze konta bez zapisu = „brak danych”, nie „nie otworzył”. */
const ZAPIS_ETAPOW_OD = "2026-11-12T20:00:00Z";

export type NiedokonczonyAdmin = {
  id: string;
  imie: string;
  email: string;
  telefon: string;
  od: string;
  /** Najdalszy krok formularza (0 = pierwszy), null = brak zapisu. */
  krok: number | null;
  /** Konto sprzed zapisu etapów (nie wiadomo, czy otworzył formularz). */
  bezDanych: boolean;
  /** Ile pól wpisał / ile jest wszystkich. */
  wpisane: number;
  pol: number;
  ostatnio: string | null;
  /** Ostatnie przypomnienie mailem i ile ich było. */
  przypomnienieAt: string | null;
  przypomnien: number;
};

/** 12.11 (USER_001): konta handlowców, którzy założyli konto, ale nie wysłali profilu, z etapem formularza. Najnowsze na górze. */
export async function listaNiedokonczonych(): Promise<NiedokonczonyAdmin[]> {
  const [{ data: konta, error }, { data: profile }] = await Promise.all([
    supabaseAdmin.from("praca_konta").select("id,email,imie,telefon,created_at,formularz_krok,formularz_szkic,formularz_at,przypomnienie_at,przypomnienia").eq("typ", "kandydat").order("created_at", { ascending: false }).limit(2000),
    supabaseAdmin.from("praca_profile_handlowcow").select("konto_id"),
  ]);
  if (error) console.error("[praca admin] niedokończone", error.message);
  const zProfilem = new Set((profile ?? []).map((x) => x.konto_id as string));
  const pytania = KROKI.flatMap((k) => k.pytania);
  return (konta ?? [])
    .filter((k) => !zProfilem.has(k.id as string))
    .map((k) => {
      const s = (k.formularz_szkic ?? {}) as Odpowiedzi;
      const krok = (k.formularz_krok as number | null) ?? null;
      return {
        id: k.id as string,
        imie: t(s.imie) || (k.imie as string | null) || "",
        email: k.email as string,
        telefon: telefonGrupami(t(s.telefon) || (k.telefon as string | null) || ""),
        od: k.created_at as string,
        krok,
        bezDanych: krok === null && (k.created_at as string) < ZAPIS_ETAPOW_OD,
        wpisane: pytania.filter((p) => [s[p.klucz] ?? ""].flat().some((v) => String(v).trim())).length,
        pol: pytania.length,
        ostatnio: (k.formularz_at as string | null) ?? null,
        przypomnienieAt: (k.przypomnienie_at as string | null) ?? null,
        przypomnien: (k.przypomnienia as number | null) ?? 0,
      };
    });
}

/** Dane konta handlowca do widoku profilu u administratora (e-mail, CV z linkiem na godzinę). */
export async function kontoHandlowca(id: string): Promise<{ email: string; cvNazwa: string | null; cvLink: string | null; od: string } | null> {
  const { data } = await supabaseAdmin.from("praca_konta").select("email,cv_sciezka,cv_nazwa,created_at").eq("id", id).eq("typ", "kandydat").maybeSingle();
  if (!data) return null;
  return { email: data.email as string, cvNazwa: (data.cv_nazwa as string | null) ?? null, cvLink: data.cv_sciezka ? await linkCV(data.cv_sciezka as string, 3600) : null, od: data.created_at as string };
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** 12.11 (USER_001): gdy w profilu brakuje zdjęcia, CV albo obu, mail po weryfikacji prosi o dodanie. */
function dopiskBraki(brakZdjecia: boolean, brakCV: boolean): string {
  if (brakZdjecia && brakCV) return "W profilu brakuje zdjęcia i CV. Dodaj je, a firmy chętniej się do Ciebie odezwą.";
  if (brakZdjecia) return "W profilu brakuje zdjęcia. Dodaj je, a firmy chętniej się do Ciebie odezwą.";
  if (brakCV) return "W profilu brakuje CV. Dodaj je, a firmy chętniej się do Ciebie odezwą.";
  return "";
}

/** Treść maila po weryfikacji (tekst USER_001 z 11.11). Zwykły list, bez szablonu z grafiką. */
export function htmlZweryfikowany(imie: string, brakZdjecia = false, brakCV = false): string {
  const braki = dopiskBraki(brakZdjecia, brakCV);
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#141416">
<p>Dzień dobry${imie ? ` ${esc(imie)}` : ""},</p>
<p>zweryfikowaliśmy Twój profil.</p>
${braki ? `<p>${braki}</p>\n<p>Zaloguj się na: <a href="https://www.salesbruno.pl/login">www.salesbruno.pl/login</a></p>` : `<p>Jeżeli chcesz go edytować, zaloguj się na: <a href="https://www.salesbruno.pl/login">www.salesbruno.pl/login</a></p>`}
<p>Pozdrawiam,<br/>Jakub Chodakowski</p>
</div>`;
}

/** 12.11 (USER_001): przypomnienie dla handlowca, który założył konto, ale nie wysłał profilu. Zwykły list jak mail weryfikacji. */
export function htmlPrzypomnienie(imie: string): string {
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#141416">
<p>Dzień dobry${imie ? ` ${esc(imie)}` : ""},</p>
<p>Twój profil handlowca na SalesBruno.pl nie jest jeszcze dokończony.</p>
<p>Firmy widzą tylko wysłane profile. Dokończenie zajmie kilka minut.</p>
<p>Zaloguj się i dokończ profil: <a href="https://www.salesbruno.pl/login">www.salesbruno.pl/login</a></p>
<p>Pozdrawiam,<br/>Jakub Chodakowski</p>
</div>`;
}
export const TEMAT_PRZYPOMNIENIA = "Dokończ swój profil na SalesBruno.pl";

/** Wysyła przypomnienie do konta kandydata bez wysłanego profilu i zapisuje datę + licznik. */
export async function przypomnijHandlowcowi(id: string): Promise<{ ok: boolean; blad?: string; pominiety?: boolean }> {
  const [{ data: k }, { data: profil }] = await Promise.all([
    supabaseAdmin.from("praca_konta").select("email,imie,formularz_szkic,przypomnienia").eq("id", id).eq("typ", "kandydat").maybeSingle(),
    supabaseAdmin.from("praca_profile_handlowcow").select("konto_id").eq("konto_id", id).maybeSingle(),
  ]);
  if (!k) return { ok: false, blad: "Nie ma takiego konta." };
  if (profil) return { ok: false, blad: "Ten handlowiec już wysłał profil." };
  const imie = (t((k.formularz_szkic as Odpowiedzi | null)?.imie) || (k.imie as string | null) || "").trim().split(/\s+/)[0] ?? "";
  try {
    const r = await wyslij({ do: k.email as string, od: NADAWCA_WEBINARU, replyTo: ADRES_WEBINARU, rodzaj: "inny", temat: TEMAT_PRZYPOMNIENIA, html: htmlPrzypomnienie(imie) });
    if (r.pominiety) return { ok: true, pominiety: true };
  } catch (e) {
    console.error("[praca admin] przypomnienie", e);
    return { ok: false, blad: "Mail nie wyszedł. Spróbuj ponownie." };
  }
  await supabaseAdmin.from("praca_konta").update({ przypomnienie_at: new Date().toISOString(), przypomnienia: ((k.przypomnienia as number | null) ?? 0) + 1 }).eq("id", id);
  return { ok: true };
}

export type WynikStatusu = { ok: boolean; /** "wyslany" = mail poszedł teraz, "pominiety" = brak klucza poczty (lokalnie), "blad" = wysyłka nie wyszła, null = nie było co wysyłać. */ mail: "wyslany" | "pominiety" | "blad" | null };

/** Zmiana statusu profilu przez administratora. Nie rusza `updated_at`, żeby lista nie przeskakiwała.
 * Pierwsze przejście na „zatwierdzony” wysyła handlowcowi mail o weryfikacji. */
export async function ustawStatusProfilu(id: string, status: StatusProfilu): Promise<WynikStatusu> {
  const { data, error } = await supabaseAdmin.from("praca_profile_handlowcow").update({ status }).eq("konto_id", id).select("konto_id,odpowiedzi,mail_weryfikacji_at,zdjecie_sciezka,konto:praca_konta(email,cv_sciezka)");
  if (error) console.error("[praca admin] status", error.message);
  const w = data?.[0] as unknown as { odpowiedzi: Odpowiedzi; mail_weryfikacji_at: string | null; zdjecie_sciezka: string | null; konto: { email: string; cv_sciezka: string | null } | null } | undefined;
  if (!w) return { ok: false, mail: null };
  if (status !== "zatwierdzony" || w.mail_weryfikacji_at || !w.konto?.email) return { ok: true, mail: null };
  try {
    const imie = t(w.odpowiedzi?.imie).trim().split(/\s+/)[0] ?? "";
    const r = await wyslij({ do: w.konto.email, od: NADAWCA_WEBINARU, replyTo: ADRES_WEBINARU, rodzaj: "inny", temat: "Twój profil został zweryfikowany", html: htmlZweryfikowany(imie, !w.zdjecie_sciezka, !w.konto.cv_sciezka) });
    if (r.pominiety) return { ok: true, mail: "pominiety" };
    await supabaseAdmin.from("praca_profile_handlowcow").update({ mail_weryfikacji_at: new Date().toISOString() }).eq("konto_id", id);
    return { ok: true, mail: "wyslany" };
  } catch (e) {
    console.error("[praca admin] mail weryfikacji", e);
    return { ok: true, mail: "blad" };
  }
}

/** 12.11 (USER_001): „X” przy handlowcu = usunięcie z bazy. Kasuje konto handlowca; profil, odblokowania, alerty i zapisane
 * idą kaskadą w bazie, zgłoszenia i wyszukiwania zostają z pustym kontem. Pliki (CV, zdjęcie) usuwane z kubełka osobno.
 * Tylko konta typu „kandydat”, konta firm tą drogą nie da się usunąć. */
export async function usunHandlowca(id: string): Promise<boolean> {
  const [{ data: konto }, { data: profil }] = await Promise.all([
    supabaseAdmin.from("praca_konta").select("id,cv_sciezka").eq("id", id).eq("typ", "kandydat").maybeSingle(),
    supabaseAdmin.from("praca_profile_handlowcow").select("zdjecie_sciezka").eq("konto_id", id).maybeSingle(),
  ]);
  if (!konto) return false;
  const { error } = await supabaseAdmin.from("praca_konta").delete().eq("id", id).eq("typ", "kandydat");
  if (error) {
    console.error("[praca admin] usuń handlowca", error.message);
    return false;
  }
  const pliki = [konto.cv_sciezka as string | null, (profil?.zdjecie_sciezka as string | null) ?? null].filter((x): x is string => !!x);
  if (pliki.length) {
    const { error: e } = await supabaseAdmin.storage.from("praca-cv").remove(pliki);
    if (e) console.error("[praca admin] usuń pliki", e.message);
  }
  return true;
}

export type FirmaAdmin = {
  id: string;
  firma: string;
  osoba: string;
  email: string;
  telefon: string;
  nip: string | null;
  od: string;
  /** Kontakty opłacone, jeszcze do odblokowania. */
  kontakty: number;
  odblokowane: number;
  ogloszenia: number;
  wyszukiwania: number;
  ostatnie: string | null;
};

export type Wyszukiwanie = { kiedy: string; firma: string | null; opis: string; wynik: number };

function opisFiltrow(f: Record<string, unknown>): string {
  // 12.11: wyszukiwanie z panelu firmy zapisuje też opis słowami firmy.
  if (t(f.opis)) return `„${t(f.opis)}”`;
  const l = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);
  const czesci = [l(f.branze).join(", "), t(f.miasto) && miastoZWielkiej(t(f.miasto)), t(f.lata) && `od ${t(f.lata)} lat`, t(f.rynek), l(f.tryb).join(", ")].filter(Boolean);
  return czesci.length ? czesci.join(" · ") : "bez filtrów";
}

/** Konta firm z licznikami + ostatnie wyszukiwania handlowców (także z niezalogowanych wejść). */
export async function firmyIWyszukiwania(): Promise<{ firmy: FirmaAdmin[]; wyszukiwania: Wyszukiwanie[] }> {
  const [{ data: konta }, { data: odbl }, { data: oferty }, { data: szuk }] = await Promise.all([
    supabaseAdmin.from("praca_konta").select("id,email,imie,telefon,firma,nazwa_wyswietlana,nip,kontakty,created_at").eq("typ", "pracodawca").order("created_at", { ascending: false }),
    supabaseAdmin.from("praca_odblokowania").select("konto_id"),
    supabaseAdmin.from("praca_oferty_firm").select("konto_id,status"),
    supabaseAdmin.from("praca_wyszukiwania").select("konto_id,filtry,wynik,created_at").order("created_at", { ascending: false }).limit(500),
  ]);
  const licz = (wiersze: { konto_id: unknown }[] | null) => {
    const m = new Map<string, number>();
    for (const x of wiersze ?? []) if (x.konto_id) m.set(x.konto_id as string, (m.get(x.konto_id as string) ?? 0) + 1);
    return m;
  };
  const [nOdbl, nOfert, nSzuk] = [licz(odbl), licz((oferty ?? []).filter((o) => o.status !== "usunieta")), licz(szuk)];
  const ostatnie = new Map<string, string>();
  for (const x of szuk ?? []) if (x.konto_id && !ostatnie.has(x.konto_id as string)) ostatnie.set(x.konto_id as string, x.created_at as string);
  const firmy: FirmaAdmin[] = (konta ?? []).map((k) => ({
    id: k.id as string,
    firma: (k.nazwa_wyswietlana as string | null) || (k.firma as string | null) || "Bez nazwy",
    osoba: (k.imie as string | null) ?? "",
    email: k.email as string,
    telefon: telefonGrupami((k.telefon as string | null) ?? ""),
    nip: (k.nip as string | null) || null,
    od: k.created_at as string,
    kontakty: (k.kontakty as number | null) ?? 0,
    odblokowane: nOdbl.get(k.id as string) ?? 0,
    ogloszenia: nOfert.get(k.id as string) ?? 0,
    wyszukiwania: nSzuk.get(k.id as string) ?? 0,
    ostatnie: ostatnie.get(k.id as string) ?? null,
  }));
  const nazwa = new Map(firmy.map((f) => [f.id, f.firma]));
  const wyszukiwania: Wyszukiwanie[] = (szuk ?? []).slice(0, 50).map((x) => ({ kiedy: x.created_at as string, firma: x.konto_id ? nazwa.get(x.konto_id as string) ?? "Firma" : null, opis: opisFiltrow((x.filtry ?? {}) as Record<string, unknown>), wynik: (x.wynik as number) ?? 0 }));
  return { firmy, wyszukiwania };
}
