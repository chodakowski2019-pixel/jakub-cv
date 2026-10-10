import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import {
  ROZMOWA_SEKUND,
  kartyDoPowtorki,
  limitDzienny,
  pobierzKonfig,
  pobierzKonto,
  pobierzRozmowy,
  rozmowyDzis,
  stanDostepu,
  zuzyteSekundy,
  type Rozmowa,
} from "@/lib/bruno/db";
import { NAZWY } from "@/lib/bruno/kryteria";
import { POSTACIE, postacLubDomyslna, type PostacId } from "@/lib/bruno/postacie";
import { rozmowyNaDni, type Slupek } from "@/components/bruno/statystyki";

// Podgląd dwóch wersji panelu Bruno (6.10). Te same dane co app/bruno/panel/page.tsx,
// tymi samymi funkcjami z lib/bruno, tylko do odczytu: NIE wołamy zamknijPorzucone
// (to zapis w bazie), podgląd niczego nie zmienia.

export type KryteriumOcena = { nazwa: string; ocena: number };
export type OcenaRozmowy = { ocena: number; kryteria: KryteriumOcena[]; opis: string };
export type PostacPodglad = {
  id: PostacId;
  nazwa: string;
  krotko: string;
  opis: string;
  kolor: string;
  rozmow: number;
  srednia: number | null;
};
export type DzienPodglad = Slupek & { nazwaPelna: string; minuty: number; srednia: number | null };

export type DanePanelu = {
  przyklad: boolean;
  wygasl: boolean;
  imie: string | null;
  inicjal: string;
  skonfigurowany: boolean;
  dziennie: number;
  dzis: number;
  zostaloDzis: number;
  planZrobiony: boolean;
  rozmowaMin: number;
  dni: number;
  dniZostalo: number;
  dniUplynelo: number;
  koniec: string | null;
  minutZostalo: number;
  limitMinut: number;
  minDzis: number;
  min7: number;
  moznaRozmawiac: boolean;
  linkRozmowy: string;
  powtorka: string | null;
  postac: PostacId;
  postacie: PostacPodglad[];
  dni7: DzienPodglad[];
  dniPoprzednie: number[];
  ostatnia: OcenaRozmowy | null;
  srednia: OcenaRozmowy | null;
  ocenionych: number;
};

const DNI_PELNE: Record<string, string> = { Su: "Sunday", Mo: "Monday", Tu: "Tuesday", We: "Wednesday", Th: "Thursday", Fr: "Friday", Sa: "Saturday" };
const KOLEJNOSC = Object.keys(NAZWY) as (keyof typeof NAZWY)[];

const kluczPL = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });
const zaokr = (v: number) => Math.round(v * 10) / 10;

function srednia(liczby: number[]): number | null {
  return liczby.length ? zaokr(liczby.reduce((a, b) => a + b, 0) / liczby.length) : null;
}

type Wejscie = {
  imie: string | null;
  dni: number;
  dniZostalo: number;
  koniec: Date | null;
  limitSekund: number;
  zuzyte: number;
  dzis: number;
  dziennie: number;
  postacKonfig: string;
  skonfigurowany: boolean;
  powtorka: { id: string; typ: string; tresc: string } | null;
  rozmowy: Pick<Rozmowa, "start" | "status" | "sekundy" | "ocena" | "postac" | "feedback">[];
  wygasl: boolean;
  przyklad: boolean;
};

