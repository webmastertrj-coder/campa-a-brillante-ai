import { jsPDF } from "jspdf";
import { writeFileSync } from "fs";

function sanitizeForPdf(input) {
  if (!input) return "";
  return input
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
    .replace(/[\u{2600}-\u{27BF}]/gu, "")
    .replace(/[\u{1F000}-\u{1F2FF}]/gu, "")
    .replace(/[\u{FE00}-\u{FE0F}]/gu, "")
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, "")
    .replace(/[\u200B-\u200F\u2028\u2029\uFEFF]/g, "")
    .replace(/[\u200D\u20E3]/g, "")
    .replace(/[\u00A0\u202F\u2009]/g, " ")
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/[\u201C\u201D\u2033]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\x00-\xFF]/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/ +([.,;:!?])/g, "$1")
    .trimEnd();
}

const doc = new jsPDF({ unit: "mm", format: "a4" });
doc.setFont("helvetica", "bold");
doc.setFontSize(20);
doc.text(sanitizeForPdf("AdsGenius AI"), 18, 30);
doc.setFontSize(13);
doc.text(sanitizeForPdf("Chaqueta Clásica Marca Trucco's"), 18, 45);
doc.setFontSize(12);
doc.text(sanitizeForPdf("TIKTOK / REELS"), 18, 60);
doc.text(sanitizeForPdf("TÍTULOS:"), 18, 70);
doc.setFont("helvetica", "normal");
doc.setFontSize(10);
doc.text(sanitizeForPdf('¿Tus outfits se sienten "meh"? ¡Ojo a esto! 👀'), 18, 85);
doc.text(sanitizeForPdf("📲 Descubre la Chaqueta Clásica y transforma tus looks."), 18, 95);
doc.setFont("helvetica", "bold");
doc.text(sanitizeForPdf("DESCRIPCIONES:"), 18, 110);

const buf = Buffer.from(doc.output("arraybuffer"));
writeFileSync("/tmp/test-output.pdf", buf);
console.log("Saved", buf.length);
