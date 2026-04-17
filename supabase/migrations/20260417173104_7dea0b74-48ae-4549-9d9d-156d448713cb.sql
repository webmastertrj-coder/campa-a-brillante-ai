CREATE TABLE public.product_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_domain TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_handle TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'add_to_cart', 'purchase')),
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_metrics_lookup
  ON public.product_metrics (shop_domain, product_id, event_type, created_at DESC);

CREATE INDEX idx_product_metrics_handle
  ON public.product_metrics (shop_domain, product_handle, event_type, created_at DESC);

ALTER TABLE public.product_metrics ENABLE ROW LEVEL SECURITY;

-- Anyone (including the public Shopify pixel) can insert events
CREATE POLICY "Anyone can insert product metrics"
  ON public.product_metrics
  FOR INSERT
  WITH CHECK (true);

-- Anyone can read aggregated metrics (used by the import flow, no auth in app yet)
CREATE POLICY "Anyone can read product metrics"
  ON public.product_metrics
  FOR SELECT
  USING (true);