function zbuduj(w: Wejscie): DanePanelu {
  const zostaloDzis = Math.max(0, w.dziennie - w.dzis);
  const planZrobiony = zostaloDzis === 0;
  const minutZostalo = Math.max(0, Math.floor((w.limitSekund - w.zuzyte) / 60));
  const postac = postacLubDomyslna(w.postacKonfig);
  const linkRozmowy = w.powtorka ? `/bruno/rozmowa?karta=${w.powtorka.id}` : "/bruno/rozmowa";
  const powtorka = w.powtorka
    ? w.powtorka.typ === "obiekcja"
      ? `Objection review: "${w.powtorka.tresc}"`
      : `Review: ${NAZWY[w.powtorka.tresc as keyof typeof NAZWY] ?? w.powtorka.tresc}`
    : null;

  const liczone = w.rozmowy.filter((r) => r.status !== "przerwana");
  const ocenione = liczone.filter((r) => typeof r.ocena === "number");

  // 14 dni: ostatnie 7 + poprzednie 7 (linia porównania w wersji A).
  const dni14 = rozmowyNaDni(w.rozmowy, 14);
  const dniPoprzednie = dni14.slice(0, 7).map((d) => d.wartosc);
  const teraz = Date.now();
  const dni7: DzienPodglad[] = dni14.slice(7).map((d, i) => {
    const k = kluczPL(new Date(teraz - (6 - i) * 86_400_000));
    const tegoDnia = liczone.filter((r) => kluczPL(new Date(r.start)) === k);
    return {
      ...d,
      nazwaPelna: DNI_PELNE[d.etykieta] ?? d.etykieta,
      minuty: Math.round(tegoDnia.reduce((a, r) => a + Math.min(r.sekundy ?? 0, ROZMOWA_SEKUND), 0) / 60),
      srednia: srednia(tegoDnia.filter((r) => typeof r.ocena === "number").map((r) => r.ocena as number)),
    };
  });

  const ocenaZ = (r: (typeof ocenione)[number]): OcenaRozmowy => ({
    ocena: zaokr(r.ocena as number),
    kryteria: KOLEJNOSC.map((n) => ({ nazwa: NAZWY[n], ocena: r.feedback?.kryteria?.find((k) => k.nazwa === n)?.ocena ?? 0 })),
    opis: `Customer ${POSTACIE[postacLubDomyslna(r.postac)].nazwa.toLowerCase()}, ${Math.max(1, Math.round((r.sekundy ?? 0) / 60))} min`,
  });
  const ostatnia = ocenione[0] ? ocenaZ(ocenione[0]) : null;
  const sred = ocenione.length
    ? {
        ocena: srednia(ocenione.map((r) => r.ocena as number)) ?? 0,
        kryteria: KOLEJNOSC.map((n) => ({
          nazwa: NAZWY[n],
          ocena: srednia(ocenione.map((r) => r.feedback?.kryteria?.find((k) => k.nazwa === n)?.ocena).filter((v): v is number => typeof v === "number")) ?? 0,
        })),
        opis: `From ${ocenione.length} ${ocenione.length === 1 ? "call" : "calls"}`,
      }
    : null;

  const postacie = (Object.keys(POSTACIE) as PostacId[]).map((id) => {
    const z = liczone.filter((r) => postacLubDomyslna(r.postac) === id);
    return {
      id,
      nazwa: POSTACIE[id].nazwa,
      krotko: POSTACIE[id].krotko,
      opis: POSTACIE[id].opis,
      kolor: POSTACIE[id].kolor,
      rozmow: z.length,
      srednia: srednia(z.filter((r) => typeof r.ocena === "number").map((r) => r.ocena as number)),
    };
  });
  // Aktualny typ klienta na początek listy.
  postacie.sort((a, b) => (a.id === postac ? -1 : b.id === postac ? 1 : 0));

  return {
    przyklad: w.przyklad,
    wygasl: w.wygasl,
    imie: w.imie,
    inicjal: (w.imie?.trim()[0] ?? "B").toUpperCase(),
    skonfigurowany: w.skonfigurowany,
    dziennie: w.dziennie,
    dzis: w.dzis,
    zostaloDzis,
    planZrobiony,
    rozmowaMin: ROZMOWA_SEKUND / 60,
    dni: w.dni,
    dniZostalo: w.dniZostalo,
    dniUplynelo: Math.max(0, w.dni - w.dniZostalo),
    koniec: w.koniec ? w.koniec.toLocaleDateString("en-US", { timeZone: "Europe/Warsaw" }) : null,
    minutZostalo,
    limitMinut: Math.round(w.limitSekund / 60),
    minDzis: dni7[6]?.minuty ?? 0,
    min7: dni7.reduce((a, d) => a + d.minuty, 0),
    moznaRozmawiac: !w.wygasl && !planZrobiony && minutZostalo >= 1,
    linkRozmowy,
    powtorka,
    postac,
    postacie,
    dni7,
    dniPoprzednie,
    ostatnia,
    srednia: sred,
    ocenionych: ocenione.length,
  };
}

