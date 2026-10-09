import type { Metadata } from "next";
import RejestracjaForm from "@/components/podglad/aurora/rejestracja-form";
import { googleSkonfigurowany } from "@/lib/bruno/google";

export const dynamic = "force-dynamic";

// 9.10 (USER_001): rejestracja B2C dla handlowca (3 bezpłatne rozmowy).
// B2B się nie rejestruje: konta firm zakładamy i wysyłamy sami.
// noindex do czasu podpięcia zakładania konta i maila z kodem.
export const metadata: Metadata = {
  title: "Bruno AI: sign up",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <RejestracjaForm google={googleSkonfigurowany()} />;
}
