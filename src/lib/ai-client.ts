import { supabase } from "@/integrations/supabase/client";
import type { ShopifyProduct } from "./shopify-parser";
import { type Pillar, type Channel, type GeneratedContent, ALL_CHANNELS, getChannelLabel } from "./content-generator";

export async function generateAllChannels(
  product: ShopifyProduct,
  pillar: Pillar
): Promise<GeneratedContent[]> {
  const productData = {
    title: product.title,
    description: product.description,
    price: product.price,
  };

  const results = await Promise.allSettled(
    ALL_CHANNELS.map(async (channel): Promise<GeneratedContent> => {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: { product: productData, pillar, channel },
      });

      if (error) {
        console.error(`Error generating ${channel}:`, error);
        throw new Error(error.message || `Error en canal ${channel}`);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return {
        channel,
        label: getChannelLabel(channel),
        content: data.content,
      };
    })
  );

  const contents: GeneratedContent[] = [];
  const errors: string[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      contents.push(result.value);
    } else {
      errors.push(result.reason?.message || "Error desconocido");
    }
  }

  if (contents.length === 0) {
    throw new Error(errors[0] || "No se pudo generar contenido para ningún canal");
  }

  return contents;
}
