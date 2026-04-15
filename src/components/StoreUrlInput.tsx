import { useState } from "react";
import { Store, Loader2, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { ShopifyProduct } from "@/lib/shopify-parser";
import { toast } from "sonner";

interface StoreUrlInputProps {
  onProductsLoaded: (products: ShopifyProduct[]) => void;
}

export function StoreUrlInput({ onProductsLoaded }: StoreUrlInputProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [productCount, setProductCount] = useState(0);

  const handleFetch = async () => {
    if (!url.trim()) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-shopify-products", {
        body: { url: url.trim() },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const products: ShopifyProduct[] = data.products || [];
      if (products.length === 0) {
        toast.error("No se encontraron productos en esta tienda");
        return;
      }

      setLoadedUrl(url.trim());
      setProductCount(products.length);
      onProductsLoaded(products);
      toast.success(`${products.length} producto${products.length > 1 ? "s" : ""} cargado${products.length > 1 ? "s" : ""}`);
    } catch (e: any) {
      toast.error(e.message || "Error al obtener productos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setUrl("");
    setLoadedUrl(null);
    setProductCount(0);
    onProductsLoaded([]);
  };

  if (loadedUrl) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 transition-all">
        <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">{loadedUrl}</p>
          <p className="text-xs text-muted-foreground">{productCount} productos importados</p>
        </div>
        <button
          onClick={handleClear}
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="url"
          placeholder="https://tu-tienda.myshopify.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleFetch()}
          disabled={isLoading}
          className="pl-10 h-11"
        />
      </div>
      <Button
        variant="electric"
        onClick={handleFetch}
        disabled={isLoading || !url.trim()}
        className="gap-2 shrink-0 h-11"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Store className="h-4 w-4" />}
        {isLoading ? "Cargando..." : "Importar Productos"}
      </Button>
    </div>
  );
}
