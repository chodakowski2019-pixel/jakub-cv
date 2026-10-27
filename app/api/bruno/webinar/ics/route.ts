import { webinarIcs, WEBINAR } from "@/lib/bruno/webinar";

// GET /api/bruno/webinar/ics: plik kalendarza (Apple Calendar, Outlook) z linkiem Zoom.
// 27.10: w mailu adres `data:` nie działa, więc plik z naszej domeny. Na LP też ten adres.
export async function GET() {
  return new Response(webinarIcs(), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="webinar-${WEBINAR.klucz}.ics"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
