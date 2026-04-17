/**
 * AdsGenius AI — Shopify Product Tracker
 * --------------------------------------
 * Envía eventos (vistas, add to cart, compras) a AdsGenius para
 * enriquecer la importación de productos con datos reales.
 *
 * Cómo instalar (Custom Pixel - recomendado):
 *  1. Admin de Shopify → Configuración → Eventos del cliente → Añadir píxel personalizado.
 *  2. Pega TODO el contenido de este archivo dentro del editor.
 *  3. Cambia ENDPOINT si tu proyecto no es el por defecto.
 *  4. Guarda y conecta el píxel.
 *
 * Cómo instalar (alternativa - theme.liquid):
 *  1. Sube este archivo a Assets en tu tema.
 *  2. En theme.liquid, antes de </body>, añade:
 *       <script src="{{ 'shopify-tracker.js' | asset_url }}" defer></script>
 *
 * Notas:
 *  - No envía datos personales de clientes.
 *  - Usa sendBeacon para no afectar el rendimiento.
 */

(function () {
  var ENDPOINT = "https://frpybgmdzzaypliqjhjn.supabase.co/functions/v1/track-event";
  var SHOP_DOMAIN = (typeof Shopify !== "undefined" && Shopify.shop) ? Shopify.shop : window.location.hostname;

  function send(payload) {
    try {
      payload.shop_domain = SHOP_DOMAIN;
      var body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        var blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon(ENDPOINT, blob);
      } else {
        fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: body,
          keepalive: true,
        }).catch(function () {});
      }
    } catch (e) {}
  }

  /* ─── 1) Custom Pixel API (Shopify analytics.subscribe) ───────────────── */
  if (typeof analytics !== "undefined" && typeof analytics.subscribe === "function") {
    analytics.subscribe("product_viewed", function (event) {
      var p = event && event.data && event.data.productVariant && event.data.productVariant.product;
      if (!p) return;
      send({ event_type: "view", product_id: String(p.id || ""), product_handle: p.handle || null, quantity: 1 });
    });

    analytics.subscribe("product_added_to_cart", function (event) {
      var line = event && event.data && event.data.cartLine;
      var p = line && line.merchandise && line.merchandise.product;
      if (!p) return;
      send({
        event_type: "add_to_cart",
        product_id: String(p.id || ""),
        product_handle: p.handle || null,
        quantity: (line && line.quantity) || 1,
      });
    });

    analytics.subscribe("checkout_completed", function (event) {
      var lines = (event && event.data && event.data.checkout && event.data.checkout.lineItems) || [];
      lines.forEach(function (line) {
        var p = line && line.variant && line.variant.product;
        if (!p) return;
        send({
          event_type: "purchase",
          product_id: String(p.id || ""),
          product_handle: p.handle || null,
          quantity: line.quantity || 1,
        });
      });
    });
    return; // Pixel mode handles everything
  }

  /* ─── 2) Theme mode: detección por URL y eventos del DOM ──────────────── */
  function getProductFromMeta() {
    if (window.ShopifyAnalytics && ShopifyAnalytics.meta && ShopifyAnalytics.meta.product) {
      var pm = ShopifyAnalytics.meta.product;
      return { id: String(pm.id || ""), handle: pm.handle || null };
    }
    var m = window.location.pathname.match(/\/products\/([^\/?#]+)/);
    if (m) return { id: "", handle: m[1] };
    return null;
  }

  // Vista de producto
  if (/\/products\//.test(window.location.pathname)) {
    var prod = getProductFromMeta();
    if (prod) send({ event_type: "view", product_id: prod.id, product_handle: prod.handle, quantity: 1 });
  }

  // Add to cart vía formulario AJAX/clásico
  document.addEventListener("submit", function (e) {
    var form = e.target;
    if (!form || form.action == null) return;
    if (form.action.indexOf("/cart/add") === -1) return;
    var prod = getProductFromMeta();
    var qtyInput = form.querySelector('input[name="quantity"]');
    var qty = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;
    if (prod) send({ event_type: "add_to_cart", product_id: prod.id, product_handle: prod.handle, quantity: qty });
  }, true);

  // Página de gracias = compra
  if (/\/thank_you|\/orders\//.test(window.location.pathname) && window.Shopify && window.Shopify.checkout) {
    var items = window.Shopify.checkout.line_items || [];
    items.forEach(function (li) {
      send({
        event_type: "purchase",
        product_id: String(li.product_id || ""),
        product_handle: li.handle || null,
        quantity: li.quantity || 1,
      });
    });
  }
})();
