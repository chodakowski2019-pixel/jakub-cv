import type { Metadata } from "next";
import Transkrypcje from "@/app/transkrypcje/Transkrypcje";

export const metadata: Metadata = {
  title: "Transkrypcja YouTube + streszczenie AI | Jakub Chodakowski",
  description:
    "Wklej link do filmu z YouTube i otrzymaj pełną transkrypcję, streszczenie oraz wyjaśnienie w PDF na e-mail.",
};

export default function Page() {
  return <Transkrypcje />;
}
