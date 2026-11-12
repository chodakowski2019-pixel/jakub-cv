"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StatusProfilu } from "@/lib/bruno/praca/profil-handlowca";
import g from "./gielda.module.css";
import AdminUsun from "./admin-usun";

// 11.11 (USER_001): administrator giełdy odhacza w profilu handlowca „Zweryfikowany”.
// Zaznaczone = status „zatwierdzony” (profil widzą firmy), odznaczone = „weryfikacja”. Osobno „Odrzuć”.
// Pierwsze zaznaczenie wysyła handlowcowi e-mail „Twój profil został zweryfikowany” (raz na profil, pilnuje serwer).
export default function AdminWeryfikacja({ id, imie, status: start }: { id: string; imie: string; status: StatusProfilu }) {
  const router = useRouter();
  const [status, setStatus] = useState(start);
  const [stan, setStan] = useState<"" | "zapis">("");
  const [blad, setBlad] = useState("");
  const [mail, setMail] = useState<"wyslany" | "pominiety" | "blad" | null>(null);

  async function ustaw(nowy: StatusProfilu) {
    setBlad("");
    setStan("zapis");
    const r = await fetch("/api/bruno/praca/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: nowy }) }).catch(() => null);
    const j = await r?.json().catch(() => null);
    setStan("");
    if (!r?.ok || !j?.ok) return setBlad(j?.blad ?? "Nie udało się zapisać.");
    setStatus(nowy);
    setMail(j.mail ?? null);
    router.refresh();
  }

  const ok = status === "zatwierdzony";
  return (
    <div className={`p-karta ${g.weryfikacja}`}>
      <label className={g.ptaszek}>
        <input type="checkbox" checked={ok} disabled={stan === "zapis"} onChange={(e) => ustaw(e.target.checked ? "zatwierdzony" : "weryfikacja")} />
        <span>
          <b>Zweryfikowany</b>
          <small>
            {ok ? "Profil widzą firmy w wyszukiwarce." : status === "odrzucony" ? "Profil odrzucony, firmy go nie widzą." : "Profil czeka, firmy go nie widzą. Pierwsze zaznaczenie wysyła handlowcowi e-mail o weryfikacji."}
            {mail === "wyslany" && " E-mail o weryfikacji wysłany."}
            {mail === "pominiety" && " E-mail pominięty: na tym komputerze poczta nie jest podłączona."}
            {mail === "blad" && " E-mail nie wyszedł, spróbuj odznaczyć i zaznaczyć ponownie."}
          </small>
        </span>
      </label>
      {blad && <span className={g.bladPola} style={{ marginTop: 0 }}>{blad}</span>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className="p-btn p-btn-2 p-btn-s" disabled={stan === "zapis"} onClick={() => ustaw(status === "odrzucony" ? "weryfikacja" : "odrzucony")}>
          {status === "odrzucony" ? "Cofnij odrzucenie" : "Odrzuć profil"}
        </button>
        <AdminUsun id={id} imie={imie} wroc />
      </div>
    </div>
  );
}
