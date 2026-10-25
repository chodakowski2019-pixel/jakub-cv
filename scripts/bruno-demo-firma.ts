/**
 * 25.10 (USER_001): DEMO POD FIRMĘ w 2 minuty przed spotkaniem online.
 * Podajesz adres strony i nazwę. Skrypt czyta stronę (produkt, klient, obiekcje branży, argumenty),
 * ściąga logo, zakłada firmę demo, konto SZEFA (kod wypisuje na ekran) i 5 przykładowych handlowców
 * z 30 rozmowami na produkcie tej firmy. Potem logujesz się jako szef i oprowadzasz.
 * To samo robi Admin: /bruno/admin?k=STATS_KEY → „Demo pod firmę” (tam klucz modelu jest zawsze).
 *
 *   node --no-warnings --import ./scripts/_env-niepuste.mjs --import ./scripts/_ts-loader.mjs scripts/bruno-demo-firma.ts \
 *     --url https://firma.pl --nazwa "Firma Sp. z o.o." [--jezyk pl] [--szef jan@firma.pl] [--imie Jan] [--kod 123456]
 *   ... --reset --nazwa "Firma"        # tylko handlowcy i rozmowy od nowa (treść rozmów z bazy, bez modelu)
 *   ... --bez-modelu                    # bez klucza modelu: produkt z tekstu strony, rozmowy domyślne
 *   ... --lista                         # firmy demo w bazie
 *
 * Logowanie szefa: e-mail wypisany na końcu + kod. Handlowcy demo nie mają kodu (nie logują się).
 */
import { supabaseAdmin } from "@/lib/supabase";
import { zalozDemoFirmy } from "@/lib/bruno/demo-firma";

const arg = (n: string, d = "") => {
  const i = process.argv.indexOf(`--${n}`);
  return i === -1 ? d : (process.argv[i + 1] ?? d);
};
const flaga = (n: string) => process.argv.includes(`--${n}`);

async function main() {
  if (flaga("lista")) {
    const { data } = await supabaseAdmin.from("bruno_firmy").select("id, nazwa, www, jezyk, utworzono").order("utworzono", { ascending: false });
    for (const f of data ?? []) console.log(`${f.id}\t${f.nazwa}\t${f.www ?? ""}\t${f.jezyk}\t${new Date(f.utworzono).toLocaleDateString("pl-PL")}`);
    return;
  }
  const w = await zalozDemoFirmy(
    { url: arg("url"), nazwa: arg("nazwa"), jezyk: arg("jezyk", "pl"), szef: arg("szef"), imie: arg("imie"), kod: arg("kod"), reset: flaga("reset"), bezModelu: flaga("bez-modelu") },
    (s) => console.log(s),
  );
  console.log(`\nFIRMA ${w.firma.nazwa} (${w.firma.id}), ${w.firma.jezyk}, logo ${w.firma.logo_url ?? "brak"}, rozmowy ${w.zModelu ? "z modelu" : "DOMYŚLNE"}`);
  for (const h of w.zespol.handlowcy) console.log(`  ${h.imie.padEnd(8)} ${h.typ.padEnd(11)} ${h.rozmow} rozmów  ${h.email}`);
  console.log(`Razem rozmów: ${w.zespol.rozmow}. Panel szefa: /bruno/szef (login ${w.szef}${w.kod ? `, kod ${w.kod}` : ""}).`);
  for (const u of w.uwagi) console.log(`UWAGA: ${u}`);
}

main().catch((e) => {
  console.error("BŁĄD:", e instanceof Error ? e.message : e);
  process.exit(1);
});
