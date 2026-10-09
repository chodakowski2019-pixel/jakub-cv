import { Inter } from "next/font/google";

// Inter jak we wzorze aurora-onboard.html, z latin-ext dla polskich znaków.
export const inter = Inter({
  variable: "--font-aurora",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
});
