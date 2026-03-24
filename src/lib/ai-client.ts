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

export async function generateForProducts(
  products: ShopifyProduct[],
  pillar: Pillar
): Promise<ProductResults[]> {
  const allResults: ProductResults[] = [];

  for (const product of products) {
    const results = await Promise.allSettled(
      ALL_CHANNELS.map((channel) => generateForChannel(product, pillar, channel))
    );

    const channels: GeneratedContent[] = [];
    const errors: string[] = [];

    for (const result of results) {
      if (result.status === "fulfilled") {
        channels.push(result.value);
      } else {
        errors.push(result.reason?.message || "Error desconocido");
      }
    }

    allResults.push({ product, channels, errors });
  }

  if (allResults.every((r) => r.channels.length === 0)) {
    throw new Error(allResults[0]?.errors[0] || "No se pudo generar contenido");
  }

  return allResults;
}
