import type { Metadata } from "next";
import { ClinicOfferPage } from "@/components/clinic-offer";

// Offer for clinics abroad (USER_001 2026-09-22). One page, content chosen by
// ?k=<clinic key>, link sent by name in an email. noindex: the price is not
// public and the page makes no sense without the email that led to it.

export const metadata: Metadata = {
  title: "Partnership offer | Jakub Chodakowski",
  robots: { index: false, follow: false, nocache: true },
};

export default function Page() {
  return <ClinicOfferPage />;
}
