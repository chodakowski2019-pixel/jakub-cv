"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type DostepLinkow, Ikona, linkiDla, useWyloguj } from "@/components/podglad/panel/wspolne";
import { useT } from "@/components/bruno/jezyk-kontekst";
import type { Logo } from "@/components/bruno/pasek-zloty";

// 27.10 (USER_001: „po lewej chcę taki pasek” = pasek z /podglad/bruno-panel-vaulto-jasny): LEWY PASEK z sekcjami
// OGÓLNE / NARZĘDZIA / WGLĄD / INNE, ikony w kwadracikach, aktywna zakładka jasnym polem, liczniki, na dole karta
// „Plan dnia” (link do rozmowy). Zakładki z prawdziwego menu (linkiDla). Na telefonie chowa go CSS (zostaje nav-tel.tsx).

export type PlanDnia = { dzis: number; dziennie: number };

export default function PasekRinesk({ dostep, inicjal, logo = null, plan = null, fiszki = 0 }: { dostep: DostepLinkow; inicjal: string; logo?: Logo; /** 27.10: plan dnia do karty na dole. */ plan?: PlanDnia | null; /** 27.10: fiszki do powtórki (licznik przy „Trening”). */ fiszki?: number }) {
  const sciezka = usePathname() ?? "";
  const wyloguj = useWyloguj();
  const { t, jezyk } = useT();
  const linki = linkiDla(dostep, jezyk);
  const L = (ik: string) => linki.find((l) => l.ikona === ik);
  const aktywny = (href: string) => sciezka === href || sciezka.startsWith(`${href}/`);
  const dom = dostep.crm ? "/bruno/kokpit" : dostep.szef ? "/bruno/szef" : "/bruno/panel";
  type Pozycja = { href: string; nazwa: string; ikona: Parameters<typeof Ikona>[0]["nazwa"]; licznik?: string } | undefined;
  const trening: Pozycja = L("trening") && { ...L("trening")!, licznik: fiszki ? String(fiszki) : undefined };
  const sekcje: { tytul: string; linki: Pozycja[] }[] = dostep.crm
    ? [
        // 4.11 (USER_001, pkt 1): z CRM 4 główne zakładki (Czat · Klienci · Lejek · Statystyki), szef + Raport + Zespół; reszta drugorzędna.
        { tytul: "Bruno", linki: [L("kokpit"), L("klienci"), L("lejek"), L("statystyki"), L("raport"), L("zespol")] },
        { tytul: t("Practice", "Trening"), linki: [L("test"), trening, L("feedback"), L("ogien")] },
        { tytul: t("Other", "Inne"), linki: [L("panel") && { ...L("panel")!, href: "/bruno/panel?panel=1" }, L("kalendarz"), L("tydzien"), L("ustawienia")] },
      ]
    : [
        // 27.10 (USER_001): „Wgląd / Zespół” na samej górze (szef zaczyna od zespołu).
        { tytul: t("Insights", "Wgląd"), linki: [L("zespol")] },
        { tytul: t("General", "Ogólne"), linki: [L("panel"), L("test"), trening] },
        { tytul: t("Tools", "Narzędzia"), linki: [L("ogien"), L("feedback"), L("statystyki"), L("kalendarz"), L("tydzien")] },
        { tytul: t("Other", "Inne"), linki: [L("ustawienia"), { href: "/bruno/dostosuj", nazwa: t("Customize Bruno", "Dostosuj Bruno"), ikona: "dostosuj" }] },
      ];
  const zostalo = plan ? Math.max(0, plan.dziennie - plan.dzis) : 0;

  return (
    <aside className="brl" aria-label={t("Main menu", "Panel")}>
      <Link href={dom} className="brl-logo" aria-label="Bruno AI">
        {logo?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo.url} alt={logo.nazwa} />
        ) : (
          <i>✳</i>
        )}
        <b>{logo?.nazwa ?? "Bruno AI"}</b>
      </Link>
      {sekcje.map((s) => {
        const l = s.linki.filter((x): x is NonNullable<typeof x> => Boolean(x));
        if (!l.length) return null;
        return (
          <div key={s.tytul}>
            <div className="brl-sekcja">{s.tytul}</div>
            <nav>
              {l.map((x) => (
                <Link key={x.href} href={x.href} className={aktywny(x.href) ? "brl-on" : ""} aria-current={aktywny(x.href) ? "page" : undefined}>
                  <i><Ikona nazwa={x.ikona} rozmiar={13} grubosc={2} /></i>
                  <span>{x.nazwa}</span>
                  {x.licznik && <em>{x.licznik}</em>}
                </Link>
              ))}
              {s.tytul === t("Other", "Inne") && (
                <button type="button" onClick={wyloguj}><i><Ikona nazwa="wyjscie" rozmiar={13} grubosc={2} /></i><span>{t("Log out", "Wyloguj")}</span></button>
              )}
            </nav>
          </div>
        );
      })}
      <div className="brl-rosnie" />
      {plan && (
        <Link href="/bruno/rozmowa" className="brl-plan">
          <i>{inicjal}</i>
          <div>
            <b>{t("Today's plan", "Plan dnia")}</b>
            <small>{zostalo === 0 ? t("Done for today", "Zrobiony na dziś") : t(`${plan.dzis} of ${plan.dziennie} calls · ${zostalo} left`, `${plan.dzis} z ${plan.dziennie} rozmów · zostało ${zostalo}`)}</small>
          </div>
        </Link>
      )}
    </aside>
  );
}
