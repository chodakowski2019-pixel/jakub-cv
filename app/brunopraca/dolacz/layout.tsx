import { Geist, DM_Mono } from "next/font/google";

// 11.11 (USER_001): baza handlowców (/praca/dolacz) ma własny wygląd wg wzoru vision-ten-alpha.vercel.app:
// lekki grotesk w nagłówkach + pismo maszynowe w etykietach i przyciskach.
const geist = Geist({ variable: "--font-baza", subsets: ["latin", "latin-ext"] });
const mono = DM_Mono({ variable: "--font-baza-mono", subsets: ["latin", "latin-ext"], weight: ["400", "500"] });

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className={`${geist.variable} ${mono.variable}`}>{children}</div>;
}
