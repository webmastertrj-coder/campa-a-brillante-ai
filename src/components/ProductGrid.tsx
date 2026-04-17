import { useState, useMemo } from "react";
import type { ShopifyProduct } from "@/lib/shopify-parser";
import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon, Check, ChevronLeft, ChevronRight, Eye, ShoppingCart, Package, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortKey = "default" | "views" | "addToCart" | "purchases";

function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

const PAGE_SIZE = 20;

interface ProductGridProps {
  products: ShopifyProduct[];
  selectedIndices: number[];
  onToggle: (index: number) => void;
}

export function ProductGrid({ products, selectedIndices, onToggle }: ProductGridProps) {
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("default");

  const hasMetrics = useMemo(
    () => products.some((p) => p.metrics && (p.metrics.views || p.metrics.addToCart || p.metrics.purchases)),
    [products]
  );

  const indexed = useMemo(() => products.map((p, i) => ({ p, i })), [products]);

  const sorted = useMemo(() => {
    if (sortKey === "default") return indexed;
    return [...indexed].sort((a, b) => {
      const av = a.p.metrics?.[sortKey] ?? 0;
      const bv = b.p.metrics?.[sortKey] ?? 0;
      return bv - av;
    });
  }, [indexed, sortKey]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const start = page * PAGE_SIZE;
  const visible = sorted.slice(start, start + PAGE_SIZE);

  return (
    <div className="space-y-5">
      {hasMetrics && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-muted-foreground">
            Métricas de los <span className="font-medium text-foreground">últimos 7 días</span> desde tu tienda Shopify
          </p>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            <Select value={sortKey} onValueChange={(v) => { setSortKey(v as SortKey); setPage(0); }}>
              <SelectTrigger className="h-8 w-[180px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Orden original</SelectItem>
                <SelectItem value="views">Más vistos</SelectItem>
                <SelectItem value="addToCart">Más añadidos al carrito</SelectItem>
                <SelectItem value="purchases">Más vendidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map(({ p: product, i: idx }) => {
          const isSelected = selectedIndices.includes(idx);
          const m = product.metrics;
          const showMetrics = m && (m.views || m.addToCart || m.purchases);
          return (
            <Card
              key={idx}
              onClick={() => onToggle(idx)}
              className={`cursor-pointer overflow-hidden transition-all duration-200 group border-border/50 ${
                isSelected
                  ? "ring-2 ring-primary shadow-md"
                  : "hover:shadow-sm hover:border-primary/20"
              }`}
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-muted/50 rounded-t-lg">
                {isSelected && (
                  <div className="absolute inset-0 bg-primary/10 z-[5]" />
                )}
                {isSelected && (
                  <div className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full gradient-electric shadow-sm">
                    <Check className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                )}
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <CardContent className="p-4 space-y-3">
                <div>
                  <p className="truncate text-base font-medium text-foreground">{product.title}</p>
                  <p className="mt-1 text-base font-semibold text-primary">${product.price}</p>
                </div>
                {hasMetrics && (
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground" title="Vistas (7d)">
                      <Eye className="h-4 w-4" />
                      <span className="tabular-nums font-medium text-foreground">
                        {showMetrics ? formatNumber(m!.views) : "0"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground" title="Añadidos al carrito (7d)">
                      <ShoppingCart className="h-4 w-4" />
                      <span className="tabular-nums font-medium text-foreground">
                        {showMetrics ? formatNumber(m!.addToCart) : "0"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground" title="Compras (7d)">
                      <Package className="h-4 w-4" />
                      <span className="tabular-nums font-medium text-foreground">
                        {showMetrics ? formatNumber(m!.purchases) : "0"}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Anterior
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="gap-1"
          >
            Siguiente <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
