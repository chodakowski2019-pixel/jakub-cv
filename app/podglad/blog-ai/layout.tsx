import type { Viewport } from "next";
import { BAZA } from "@/lib/blog-ai";
import { Rama } from "./rama";

// 21.11.2026 (USER_001): blog o AI w firmie. Układ jak czytelnia lovemyself, wygląd jak strona szkoleń AI
// (czerń, Geist, limonka). Listwa, stopka i kroje: rama.tsx (wspólne z katalogiem narzędzi).
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Rama etykieta="Blog" start={BAZA}>
      {children}
    </Rama>
  );
}
