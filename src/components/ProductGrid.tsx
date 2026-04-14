import { useState } from "react";
import type { ShopifyProduct } from "@/lib/shopify-parser";
import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {visibleProducts.map((product, localIdx) => {
        const idx = start + localIdx;
        const isSelected = selectedIndices.includes(idx);
        return (
          <Card
            key={idx}
            onClick={() => onToggle(idx)}
            className={`cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-md ${
              isSelected
                ? "ring-2 ring-primary shadow-lg glow-electric"
                : "hover:ring-1 hover:ring-primary/30"
            }`}
          >
            <div className="relative aspect-square overflow-hidden bg-muted">
              {isSelected && (
                <div className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                  <Check className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
              )}
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                </div>
              )}
            </div>
            <CardContent className="p-3">
              <p className="truncate text-sm font-medium text-foreground">{product.title}</p>
              <p className="mt-1 text-sm font-semibold text-primary">${product.price}</p>
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
          <span className="text-sm text-muted-foreground">
            Página {page + 1} de {totalPages}
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
