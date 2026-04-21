import { Poppins, Open_Sans } from "next/font/google";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
});

export default function WycenaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${poppins.variable} ${openSans.variable}`}>
      {children}
    </div>
  );
}
