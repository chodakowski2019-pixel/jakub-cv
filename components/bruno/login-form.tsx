"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Jeden ekran: adres + stały 6-cyfrowy kod konta (USER_001 30.09).
// Kod nadaje USER_001 przy zakładaniu konta, tester zmienia go w panelu.

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [kod, setKod] = useState("");
  const [stan, setStan] = useState<"idle" | "wysylanie">("idle");
  const [blad, setBlad] = useState<string | null>(null);

  const zaloguj = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlad(null);
    setStan("wysylanie");
    // 9.10 (E18): źródło wejścia z linku w mailu (`/bruno?src=mail-dostep`) idzie do logu logowań.
    const src = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("src") : null;
    const res = await fetch("/api/bruno/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, kod, src }),
    });
    setStan("idle");
    if (res.ok) {
      router.push("/bruno/panel");
      router.refresh();
    } else setBlad((await res.json().catch(() => null))?.blad ?? "Couldn't log in.");
  };

  return (
    <div className="bruno-szklo rounded-3xl p-6 sm:p-8">
      <form onSubmit={zaloguj} className="flex flex-col gap-5">
        <div>
          <label className="bruno-etykieta" htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className="bruno-pole"
            placeholder="you@yourcompany.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="bruno-etykieta" htmlFor="kod">Code</label>
          <input
            id="kod"
            inputMode="numeric"
            autoComplete="current-password"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            className="bruno-pole text-center text-2xl tracking-[0.3em] font-semibold"
            placeholder="000000"
            value={kod}
            onChange={(e) => setKod(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
        </div>
        {blad && <p className="text-red-700 text-sm">{blad}</p>}
        <button type="submit" disabled={stan === "wysylanie" || kod.length !== 6} className="bruno-przycisk w-full">
          {stan === "wysylanie" ? "Logging in..." : "Log in"}
        </button>
      </form>
    </div>
  );
}
