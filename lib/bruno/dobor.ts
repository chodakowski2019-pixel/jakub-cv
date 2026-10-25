import { supabaseAdmin } from "@/lib/supabase";
import type { Konfig } from "./db";
import { listaObiekcji } from "./obiekcje";
import { CELE_TRYBU, type CelId, type PostacId, type PoziomId, type TrybId } from "./postacie";

// 25.10 (USER_001: „to jest nasz algorytm, klient nie powinien wybierać”): AUTORSKI DOBÓR ROZMOWY.
// Handlowiec widzi tylko Bruno i Start. Serwer (/api/bruno/rozmowa/start z `auto: true`) dobiera
// tryb, cel, obiekcję, typ klienta i poziom z historii handlowca. Nic z tego nie idzie do przeglądarki
// przed rozmową. Zasady:
// - POZIOM: średnia 3 ostatnich ocen ≥ 7,5 → stopień w górę; < 5 → w dół; inaczej jak ostatnio. Start: średni.
// - TYP KLIENTA (DISC): 60 % kolor z najniższą średnią handlowca (kolor bez rozmów liczy się jako najsłabszy),
//   40 % losowo z pozostałych. Ten sam kolor najwyżej 2 razy z rzędu.
// - TRYB: wagi cold 40 / na żywo 30 / online 30, bez powtórki trybu z ostatniej rozmowy.
// - CEL: losowo z celów trybu, bez „własnego”.
// - OBIEKCJA: z „Dostosuj Bruno”; najpierw nigdy nietrenowana, potem z najniższą oceną, remis = rzadziej trenowana.

const POZIOMY: PoziomId[] = ["latwy", "sredni", "trudny"];
const KOLORY: PostacId[] = ["czerwony", "zolty", "zielony", "niebieski"];
const WAGI_TRYBU: [TrybId, number][] = [["cold", 0.4], ["zywo", 0.3], ["online", 0.3]];

type Historia = { postac: string | null; poziom: string | null; tryb: string | null; ocena: number | null; obiekcja: string | null; feedback: { obiekcje_ocena?: { obiekcja: string; ocena: number }[] } | null };

export type Dobor = { tryb: TrybId; cel: CelId; poziom: PoziomId; postac: PostacId; obiekcje: string[] };

const losuj = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];
const srednia = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function dobierz(historia: Historia[], dostepneObiekcje: string[]): Dobor {
  // historia: najnowsza pierwsza, tylko zakończone.
  const ocenione = historia.filter((h) => typeof h.ocena === "number");

  // Poziom
  const ostatniPoziom = (POZIOMY.includes(historia[0]?.poziom as PoziomId) ? historia[0].poziom : "sredni") as PoziomId;
  const sr3 = srednia(ocenione.slice(0, 3).map((h) => h.ocena as number));
  let i = POZIOMY.indexOf(ostatniPoziom);
  if (sr3 !== null && ocenione.length >= 3) {
    if (sr3 >= 7.5) i = Math.min(2, i + 1);
    else if (sr3 < 5) i = Math.max(0, i - 1);
  }
  const poziom = POZIOMY[i];

  // Typ klienta
  const srKoloru = (k: PostacId) => srednia(ocenione.filter((h) => h.postac === k).map((h) => h.ocena as number));
  const najslabszy = [...KOLORY].sort((a, b) => (srKoloru(a) ?? -1) - (srKoloru(b) ?? -1))[0];
  const zablokowany = historia[0]?.postac && historia[0].postac === historia[1]?.postac ? (historia[0].postac as PostacId) : null;
  let postac: PostacId = Math.random() < 0.6 ? najslabszy : losuj(KOLORY.filter((k) => k !== najslabszy));
  if (postac === zablokowany) postac = losuj(KOLORY.filter((k) => k !== zablokowany));

  // Tryb
  const ostatniTryb = historia[0]?.tryb;
  const pula = WAGI_TRYBU.filter(([t]) => t !== ostatniTryb);
  const suma = pula.reduce((a, [, w]) => a + w, 0);
  let r = Math.random() * suma;
  let tryb: TrybId = pula[0][0];
  for (const [t, w] of pula) {
    if ((r -= w) <= 0) {
      tryb = t;
      break;
    }
  }

  // Cel
  const cel = losuj(CELE_TRYBU[tryb].filter((c) => c !== "wlasny"));

  // Obiekcja
  let obiekcje: string[] = [];
  if (dostepneObiekcje.length) {
    const statystyka = dostepneObiekcje.map((o) => {
      const oceny = historia.flatMap((h) => h.feedback?.obiekcje_ocena?.filter((x) => x.obiekcja === o).map((x) => x.ocena) ?? []);
      const ile = historia.filter((h) => h.obiekcja?.split(" · ").includes(o)).length;
      return { o, ile, sr: srednia(oceny) };
    });
    const nowe = statystyka.filter((s) => s.ile === 0);
    const wybrana = nowe.length ? losuj(nowe) : [...statystyka].sort((a, b) => (a.sr ?? 10) - (b.sr ?? 10) || a.ile - b.ile)[0];
    obiekcje = [wybrana.o];
  }

  return { tryb, cel, poziom, postac, obiekcje };
}

export async function dobierzRozmowe(email: string, konfig: Pick<Konfig, "obiekcje">): Promise<Dobor> {
  const { data } = await supabaseAdmin
    .from("bruno_rozmowy")
    .select("postac, poziom, tryb, ocena, obiekcja, feedback")
    .eq("email", email)
    .eq("status", "zakonczona")
    .order("start", { ascending: false })
    .limit(30);
  return dobierz((data as Historia[]) ?? [], listaObiekcji(konfig.obiekcje));
}
