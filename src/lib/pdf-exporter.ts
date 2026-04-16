import { jsPDF } from "jspdf";
import type { ProductResults } from "./ai-client";
import type { GeneratedContent } from "./content-generator";
import type { ShopifyProduct } from "./shopify-parser";

// Layout constants (mm)
const MARGIN_X = 18;
const MARGIN_TOP = 20;
const MARGIN_BOTTOM = 20;
const PAGE_WIDTH = 210; // A4
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

const PILLAR_LABELS: Record<string, string> = {
  ventas: "Ventas Directas",
  comunidad: "Comunidad y Branding",
  trafico: "Tráfico y Awareness",
};

/**
 * jsPDF's standard fonts (helvetica) only support WinAnsi encoding.
 * Emojis and other non-Latin1 characters render as garbage glyphs (e.g. "Ø=ÜÝ").
 * This function strips them while keeping Spanish accents (á, é, í, ó, ú, ñ, ¿, ¡, etc.).
 */
function sanitizeForPdf(input: string): string {
  if (!input) return "";
  return (
    input
      // Remove emoji ranges
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
      .replace(/[\u{2600}-\u{27BF}]/gu, "")
      .replace(/[\u{1F000}-\u{1F2FF}]/gu, "")
      .replace(/[\u{FE00}-\u{FE0F}]/gu, "") // variation selectors
      .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, "") // regional indicators
      .replace(/[\u200D\u20E3]/g, "") // ZWJ + keycap
      // Replace non-breaking/narrow spaces
      .replace(/[\u00A0\u202F\u2009]/g, " ")
      // Smart quotes / dashes → ASCII equivalents (Helvetica WinAnsi safe)
      .replace(/[\u2018\u2019\u2032]/g, "'")
      .replace(/[\u201C\u201D\u2033]/g, '"')
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/\u2026/g, "...")
      // Drop any remaining non-Latin1 character that helvetica can't encode
      .replace(/[^\x00-\xFF]/g, "")
      // Collapse repeated spaces left by removed glyphs
      .replace(/[ \t]{2,}/g, " ")
      .replace(/ +([.,;:!?])/g, "$1")
      .trimEnd()
  );
}

interface PdfCursor {
  doc: jsPDF;
  y: number;
  page: number;
}

function newPage(cursor: PdfCursor) {
  cursor.doc.addPage();
  cursor.page += 1;
  cursor.y = MARGIN_TOP;
  drawFooter(cursor);
}

function ensureSpace(cursor: PdfCursor, needed: number) {
  if (cursor.y + needed > PAGE_HEIGHT - MARGIN_BOTTOM) {
    newPage(cursor);
  }
}

function drawFooter(cursor: PdfCursor) {
  const { doc } = cursor;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150);
  const today = new Date().toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.text(`AdsGenius AI · Generado el ${today}`, MARGIN_X, PAGE_HEIGHT - 10);
  doc.text(`Pág. ${cursor.page}`, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 10, {
    align: "right",
  });
  doc.setTextColor(0);
}

function drawCoverHeader(cursor: PdfCursor, pillar: string) {
  const { doc } = cursor;
  // Top accent bar
  doc.setFillColor(37, 99, 235); // electric blue
  doc.rect(0, 0, PAGE_WIDTH, 8, "F");

  cursor.y = MARGIN_TOP + 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text("AdsGenius AI", MARGIN_X, cursor.y);

  cursor.y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(
    `Campaña · Pilar estratégico: ${PILLAR_LABELS[pillar] ?? pillar}`,
    MARGIN_X,
    cursor.y,
  );

  cursor.y += 6;
  doc.setDrawColor(220);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_X, cursor.y, PAGE_WIDTH - MARGIN_X, cursor.y);
  cursor.y += 6;
  doc.setTextColor(0);
}

