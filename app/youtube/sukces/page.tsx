import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dziękujemy za zakup | Jakub Chodakowski",
  description: "Płatność przyjęta — PDF z transkrypcją jest w drodze na e-mail.",
  robots: { index: false },
};

export default function Page() {
  return (
    <main className="min-h-screen px-6 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-cyan-500/40 bg-white/[0.05] backdrop-blur-xl p-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-3">Płatność przyjęta! 🎉</h1>
        <p className="text-neutral-300 leading-relaxed">
          Twój PDF z transkrypcją i streszczeniem jest w drodze na podany e-mail. Dotrze w ciągu
          kilku minut — sprawdź też folder SPAM.
        </p>
        <Link
          href="/youtube"
          className="inline-block mt-6 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-medium"
        >
          Zrób kolejną
        </Link>
      </div>
    </main>
  );
}
