import { jezykZHosta } from "@/lib/bruno/domeny";

export const dynamic = "force-dynamic";

// 21.10 (USER_001, Search Console): robots.txt per domena. Panel Bruno, API i podglądy zamknięte dla robotów.
export async function GET(req: Request) {
  const host = (req.headers.get("host") ?? "").toLowerCase().split(":")[0];
  const bruno = jezykZHosta(host) !== null;
  const baza = bruno ? `https://${host}` : "https://jakubchodakowski.com";
  const tekst = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /bruno/
Disallow: /podglad/
${bruno ? "Disallow: /praca/\nDisallow: /webinar\nDisallow: /webinar-firmy\n" : ""}
Sitemap: ${baza}/sitemap.xml
`;
  return new Response(tekst, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
