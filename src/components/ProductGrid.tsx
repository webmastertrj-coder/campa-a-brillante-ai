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
  const totalPages = Math.ceil(products.length / PAGE_SIZE);
  const start = page * PAGE_SIZE;
  const visibleProducts = products.slice(start, start + PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {visibleProducts.map((product, localIdx) => {
          const idx = start + localIdx;
          const isSelected = selectedIndices.includes(idx);
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
              <CardContent className="p-3">
                <p className="truncate text-sm font-medium text-foreground">{product.title}</p>
                <p className="mt-0.5 text-sm font-semibold text-primary">${product.price}</p>
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
