import { exportAllToPDF } from "/dev-server/src/lib/pdf-exporter.ts";

// Mock data mirroring real generated content (with emojis)
const results = [
  {
    product: { title: "Chaqueta Clásica Marca Trucco's", price: "156900.00", imageUrl: "" },
    channels: [
      {
        channel: "tiktok",
        label: "TikTok / Reels",
        content: `**🎯 HOOK (0-3s)**\n¿Tus outfits se sienten "meh"? ¡Ojo a esto! 👀\n\n**📱 CUERPO (3-12s)**\n¡Pilas! La Chaqueta Clásica es otra cosa. Algodón suevecito 💫\n\n**🔥 CTA (12-15s)**\n¿Lista para transformar tu estilo? Chequéala hoy. ¡Te esperamos!\n\n**📝 NOTAS DE PRODUCCIÓN**\n- **Música:** Sonido de tendencia de TikTok, upbeat y moderno, sin letra.\n- **Efectos:** Sonidos de "whoosh" en las transiciones rápidas.\n- **Estilo Visual:** Tomas dinámicas — la modelo mostrando versatilidad.`,
      },
      {
        channel: "instagram",
        label: "Instagram / Facebook",
        content: `¿Cansada de la misma rutina de vestir? ¡Esta chaqueta te va a cambiar el chip! 😏\n\nA veces solo se necesita una prenda para que el día dé un giro de 180 grados, ¿cierto?\n\n📲 Descubre la Chaqueta Clásica y transforma tus looks. REF: T12029114\n\n#ModaColombiana #ChaquetaClasica`,
      },
    ],
  },
];

import { writeFileSync } from "fs";
// We need a DOM-less environment hack: jsPDF works in node but save() uses browser.
// Instead, build the doc and output as buffer.
import { jsPDF } from "jspdf";

// Patch save to write to disk
const origSave = jsPDF.prototype.save;
jsPDF.prototype.save = function (filename) {
  const buf = Buffer.from(this.output("arraybuffer"));
  writeFileSync("/tmp/test-output.pdf", buf);
  console.log("Saved:", filename, "size:", buf.length);
};

exportAllToPDF(results, "comunidad");
