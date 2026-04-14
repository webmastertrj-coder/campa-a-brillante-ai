import { corsHeaders } from "@supabase/supabase-js/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "URL es requerida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize URL
    let storeUrl = url.trim().replace(/\/+$/, "");
    if (!storeUrl.startsWith("http")) {
      storeUrl = `https://${storeUrl}`;
    }

    // Fetch products.json (Shopify exposes this publicly)
    const productsUrl = `${storeUrl}/products.json?limit=250`;
    const response = await fetch(productsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AdsGeniusAI/1.0)",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: `No se pudo acceder a la tienda. Verifica que la URL sea correcta y que la tienda sea pública. (${response.status})`,
        }),
        {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const rawProducts = data.products || [];

    const products = rawProducts.map((p: any) => ({
      title: p.title || "",
      description: stripHtml(p.body_html || ""),
      price: p.variants?.[0]?.price || "0",
      imageUrl: p.images?.[0]?.src || p.image?.src || "",
    }));

    return new Response(JSON.stringify({ products }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching Shopify products:", error);
    return new Response(
      JSON.stringify({ error: "Error al obtener los productos. Verifica la URL e intenta de nuevo." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
