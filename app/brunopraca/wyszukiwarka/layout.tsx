import { Poppins, Open_Sans, Outfit } from "next/font/google";
// 12.11 (USER_001): publiczna wyszukiwarka handlowców wygląda jak panel Bruno AI: te same arkusze i czcionki co /praca/panel.
import "@/app/bruno/bruno.css";
import "@/app/bruno/motyw-rinesk.css";
import "@/app/bruno/panel-2.css";

const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin", "latin-ext"], weight: ["600", "700", "800"] });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600"] });
const openSans = Open_Sans({ variable: "--font-open-sans", subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"] });

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className={`bruno zloty rinesk ${poppins.variable} ${openSans.variable} ${outfit.variable} font-[var(--font-open-sans)]`}>{children}</div>;
}
