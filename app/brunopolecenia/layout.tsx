import type { Viewport } from "next";
import { Poppins } from "next/font/google";

// 11.11 (USER_001): /polecenia (localhost) = ankieta → 3 polecane szkolenia. Czcionka i styl jak /kursy (app/brunokursy).
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

const poppins = Poppins({ variable: "--font-elm", subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600"] });

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className={poppins.variable}>{children}</div>;
}
