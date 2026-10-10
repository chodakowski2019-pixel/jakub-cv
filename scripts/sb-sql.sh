#!/bin/zsh
# SQL na bazie jakubchodakowski-com przez Management API Supabase (MCP widzi inne konto).
# Token: keychain „Supabase CLI" (po `supabase login`).
#   scripts/sb-sql.sh "select count(*) from bruno_konta"
#   scripts/sb-sql.sh -f lib/bruno/sql/2026-10-10-stripe.sql
set -e
REF="nzensodfkhnpvzeommau"
TOKEN=$(security find-generic-password -s "Supabase CLI" -w)
if [[ "$1" == "-f" ]]; then SQL=$(cat "$2"); else SQL="$1"; fi
SB_TOKEN="$TOKEN" SB_REF="$REF" node -e '
const [sql] = process.argv.slice(1);
fetch(`https://api.supabase.com/v1/projects/${process.env.SB_REF}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.SB_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
}).then(async (r) => { const t = await r.text(); console.log(r.status, t.slice(0, 2000)); process.exit(r.ok ? 0 : 1); });
' -- "$SQL"
