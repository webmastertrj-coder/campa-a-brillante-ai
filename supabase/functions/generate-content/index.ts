import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Pillar = "ventas" | "comunidad" | "trafico" | "educacion" | "retargeting" | "descuentos" | "viral" | "testimonios" | "lanzamiento" | "fidelizacion" | "estacionalidad" | "detras_camaras";
type Channel = "tiktok" | "instagram" | "email" | "meta" | "google";

const SYSTEM_MASTER =
  "Eres un Director Creativo experto en E-commerce de moda y retail con más de 15 años de experiencia trabajando con marcas colombianas y latinoamericanas. Tu tono es cercano, cálido y auténtico — como habla una persona real en Colombia. Usa español latinoamericano colombiano (tú/vos según contexto, nunca vosotros). Evita palabras rebuscadas, extranjerismos innecesarios y NUNCA uses caracteres que no sean del alfabeto latino/español. Generas contenido que convierte, nunca genérico ni robótico. Cada pieza debe sentirse humana, fresca y escrita por alguien que entiende la cultura colombiana. IMPORTANTE: Responde ÚNICAMENTE con el contenido solicitado, en español con caracteres latinos. NO incluyas explicaciones, razonamientos, notas internas ni comentarios sobre tu proceso de pensamiento. Solo el copy/contenido final listo para usar.";

const PILLAR_PROMPTS: Record<Pillar, string> = {
  ventas:
    "Crea copys usando el modelo AIDA (Atención, Interés, Deseo, Acción). Enfócate en beneficios tangibles, escasez real y urgencia genuina. Los CTAs deben ser directos y específicos (Compra ahora, Envío gratis hoy, Últimas unidades). Para Ads, genera Títulos de máximo 40 caracteres y descripciones de alto impacto que destaquen el valor único del producto.",
  comunidad:
    "Crea contenido de valor y storytelling auténtico. No vendas directamente. Habla de tendencias actuales, consejos de uso prácticos, behind-the-scenes y haz preguntas abiertas para generar comentarios y engagement real. El tono debe ser cercano, como un amigo que sabe de moda.",
  trafico:
    "Crea ganchos de curiosidad irresistibles. Usa listas, datos sorprendentes, preguntas retóricas y cliffhangers que obliguen al usuario a hacer clic en el enlace para ver más en la tienda online. Cada hook debe generar una necesidad inmediata de saber más.",
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
    `Genera un guion profesional para TikTok/Reels con estructura precisa:
• 🎬 HOOK (0-3s): Frase impactante que detenga el scroll. Debe ser provocadora o sorprendente.
• 📱 CUERPO (3-12s): Desarrollo del mensaje con ritmo rápido. Usa frases cortas y directas. Incluye transiciones sugeridas.
• 🔥 CTA (12-15s): Llamada a la acción clara y urgente.
• 📝 NOTAS DE PRODUCCIÓN: Sugiere tipo de música, efectos y estilo visual.`,
  instagram:
    `Genera un caption profesional para Instagram/Facebook con:
• Hook inicial que detenga el scroll (primera línea es crucial)
• Cuerpo con storytelling o valor real (no relleno)
• Emojis estratégicos (no excesivos)
• CTA específico
• 8-10 hashtags relevantes y mixtos (populares + nicho)
• Formato: usa saltos de línea para legibilidad`,
  email:
    `Genera un email marketing profesional con:
• 📧 ASUNTO: Con emoji estratégico, máximo 60 caracteres, que genere curiosidad o urgencia
• PRE-HEADER: Complementa el asunto, máximo 90 caracteres
• CUERPO: Estructurado para lectura rápida con bullets, negritas implícitas y párrafos cortos
• CTA PRINCIPAL: Un solo botón claro y persuasivo
• P.D.: Línea final que refuerce la urgencia o el beneficio`,
  meta:
    `Genera un anuncio Meta Ads optimizado para conversión con:
• 📝 TEXTO PRINCIPAL: Máximo 125 caracteres, beneficio claro y directo
• 📌 TÍTULO DEL ANUNCIO: Máximo 40 caracteres, impactante
• 🔗 DESCRIPCIÓN DEL ENLACE: Máximo 30 caracteres, complementa el título
• 🎯 CTA SUGERIDO: El más apropiado (Comprar ahora, Más información, etc.)
• 💡 VARIANTE ALTERNATIVA: Una segunda versión del copy para A/B testing`,
  google:
    `Genera un anuncio Google Ads (RSA) optimizado con:
• 📊 TÍTULOS: 3 variantes de máximo 30 caracteres cada uno. Incluye keywords relevantes.
• 📝 DESCRIPCIONES: 2 variantes de máximo 90 caracteres cada una. Incluye beneficios y CTA.
• 🔑 KEYWORDS SUGERIDAS: 5 keywords relevantes para la campaña
• Asegúrate de que los títulos y descripciones funcionen en cualquier combinación.`,
};

