import type { Metadata } from "next";
import HomePage from "../_components/HomePage";

export const metadata: Metadata = {
  title: "Jakub Chodakowski — AI Implementation Specialist",
  description:
    "I help companies implement AI into their everyday business processes. Audit, custom solutions, team training.",
  alternates: {
    canonical: "https://jakubchodakowski.com/en",
    languages: {
      pl: "https://jakubchodakowski.com/",
      en: "https://jakubchodakowski.com/en",
      "x-default": "https://jakubchodakowski.com/",
    },
  },
};

export default function Page() {
  return <HomePage lang="en" />;
}
