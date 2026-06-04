import { PDFDocument, rgb, PDFFont, PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Analysis } from "./summarize";

const MARGIN = 56;
const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const CONTENT_W = PAGE_W - MARGIN * 2;

const INK = rgb(0.1, 0.12, 0.14);
const MUTED = rgb(0.42, 0.45, 0.48);
const ACCENT = rgb(0.05, 0.65, 0.6);

type Ctx = {
  doc: PDFDocument;
  font: PDFFont;
  bold: PDFFont;
  page: PDFPage;
  y: number;
};

function wrapLine(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

function newPage(ctx: Ctx) {
  ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
  ctx.y = PAGE_H - MARGIN;
}

function ensureSpace(ctx: Ctx, needed: number) {
  if (ctx.y - needed < MARGIN) newPage(ctx);
}

function drawText(
  ctx: Ctx,
  text: string,
  opts: { size?: number; font?: PDFFont; color?: typeof INK; gap?: number; indent?: number } = {},
) {
  const size = opts.size ?? 11;
  const font = opts.font ?? ctx.font;
  const color = opts.color ?? INK;
  const indent = opts.indent ?? 0;
  const lineH = size * 1.45;
  const paragraphs = text.split("\n");
  for (const para of paragraphs) {
    const lines = wrapLine(para, font, size, CONTENT_W - indent);
    for (const line of lines) {
      ensureSpace(ctx, lineH);
      ctx.page.drawText(line, { x: MARGIN + indent, y: ctx.y - size, size, font, color });
      ctx.y -= lineH;
    }
  }
  ctx.y -= opts.gap ?? 0;
}

function heading(ctx: Ctx, text: string) {
  ensureSpace(ctx, 40);
  ctx.y -= 10;
  ctx.page.drawText(text, { x: MARGIN, y: ctx.y - 14, size: 15, font: ctx.bold, color: ACCENT });
  ctx.y -= 14 + 8;
  ctx.page.drawRectangle({ x: MARGIN, y: ctx.y, width: CONTENT_W, height: 1.2, color: ACCENT, opacity: 0.35 });
  ctx.y -= 14;
}

export async function buildPdf(input: {
  title: string;
  url: string;
  analysis: Analysis;
  transcript: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const fontsDir = path.join(process.cwd(), "public", "fonts");
  const font = await doc.embedFont(await readFile(path.join(fontsDir, "Ubuntu-R.ttf")), { subset: true });
  const bold = await doc.embedFont(await readFile(path.join(fontsDir, "Ubuntu-B.ttf")), { subset: true });

  const ctx: Ctx = { doc, font, bold, page: doc.addPage([PAGE_W, PAGE_H]), y: PAGE_H - MARGIN };

  // Nagłówek dokumentu
  ctx.page.drawText("Transkrypcja i analiza wideo", { x: MARGIN, y: ctx.y - 10, size: 10, font: bold, color: ACCENT });
  ctx.y -= 28;
  drawText(ctx, input.title, { size: 20, font: bold, gap: 4 });
  drawText(ctx, input.url, { size: 9, color: MUTED, gap: 6 });
  drawText(ctx, "jakubchodakowski.com", { size: 9, color: MUTED, gap: 8 });

  if (input.analysis.shortSummary) {
    heading(ctx, "Streszczenie");
    drawText(ctx, input.analysis.shortSummary, { size: 11, gap: 6 });
  }

  if (input.analysis.keyPoints.length) {
    heading(ctx, "Najważniejsze punkty");
    for (const point of input.analysis.keyPoints) {
      ensureSpace(ctx, 18);
      ctx.page.drawText("•", { x: MARGIN, y: ctx.y - 11, size: 11, font: bold, color: ACCENT });
      drawText(ctx, point, { size: 11, indent: 16, gap: 2 });
    }
    ctx.y -= 4;
  }

  if (input.analysis.explanation) {
    heading(ctx, "Wyjaśnienie");
    drawText(ctx, input.analysis.explanation, { size: 11, gap: 6 });
  }

  heading(ctx, "Pełna transkrypcja");
  drawText(ctx, input.transcript || "(brak transkrypcji)", { size: 10, color: rgb(0.2, 0.22, 0.24) });

  return doc.save();
}
