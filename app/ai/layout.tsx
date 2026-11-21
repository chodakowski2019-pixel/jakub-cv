import type { Viewport } from "next";
import { BAZA_NARZEDZI } from "@/lib/narzedzia-ai";
import { Rama } from "../blog/rama";

// 21.11.2026 (USER_001): katalog narzędzi AI po polsku. Adres jakubchodakowski.com/ai. Ta sama rama i styl co blog (app/blog).
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Rama etykieta="Narzędzia AI" start={BAZA_NARZEDZI}>
      {children}
    </Rama>
  );
}
