// 8.11: import Pipedrive → CRM Bruno dla firm z tokenem. Użycie: npx tsx --env-file=.env.local scripts/bruno-import-pipedrive.mts [firma_id]
import { supabaseAdmin } from "@/lib/supabase";
import { importujPipedrive } from "@/lib/bruno/integracje/pipedrive";

const tylko = process.argv[2];
const { data } = await supabaseAdmin.from("bruno_firmy").select("id, nazwa, pipedrive_token, pipedrive_typ").not("pipedrive_token", "is", null);
for (const f of data ?? []) {
  if (tylko && f.id !== tylko) continue;
  const t0 = Date.now();
  const w = await importujPipedrive(f);
  console.log(`${f.id} (${f.nazwa}): etapy ${w.etapy}, klienci ${w.klienci}, notatki ${w.notatki}, zadania ${w.zadania}, ${Math.round((Date.now() - t0) / 1000)} s`);
}
