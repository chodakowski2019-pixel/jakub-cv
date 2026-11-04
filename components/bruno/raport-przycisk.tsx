"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/components/bruno/jezyk-kontekst";

// 4.11 (pkt 3): „Wygeneruj teraz” → POST /api/bruno/raport → odświeżenie strony (nowy raport na górze).

export default function RaportPrzycisk() {
  const { t } = useT();
  const router = useRouter();
  const [stan, setStan] = useState<"" | "trwa" | "blad">("");
  const [blad, setBlad] = useState("");
  const klik = async () => {
    setStan("trwa");
    setBlad("");
    try {
      const r = await fetch("/api/bruno/raport", { method: "POST" });
      const j = (await r.json().catch(() => ({}))) as { blad?: string };
      if (!r.ok) throw new Error(j.blad || `HTTP ${r.status}`);
      setStan("");
      router.refresh();
    } catch (e) {
      setStan("blad");
      setBlad(String((e as Error)?.message ?? e));
    }
  };
  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" onClick={klik} disabled={stan === "trwa"} className="bruno-przycisk px-5 py-2.5 text-sm">
        {stan === "trwa" ? t("Bruno is writing… (~20 s)", "Bruno pisze… (ok. 20 s)") : t("Generate now", "Wygeneruj teraz")}
      </button>
      {stan === "blad" && <span className="text-xs text-rose-800 max-w-[280px] text-right break-words">{blad}</span>}
    </div>
  );
}