function drawProductHeader(cursor: PdfCursor, product: ShopifyProduct) {
  ensureSpace(cursor, 28);
  const { doc } = cursor;

  // Card background
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(MARGIN_X, cursor.y, CONTENT_WIDTH, 22, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  const safeTitle = sanitizeForPdf(product.title);
  const titleLines = doc.splitTextToSize(safeTitle, CONTENT_WIDTH - 8) as string[];
  doc.text(titleLines[0], MARGIN_X + 4, cursor.y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80);
  const ref = sanitizeFilename(product.title).toLowerCase() || "—";
  doc.text(
    `Precio: $${product.price}    ·    Ref: ${ref}`,
    MARGIN_X + 4,
    cursor.y + 16,
  );

  cursor.y += 28;
  doc.setTextColor(0);
}

function drawChannelHeader(cursor: PdfCursor, label: string) {
  ensureSpace(cursor, 12);
  const { doc } = cursor;
  doc.setFillColor(37, 99, 235);
  doc.rect(MARGIN_X, cursor.y, 3, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(sanitizeForPdf(label).toUpperCase(), MARGIN_X + 6, cursor.y + 5);
  cursor.y += 10;
  doc.setTextColor(0);
}

/**
 * Render a single line of markdown-ish content to the PDF.
 * Supports: # headings, - bullets, **bold** inline segments.
 */
function renderMarkdownLine(cursor: PdfCursor, rawLine: string) {
  const { doc } = cursor;
  const lineHeight = 5;

  // Empty line → small vertical space
  if (rawLine.trim() === "") {
    cursor.y += 2.5;
    return;
  }

  // Headings
  const headingMatch = rawLine.match(/^(#{1,3})\s+(.*)$/);
  if (headingMatch) {
    const level = headingMatch[1].length;
    const text = headingMatch[2];
    const size = level === 1 ? 13 : level === 2 ? 12 : 11;
    ensureSpace(cursor, 8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(15, 23, 42);
    const wrapped = doc.splitTextToSize(text, CONTENT_WIDTH) as string[];
    for (const w of wrapped) {
      ensureSpace(cursor, lineHeight + 2);
      doc.text(w, MARGIN_X, cursor.y);
      cursor.y += lineHeight + 1;
    }
    cursor.y += 1;
    doc.setTextColor(0);
    return;
  }

  // Bullets
  const bulletMatch = rawLine.match(/^\s*[-*•]\s+(.*)$/);
  if (bulletMatch) {
    const text = bulletMatch[1];
    const indent = 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const wrapped = doc.splitTextToSize(text, CONTENT_WIDTH - indent) as string[];
    for (let i = 0; i < wrapped.length; i++) {
      ensureSpace(cursor, lineHeight);
      if (i === 0) {
        doc.text("•", MARGIN_X + 1, cursor.y);
      }
      drawInlineSegments(cursor, wrapped[i], MARGIN_X + indent);
      cursor.y += lineHeight;
    }
    return;
  }

  // Regular paragraph with potential **bold** segments
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  // Wrap the raw line first (without markup) — splitTextToSize doesn't know about **,
  // but we need to wrap correctly. Strip markers for measurement, then re-render with bold segments.
  const stripped = rawLine.replace(/\*\*(.+?)\*\*/g, "$1");
  const wrapped = doc.splitTextToSize(stripped, CONTENT_WIDTH) as string[];

  // Re-map wrapped lines back to bold markup by tracking position
  // Simpler approach: render each wrapped line, applying bold to segments that match
  // To preserve **bold**, we re-tokenize the original and emit per wrapped line by char count.
  let cursorChar = 0;
  const segments = tokenizeBold(rawLine); // [{text, bold}]
  for (const wLine of wrapped) {
    ensureSpace(cursor, lineHeight);
    const lineSegs = sliceSegments(segments, cursorChar, cursorChar + wLine.length);
    drawSegmentedLine(cursor, lineSegs, MARGIN_X);
    cursor.y += lineHeight;
    cursorChar += wLine.length;
    // account for the space jsPDF removed at wrap boundary
    if (cursorChar < stripped.length && stripped[cursorChar] === " ") cursorChar += 1;
  }
}

interface Segment {
  text: string;
  bold: boolean;
}

function tokenizeBold(input: string): Segment[] {
  const segs: Segment[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(input)) !== null) {
    if (m.index > last) segs.push({ text: input.slice(last, m.index), bold: false });
    segs.push({ text: m[1], bold: true });
    last = m.index + m[0].length;
  }
  if (last < input.length) segs.push({ text: input.slice(last), bold: false });
  return segs;
}

function sliceSegments(segs: Segment[], start: number, end: number): Segment[] {
  // Map character indices on the *stripped* text to the segment list.
  const out: Segment[] = [];
  let pos = 0;
  for (const s of segs) {
    const segStart = pos;
    const segEnd = pos + s.text.length;
    if (segEnd <= start) {
      pos = segEnd;
      continue;
    }
    if (segStart >= end) break;
    const sliceStart = Math.max(0, start - segStart);
    const sliceEnd = Math.min(s.text.length, end - segStart);
    out.push({ text: s.text.slice(sliceStart, sliceEnd), bold: s.bold });
    pos = segEnd;
  }
  return out;
}

function drawSegmentedLine(cursor: PdfCursor, segs: Segment[], startX: number) {
  const { doc } = cursor;
  let x = startX;
  for (const s of segs) {
    doc.setFont("helvetica", s.bold ? "bold" : "normal");
    doc.text(s.text, x, cursor.y);
    x += doc.getTextWidth(s.text);
  }
  doc.setFont("helvetica", "normal");
}

function drawInlineSegments(cursor: PdfCursor, text: string, startX: number) {
  const segs = tokenizeBold(text);
  drawSegmentedLine(cursor, segs, startX);
}

function renderMarkdown(cursor: PdfCursor, markdown: string) {
  const sanitized = sanitizeForPdf(markdown);
  const lines = sanitized.split("\n");
  for (const line of lines) {
    renderMarkdownLine(cursor, line);
  }
}

function sanitizeFilename(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export function exportAllToPDF(results: ProductResults[], pillar: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const cursor: PdfCursor = { doc, y: MARGIN_TOP, page: 1 };

  drawFooter(cursor);
  drawCoverHeader(cursor, pillar);

  results.forEach((pr, idx) => {
    if (idx > 0) {
      cursor.y += 4;
      ensureSpace(cursor, 40);
    }
    drawProductHeader(cursor, pr.product);

    if (pr.channels.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text("No se generó contenido para este producto.", MARGIN_X, cursor.y);
      doc.setTextColor(0);
      cursor.y += 6;
      return;
    }

    pr.channels.forEach((ch) => {
      drawChannelHeader(cursor, ch.label);
      renderMarkdown(cursor, ch.content);
      cursor.y += 4;
    });
  });

  const pillarSlug = sanitizeFilename(pillar);
  doc.save(`adsgenius-campana-${pillarSlug}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportChannelToPDF(
  product: ShopifyProduct,
  channel: GeneratedContent,
  pillar: string,
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const cursor: PdfCursor = { doc, y: MARGIN_TOP, page: 1 };

  drawFooter(cursor);
  drawCoverHeader(cursor, pillar);
  drawProductHeader(cursor, product);
  drawChannelHeader(cursor, channel.label);
  renderMarkdown(cursor, channel.content);

  const slug = sanitizeFilename(`${product.title}-${channel.channel}`);
  doc.save(`adsgenius-${slug}.pdf`);
}
