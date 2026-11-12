"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 12.11 (USER_001): „Przypomnij” w zakładce „Niedokończone” = mail do handlowca z prośbą o dokończenie profilu.
// Pyta raz o potwierdzenie; pod przyciskiem data ostatniego przypomnienia i ile ich było.
export default function AdminPrzypomnij({ id, email, ostatnie, ile }: { id: string; email: string; ostatnie: string | null; ile: number }) {
  const router = useRouter();
  const [stan, setStan] = useState<"" | "wysylam">("");
  const [info, setInfo] = useState("");

  async function wyslij() {
    if (!confirm(`Wysłać przypomnienie na ${email}?`)) return;
    setStan("wysylam");
    setInfo("");
    const r = await fetch("/api/bruno/praca/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, akcja: "przypomnij" }) }).catch(() => null);
    const j = await r?.json().catch(() => null);
    setStan("");
    if (!j?.ok) return setInfo(j?.blad ?? "Nie udało się wysłać.");
    setInfo(j.pominiety ? "Pominięty: na tym komputerze poczta nie jest podłączona." : "Wysłane.");
    router.refresh();
  }

  const kiedy = ostatnie ? new Date(ostatnie).toLocaleString("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" }) : null;
  return (
    <span>
      <button type="button" className="p-btn p-btn-2 p-btn-s" disabled={stan === "wysylam"} onClick={wyslij}>
        {stan === "wysylam" ? "Wysyłam…" : ile ? "Przypomnij ponownie" : "Przypomnij"}
      </button>
      <small>{info || (kiedy ? `Wysłano ${ile}×, ostatnio ${kiedy}` : "Jeszcze nie wysłano")}</small>
    </span>
  );
}
