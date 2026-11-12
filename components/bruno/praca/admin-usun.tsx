"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 12.11 (USER_001): „X” przy każdym handlowcu = usunięcie z bazy (konto, profil, CV, zdjęcie). Pyta raz o potwierdzenie.
// `wroc` = po usunięciu przejdź na listę (z karty profilu); bez niego lista tylko się odświeża.
export default function AdminUsun({ id, imie, wroc }: { id: string; imie: string; wroc?: boolean }) {
  const router = useRouter();
  const [stan, setStan] = useState(false);

  async function usun() {
    if (!confirm(`Usunąć ${imie} z bazy? Konto, profil, CV i zdjęcie znikną na stałe.`)) return;
    setStan(true);
    const r = await fetch(`/api/bruno/praca/admin?id=${id}`, { method: "DELETE" }).catch(() => null);
    const j = await r?.json().catch(() => null);
    setStan(false);
    if (!r?.ok || !j?.ok) return alert(j?.blad ?? "Nie udało się usunąć.");
    if (wroc) router.push("/praca/panel");
    else router.refresh();
  }

  return (
    <button type="button" className="p-btn p-btn-2 p-btn-s" disabled={stan} onClick={usun} title="Usuń z bazy" aria-label={`Usuń ${imie} z bazy`}>
      {wroc ? "✕ Usuń z bazy" : "✕"}
    </button>
  );
}
