import { redirect } from "next/navigation";

// 16.10-29.10: LP webinaru dla właścicieli firm (B2B). 31.10 (USER_001: „nie robimy tego dla b2b”): webinar B2B odwołany,
// stare linki prowadzą na webinar dla osób, które chcą zostać handlowcami.
export default function Page() {
  redirect("/webinar");
}