async function validateContent(content: string, apiKey: string): Promise<string> {
  const system = "Eres un estricto corrector ortográfico y validador semántico de moda. Corrige faltas de ortografía y errores graves de concordancia de género (ej. 'la jean' o 'una jean' DEBE SER 'el jean' o 'un jean', 'esta blazer' DEBE SER 'este blazer', 'un blusa' DEBE SER 'una blusa'). Los artículos siempre deben coincidir a la perfección con la prenda. Además, asegura que los verbos usen SIEMPRE el tuteo ('tú') y nunca el voseo (corrige 'necesitás' a 'necesitas', 'imagináte' a 'imagínate', 'llevá' a 'lleva'). Respeta el formato, emojis y hashtags. Devuelve ÚNICAMENTE el texto corregido sin decir nada más.";
  
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Corrige este texto sin decir nada más que el texto corregido:\n\n${content}` },
        ],
      }),
    });

    if (!response.ok) return content;
    const data = await response.json();
    let validatedOut = data.choices?.[0]?.message?.content || content;
    return validatedOut;
  } catch (e) {
    return content;
  }
}


function cleanThinkingTokens(text: string): string {
  // Remove <think>...</think> blocks and similar reasoning patterns
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  cleaned = cleaned.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "");
  cleaned = cleaned.replace(/<thought>[\s\S]*?<\/thought>/gi, "");
  cleaned = cleaned.replace(/<internal>[\s\S]*?<\/internal>/gi, "");
  return cleaned.trim();
}

function buildPrompt(
  product: { title: string; description: string; price: string },
  pillar: Pillar,
  channel: Channel
): { system: string; user: string } {
  const system = `${SYSTEM_MASTER}\n\n${PILLAR_PROMPTS[pillar]}`;
  const user = `${CHANNEL_INSTRUCTIONS[channel]}\n\nProducto:\n- Nombre: ${product.title}\n- Descripción: ${product.description}\n- Precio: $${product.price}\n\nIMPORTANTE: Genera SOLO el contenido final en español. NO incluyas explicaciones, razonamientos ni notas sobre tu proceso. Solo el copy listo para copiar y usar. Sé creativo, específico para ESTE producto y directo.`;
  return { system, user };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { product, pillar, channel } = await req.json();

    if (!product || !pillar || !channel) {
      return new Response(
        JSON.stringify({ error: "Faltan campos: product, pillar, channel" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY no configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { system, user } = buildPrompt(product, pillar as Pillar, channel as Channel);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes alcanzado. Intenta de nuevo en unos segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA agotados. Agrega fondos en Configuración > Workspace > Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Error al generar contenido con IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    
    // Clean any reasoning/thinking tokens from the response
    content = cleanThinkingTokens(content);

    // Run semantic validation to fix grammar, tuteo and misspellings
    content = await validateContent(content, LOVABLE_API_KEY);
    content = cleanThinkingTokens(content); // Clean again just in case

    return new Response(
      JSON.stringify({ content, channel }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-content error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
