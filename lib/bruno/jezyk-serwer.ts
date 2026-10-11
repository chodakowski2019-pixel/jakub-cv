import { headers } from "next/headers";
import { zalogowanyEmail } from "./auth";
import { pobierzKonto } from "./db";
import { jezykZHosta, type Jezyk } from "./domeny";
import { tDla, type T } from "./i18n";

// 11.10: język po stronie serwera. Zalogowany = język konta (bruno_konta.jezyk).
// Niezalogowany = domena (salesbruno.pl = pl) albo ?pl (proxy daje nagłówek x-jezyk).

export async function jezykZadania(): Promise<Jezyk> {
  const email = await zalogowanyEmail();
  if (email) {
    const konto = await pobierzKonto(email);
    if (konto?.jezyk === "pl" || konto?.jezyk === "en") return konto.jezyk;
  }
  const h = await headers();
  return (h.get("x-jezyk") as Jezyk | null) ?? jezykZHosta(h.get("host")) ?? "en";
}

/** Skrót dla stron serwerowych: const { t, jezyk } = await tSerwer(); */
export async function tSerwer(): Promise<{ t: T; jezyk: Jezyk }> {
  const jezyk = await jezykZadania();
  return { t: tDla(jezyk), jezyk };
}
