import { writeFileSync } from "fs";
import { jsPDF } from "jspdf";
import { exportAllToPDF } from "./src/lib/pdf-exporter";

jsPDF.prototype.save = function (filename: string) {
  const buf = Buffer.from(this.output("arraybuffer"));
  writeFileSync("/tmp/test-output.pdf", buf);
  console.log("Saved", filename, "size:", buf.length);
};

exportAllToPDF(
  [
    {
      product: { title: "Chaqueta Clásica Marca Trucco's", price: "156900.00", imageUrl: "" },
      channels: [
        {
          channel: "tiktok",
          label: "TikTok / Reels",
          content: `**🎯 HOOK (0-3s)**\n¿Tus outfits se sienten "meh"? ¡Ojo a esto! 👀\n\n**📱 CUERPO (3-12s)**\n¡Pilas! La Chaqueta Clásica es otra cosa. Algodón suevecito 💫\n\n**📝 NOTAS DE PRODUCCIÓN**\n- **Música:** Sonido de tendencia de TikTok, upbeat y moderno.\n- **Efectos:** Sonidos de "whoosh" en las transiciones rápidas.\n- **Estilo Visual:** Tomas dinámicas — la modelo mostrando versatilidad.`,
        },
        {
          channel: "google",
          label: "Google Ads",
          content: `**TÍTULOS:**\n1. Chaqueta Clásica\n2. Estilo Femenino\n\n**DESCRIPCIONES:**\n1. Algodón suave, corte perfecto. ¡Define tu estilo hoy mismo!\n\n**KEYWORDS SUGERIDAS:**\n- Chaqueta Clásica Mujer`,
        },
      ],
    },
  ],
  "comunidad",
);
