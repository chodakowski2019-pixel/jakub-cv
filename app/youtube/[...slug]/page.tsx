import type { Metadata } from "next";
import Transkrypcje from "@/app/transkrypcje/Transkrypcje";
import { extractIdFromSlug } from "@/lib/transkrypcje/youtube";

export const metadata: Metadata = {
  title: "Transkrypcja YouTube + streszczenie AI | Jakub Chodakowski",
  description:
    "Pełna transkrypcja, streszczenie i wyjaśnienie filmu z YouTube w PDF na e-mail.",
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const last = slug?.[slug.length - 1] ?? "";
  const id = extractIdFromSlug(last);
  return <Transkrypcje initialId={id ?? undefined} />;
}
