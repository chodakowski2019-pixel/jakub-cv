import type { Viewport } from "next";
import { Outfit, Inter, Poppins } from "next/font/google";

// 30.10 (USER_001): kursy B2C na salesbruno.pl/kursy (proxy: rewrite na /brunokursy, lokalnie też /kursy).
// Czcionki jak strony webinaru (app/webinar/layout.tsx): strona kursu = układ LP webinaru, motyw Elmatic.
// Wyszukiwarka i test mają własną ramę (rama.tsx).
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

const outfit = Outfit({ variable: "--font-blp-head", subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600"] });
const poppins = Poppins({ variable: "--font-elm", subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600"] });
const inter = Inter({ variable: "--font-blp-body", subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"] });

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className={`${outfit.variable} ${inter.variable} ${poppins.variable}`}>{children}</div>;
}
