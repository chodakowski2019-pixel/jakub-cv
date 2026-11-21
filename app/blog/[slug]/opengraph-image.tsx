import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { AUTOR, artykul, grupa, wszystkieArtykuly } from "@/lib/blog-ai";

// Obraz do udostępniania, osobny dla każdego tekstu (zasada: każda podstrona ma własne OG).
// Krój Ubuntu z public/fonts, bo ma polskie znaki. Kolory jak na stronie szkoleń.
export const alt = "Blog o AI w firmie, Jakub Chodakowski";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return wszystkieArtykuly().map((a) => ({ slug: a.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const a = artykul((await params).slug);
  const [zwykly, gruby] = await Promise.all([
    readFile(join(process.cwd(), "public/fonts/Ubuntu-R.ttf")),
    readFile(join(process.cwd(), "public/fonts/Ubuntu-B.ttf")),
  ]);
  const tytul = a?.tytul ?? "Blog o AI w firmie";
  const nad = (a && grupa(a.grupa)?.nazwa) || "Blog";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "#030405",
          color: "#eef3f3",
          fontFamily: "Ubuntu",
          borderLeft: "14px solid #d9e000",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, letterSpacing: 4, color: "#a7b1b4" }}>
          <span>{nad.toUpperCase()}</span>
          <span style={{ color: "#e9f542" }}>{a ? String(a.nr).padStart(2, "0") : ""}</span>
        </div>
        <div style={{ display: "flex", fontSize: tytul.length > 48 ? 64 : 76, lineHeight: 1.08, letterSpacing: -2, maxWidth: 1000 }}>{tytul}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "1px solid rgba(238,243,243,0.27)", paddingTop: 28 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 30, fontWeight: 700 }}>{AUTOR.imie}</span>
            <span style={{ fontSize: 24, color: "#a7b1b4", marginTop: 6 }}>Szkolenia AI dla firm</span>
          </div>
          <span style={{ fontSize: 24, color: "#e9f542" }}>jakubchodakowski.com</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Ubuntu", data: zwykly, style: "normal", weight: 400 },
        { name: "Ubuntu", data: gruby, style: "normal", weight: 700 },
      ],
    },
  );
}