/** Wyraźnie zmyślone dane, tylko w trybie development i tylko bez logowania. */
function przykladowe(): DanePanelu {
  const dzien = 86_400_000;
  const teraz = Date.now();
  const kr = (o: number, p: number, ob: number, z: number, pe: number) =>
    (["otwarcie", "pytania", "obiekcje", "zamkniecie", "pewnosc"] as const).map((nazwa, i) => ({ nazwa, ocena: [o, p, ob, z, pe][i], cytat: "", czas: "", komentarz: "" }));
  const r = (dniTemu: number, godz: number, postac: string, ocena: number, k: ReturnType<typeof kr>) => ({
    start: new Date(teraz - dniTemu * dzien - godz * 3_600_000).toISOString(),
    status: "zakonczona" as const,
    sekundy: 170,
    ocena,
    postac,
    feedback: { ocena, kryteria: k, liczba_z_audio: "", wygrana: "", poprawka: "", najslabsze: "obiekcje" as const },
  });
  const rozmowy = [
    r(0, 1, "czerwony", 6.8, kr(7, 7, 6, 6, 8)),
    r(1, 2, "niebieski", 5.9, kr(6, 6, 5, 5, 7)),
    r(1, 3, "czerwony", 6.4, kr(7, 6, 6, 6, 7)),
    r(1, 4, "zielony", 7.1, kr(8, 7, 7, 6, 8)),
    r(2, 2, "zolty", 6.0, kr(7, 6, 5, 6, 6)),
    r(3, 2, "czerwony", 5.5, kr(6, 5, 5, 5, 7)),
    r(3, 3, "czerwony", 6.1, kr(6, 6, 6, 6, 7)),
    r(5, 2, "niebieski", 5.2, kr(5, 5, 5, 4, 7)),
    r(8, 2, "zielony", 4.9, kr(5, 5, 4, 5, 6)),
    r(9, 2, "czerwony", 5.1, kr(6, 5, 4, 5, 6)),
  ];
  return zbuduj({
    imie: "Jan",
    dni: 7,
    dniZostalo: 4,
    koniec: new Date(teraz + 4 * dzien),
    limitSekund: 60 * 60,
    zuzyte: rozmowy.length * 170,
    dzis: 1,
    dziennie: 3,
    postacKonfig: "czerwony",
    skonfigurowany: true,
    powtorka: null,
    rozmowy,
    wygasl: false,
    przyklad: true,
  });
}

export async function danePanelu(): Promise<DanePanelu> {
  let email: string | null = null;
  try {
    email = await zalogowanyEmail();
  } catch {
    email = null;
  }
  if (!email) {
    if (process.env.NODE_ENV === "development") return przykladowe();
    redirect("/bruno");
  }

  const konto = await pobierzKonto(email);
  const stan = stanDostepu(konto);
  if (!konto || !stan.aktywny) {
    return {
      ...zbuduj({
        imie: konto?.imie ?? null,
        dni: konto?.dni ?? 7,
        dniZostalo: 0,
        koniec: stan.koniec,
        limitSekund: konto?.limit_sekund ?? 0,
        zuzyte: 0,
        dzis: 0,
        dziennie: limitDzienny(konto),
        postacKonfig: "czerwony",
        skonfigurowany: true,
        powtorka: null,
        rozmowy: [],
        wygasl: true,
        przyklad: false,
      }),
    };
  }

  const [zuzyte, dzis, karty, konfig, wszystkie] = await Promise.all([
    zuzyteSekundy(email),
    rozmowyDzis(email),
    kartyDoPowtorki(email, 6),
    pobierzKonfig(email),
    pobierzRozmowy(email, 200),
  ]);
  const pierwszaKarta = karty.find((k) => k.typ === "kryterium" || k.typ === "obiekcja") ?? null;

  return zbuduj({
    imie: konto.imie,
    dni: konto.dni,
    dniZostalo: stan.dniZostalo,
    koniec: stan.koniec,
    limitSekund: konto.limit_sekund,
    zuzyte,
    dzis,
    dziennie: limitDzienny(konto),
    postacKonfig: konfig.postac,
    skonfigurowany: Boolean(konfig.produkt.trim() || konfig.klient.trim()),
    powtorka: pierwszaKarta,
    rozmowy: wszystkie,
    wygasl: false,
    przyklad: false,
  });
}
