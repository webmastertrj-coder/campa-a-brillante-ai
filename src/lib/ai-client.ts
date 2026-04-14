import { supabase } from "@/integrations/supabase/client";
import type { ShopifyProduct } from "./shopify-parser";
import { type Pillar, type Channel, type GeneratedContent, ALL_CHANNELS, getChannelLabel } from "./content-generator";

export interface ProductResults {
  product: ShopifyProduct;
  channels: GeneratedContent[];
  errors: string[];
}

async function generateForChannel(
  product: ShopifyProduct,
  pillar: Pillar,
  channel: Channel
): Promise<GeneratedContent> {
  const { data, error } = await supabase.functions.invoke("generate-content", {
    body: {
      product: { title: product.title, description: product.description, price: product.price },
      pillar,
      channel,
    },
  });

  if (error) throw new Error(error.message || `Error en canal ${channel}`);
  if (data?.error) throw new Error(data.error);

  return {
    channel,
    label: getChannelLabel(channel),
    content: data.content,
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateForProducts(
  products: ShopifyProduct[],
  pillar: Pillar
): Promise<ProductResults[]> {
  const allResults: ProductResults[] = [];

  for (const product of products) {
    const channels: GeneratedContent[] = [];
    const errors: string[] = [];

    for (const channel of ALL_CHANNELS) {
      try {
        const result = await generateForChannel(product, pillar, channel);
        channels.push(result);
      } catch (e: any) {
        if (e.message?.includes("Límite de solicitudes") || e.message?.includes("429")) {
          // Wait and retry once
          await delay(3000);
          try {
            const result = await generateForChannel(product, pillar, channel);
            channels.push(result);
          } catch (retryError: any) {
            errors.push(retryError.message || "Error desconocido");
          }
        } else {
          errors.push(e.message || "Error desconocido");
        }
      }
      // Small delay between channels to avoid rate limiting
      await delay(1500);
    }

    allResults.push({ product, channels, errors });
  }

  if (allResults.every((r) => r.channels.length === 0)) {
    throw new Error(allResults[0]?.errors[0] || "No se pudo generar contenido");
  }

  return allResults;
}
