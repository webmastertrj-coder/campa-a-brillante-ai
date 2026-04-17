import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { shop_domain, product_id, product_handle, event_type, quantity } = body || {};

    if (!shop_domain || !product_id || !event_type) {
      return new Response(
        JSON.stringify({ error: "shop_domain, product_id and event_type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["view", "add_to_cart", "purchase"].includes(event_type)) {
      return new Response(
        JSON.stringify({ error: "Invalid event_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const cleanDomain = String(shop_domain).toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");

    const { error } = await supabase.from("product_metrics").insert({
      shop_domain: cleanDomain,
      product_id: String(product_id),
      product_handle: product_handle ? String(product_handle) : null,
      event_type,
      quantity: Number.isFinite(Number(quantity)) ? Math.max(1, Math.floor(Number(quantity))) : 1,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("track-event error:", e);
    return new Response(
      JSON.stringify({ error: e?.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
