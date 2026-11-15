import { Geist, DM_Mono } from "next/font/google";
// 15.11: style kuli Bruno (KulaLimonka, klasy .kl-*).
import "@/app/bruno/motyw-rinesk.css";

// 14.11 (USER_001): Akademia Sprzedaży (/akademia) w tym samym wyglądzie co baza handlowców (/praca).
const geist = Geist({ variable: "--font-baza", subsets: ["latin", "latin-ext"] });
const mono = DM_Mono({ variable: "--font-baza-mono", subsets: ["latin", "latin-ext"], weight: ["400", "500"] });

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className={`${geist.variable} ${mono.variable}`}>{children}</div>;
}
