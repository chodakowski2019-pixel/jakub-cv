import { Outfit, Inter } from "next/font/google";

// 22.11.2026: webinar dla rodziców. Kroje strony marki (Outfit + Inter) pod zmiennymi, których używa szablon webinar-lp.module.css.
const outfit = Outfit({ variable: "--font-blp-head", subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600"] });
const inter = Inter({ variable: "--font-blp-body", subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"] });

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className={`${outfit.variable} ${inter.variable}`}>{children}</div>;
}
