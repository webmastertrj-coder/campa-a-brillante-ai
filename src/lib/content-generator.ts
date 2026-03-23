import type { ShopifyProduct } from "./shopify-parser";

export type Pillar = "ventas" | "comunidad" | "trafico";
export type Channel = "tiktok" | "instagram" | "email" | "meta" | "google";

export interface GeneratedContent {
  channel: Channel;
  label: string;
  content: string;
}

const SYSTEM_MASTER =
  "Eres un Director Creativo experto en E-commerce de moda y retail. Tu tono es persuasivo, moderno y adaptado al mercado hispanohablante.";

const PILLAR_PROMPTS: Record<Pillar, string> = {
  ventas:
    "Crea copys usando el modelo AIDA. Enfócate en beneficios, escasez y urgencia. Los CTAs deben ser directos (Compra ahora, Envío gratis hoy). Para Ads, genera Títulos de máximo 40 caracteres y descripciones de alto impacto.",
  comunidad:
    "Crea contenido de valor y storytelling. No vendas directamente. Habla de tendencias, consejos de uso y haz preguntas para generar comentarios y engagement.",
  trafico:
    "Crea ganchos de curiosidad. Usa listas o datos interesantes que obliguen al usuario a hacer clic en el enlace para ver más en la tienda online.",
};

const CHANNEL_INSTRUCTIONS: Record<Channel, string> = {
  tiktok:
    "Genera un guion para TikTok/Reels con:\n• Hook (0-3s): frase impactante\n• Cuerpo (3-12s): desarrollo del mensaje\n• CTA (12-15s): llamada a la acción",
  instagram:
    "Genera un caption para Instagram/Facebook con:\n• Hook inicial que detenga el scroll\n• Cuerpo con storytelling o valor\n• CTA y hashtags relevantes (máx 10)",
  email:
    "Genera un email marketing con:\n• Asunto con emojis (máx 60 caracteres)\n• Pre-header\n• Cuerpo estructurado para lectura rápida con bullets\n• CTA principal",
  meta:
    "Genera un anuncio Meta Ads con:\n• Texto principal (máx 125 caracteres)\n• Título del anuncio (máx 40 caracteres)\n• Descripción del enlace (máx 30 caracteres)\n• CTA sugerido",
  google:
    "Genera un anuncio Google Ads con:\n• 3 variantes de títulos (máx 30 caracteres cada uno)\n• 2 descripciones (máx 90 caracteres cada una)",
};

export function buildPrompt(
  product: ShopifyProduct,
  pillar: Pillar,
  channel: Channel
): string {
  return `${SYSTEM_MASTER}\n\n${PILLAR_PROMPTS[pillar]}\n\n${CHANNEL_INSTRUCTIONS[channel]}\n\nProducto:\n- Nombre: ${product.title}\n- Descripción: ${product.description}\n- Precio: $${product.price}\n\nGenera el contenido en español. Sé creativo y directo.`;
}

export function getChannelLabel(channel: Channel): string {
  const labels: Record<Channel, string> = {
    tiktok: "TikTok / Reels",
    instagram: "Instagram / Facebook",
    email: "Email Marketing",
    meta: "Meta Ads",
    google: "Google Ads",
  };
  return labels[channel];
}

export const ALL_CHANNELS: Channel[] = [
  "tiktok",
  "instagram",
  "email",
  "meta",
  "google",
];

export const PILLAR_INFO: Record<Pillar, { label: string; description: string; icon: string }> = {
  ventas: {
    label: "Ventas",
    description: "Meta & Google Ads con modelo AIDA, urgencia y CTAs directos",
    icon: "TrendingUp",
  },
  comunidad: {
    label: "Comunidad",
    description: "Storytelling, engagement y contenido de valor para redes",
    icon: "Users",
  },
  trafico: {
    label: "Tráfico Web",
    description: "Ganchos de curiosidad para llevar usuarios a tu tienda",
    icon: "MousePointerClick",
  },
};
