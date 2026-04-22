import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    // Extract ONLY the hostname (no path/query) so it matches what the
    // Shopify pixel sends from window.location.hostname / Shopify.shop.
    let cleanDomain = "";
    try {
      cleanDomain = new URL(storeUrl).hostname.toLowerCase();
    } catch {
      cleanDomain = storeUrl.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
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

    // Fetch metrics from last 7 days for this shop
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: metricsRows } = await supabase
      .from("product_metrics")
      .select("product_id, product_handle, event_type, quantity")
      .eq("shop_domain", cleanDomain)
      .gte("created_at", sevenDaysAgo);

    // Aggregate: key by product_id OR handle
    const agg = new Map<string, { views: number; addToCart: number; purchases: number }>();
    for (const row of metricsRows || []) {
      const keys = [row.product_id, row.product_handle].filter(Boolean) as string[];
      for (const k of keys) {
        const cur = agg.get(k) || { views: 0, addToCart: 0, purchases: 0 };
        const q = row.quantity || 1;
        if (row.event_type === "view") cur.views += q;
        else if (row.event_type === "add_to_cart") cur.addToCart += q;
        else if (row.event_type === "purchase") cur.purchases += q;
        agg.set(k, cur);
      }
    }

    const products = rawProducts.map((p: any) => {
      const m = agg.get(String(p.id)) || agg.get(String(p.handle)) || { views: 0, addToCart: 0, purchases: 0 };
      return {
        id: String(p.id),
        handle: p.handle || "",
        title: p.title || "",
        description: stripHtml(p.body_html || ""),
        price: p.variants?.[0]?.price || "0",
        imageUrl: p.images?.[0]?.src || p.image?.src || "",
        metrics: {
          views: m.views,
          addToCart: m.addToCart,
          purchases: m.purchases,
          periodDays: 7,
        },
      };
    });

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
