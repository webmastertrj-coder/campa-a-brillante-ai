import type { ShopifyProduct } from "@/lib/shopify-parser";
import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon, Check } from "lucide-react";

interface ProductGridProps {
  products: ShopifyProduct[];
  selectedIndices: number[];
  onToggle: (index: number) => void;
}

export function ProductGrid({ products, selectedIndices, onToggle }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {products.map((product, idx) => {
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
  );
}
