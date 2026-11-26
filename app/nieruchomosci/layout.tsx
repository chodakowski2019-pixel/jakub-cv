import type { Viewport } from "next";
import { BAZA_NIERUCHOMOSCI } from "@/lib/nieruchomosci/dane";
import { Rama } from "../blog/rama";
import "./nieruchomosci.css";

// 26.11.2026 (USER_001): projekt Nieruchomości. Ta sama rama i styl co blog i katalog narzędzi AI.
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Rama etykieta="Nieruchomości" start={BAZA_NIERUCHOMOSCI}>
      {children}
    </Rama>
  );
}
