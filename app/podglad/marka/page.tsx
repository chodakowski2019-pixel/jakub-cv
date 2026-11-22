import { permanentRedirect } from "next/navigation";

// 22.11.2026: podgląd strony marki stał się stroną główną (app/page.tsx). Stary adres przekierowuje na „/”.
export default function Page() {
  permanentRedirect("/");
}
