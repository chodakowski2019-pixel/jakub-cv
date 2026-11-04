import Link from "next/link";
import type { Jezyk } from "@/lib/bruno/i18n";
import { tDla } from "@/lib/bruno/i18n";

// 4.11: szef w widoku handlowca („Bruno handlowca”): pigułki z imionami, klik = ta sama strona dla innego handlowca.

export default function PrzelacznikHandlowca({ sciezka, jezyk, handlowcy, wybrany }: { sciezka: string; jezyk: Jezyk; handlowcy: { email: string; imie: string | null; zdjecie_url?: string | null }[]; wybrany: string }) {
  const t = tDla(jezyk);
  return (
    <div className="bph">
      <span className="bph-tytul">{t("Rep view", "Widok handlowca")}</span>
      {handlowcy.map((h) => {
        const on = h.email.toLowerCase() === wybrany.toLowerCase();
        return (
          <Link key={h.email} href={`${sciezka}?jako=${encodeURIComponent(h.email)}`} className={`bph-pigulka ${on ? "bph-on" : ""}`} aria-current={on ? "true" : undefined}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {h.zdjecie_url ? <img src={h.zdjecie_url} alt="" /> : <i>{(h.imie ?? h.email)[0]?.toUpperCase()}</i>}
            {h.imie ?? h.email}
          </Link>
        );
      })}
      <Link href={sciezka} className="bph-pigulka bph-szef">{t("Back to owner view", "Wróć do widoku właściciela")}</Link>
    </div>
  );
}
