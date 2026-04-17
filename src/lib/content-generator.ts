import type { ShopifyProduct } from "./shopify-parser";

export type Pillar = "ventas" | "comunidad" | "trafico" | "educacion" | "retargeting" | "descuentos" | "viral" | "testimonios" | "lanzamiento" | "fidelizacion" | "estacionalidad" | "detras_camaras";
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
  educacion:
    "Crea contenido educativo que posicione a la marca como autoridad. Enseña a usar el producto, consejos de cuidado o por qué los materiales son los mejores. Usa un tono experto pero cercano.",
  retargeting:
    "Crea copys directos para recuperar carritos abandonados o visitantes previos. Usa frases como 'Sabemos que te encantó' o 'No dejes escapar esta oportunidad'. Enfócate en eliminar fricciones y ofrecer garantía o envío. El CTA debe ser urgente.",
  descuentos:
    "Crea contenido para una promoción agresiva de muy corto tiempo. Destaca el porcentaje de descuento y la escasez extrema (ej. Solo 24h, unidades muy limitadas).",
  viral:
    "Crea ideas y textos pensados para viralidad. Usa formatos de retos o memes. Prima el humor, la sorpresa y que el usuario quiera compartirlo con sus amigos.",
  testimonios:
    "Copia enfocada en prueba social. Redacta el contenido como si fuera el testimonio de un cliente satisfecho o resalta cómo el producto le resolvió un problema real. Finaliza invitando a más personas a probarlo.",
  lanzamiento:
    "Contenido de tipo 'Teaser'. Genera intriga y expectativa sobre un nuevo producto o colección. No reveles todo de inmediato. Invita a suscribirse o estar atentos a la fecha.",
  fidelizacion:
    "Crea un copy exclusivo para clientes frecuentes. Hazles sentir especiales, agradéceles su lealtad y dales acceso anticipado o un beneficio extra. Tono muy cálido y exclusivo.",
  estacionalidad:
    "Crea una campaña basada en una fecha especial (ej. Día de la Madre, Regalos, Navidad). Adapta el mensaje al espíritu de esa temporada, resaltando por qué el producto es la opción perfecta.",
  detras_camaras:
    "Contenido de 'Behind the scenes'. Relata de forma transparente el esfuerzo humano, los procesos de fabricación o el equipo detrás de los productos. Genera empatía y conexión emocional.",
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
  educacion: {
    label: "Educación / Autoridad",
    description: "Enseña, da tips y demuestra la calidad de tus productos",
    icon: "BookOpen",
  },
  retargeting: {
    label: "Retargeting",
    description: "Persuasión para recuperar visitantes o carritos abandonados",
    icon: "Target",
  },
  descuentos: {
    label: "Descuentos Relámpago",
    description: "Promoción agresiva de muy corto tiempo con alta urgencia",
    icon: "Zap",
  },
  viral: {
    label: "Contenido Viral",
    description: "Enfocado en trends, memes y alto potencial de ser compartido",
    icon: "Flame",
  },
  testimonios: {
    label: "Testimonios",
    description: "Prueba social y opiniones reales de clientes",
    icon: "Star",
  },
  lanzamiento: {
    label: "Lanzamiento",
    description: "Genera expectativa o intriga antes de liberar algo nuevo",
    icon: "Rocket",
  },
  fidelizacion: {
    label: "Fidelización VIP",
    description: "Mensajes exclusivos para premiar a clientes actuales",
    icon: "Crown",
  },
  estacionalidad: {
    label: "Estacionalidad",
    description: "Campañas para festividades. Ej: Black Friday o Navidad",
    icon: "Gift",
  },
  detras_camaras: {
    label: "Tras Bambalinas",
    description: "Muestra cómo se hace y quién está detrás de tu marca",
    icon: "Video",
  },
};
