import type { ShopifyProduct } from "@/lib/shopify-parser";
import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";

interface ProductGridProps {
  products: ShopifyProduct[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export function ProductGrid({ products, selectedIndex, onSelect }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {products.map((product, idx) => (
        <Card
          key={idx}
          onClick={() => onSelect(idx)}
          className={`cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-md ${
            selectedIndex === idx
              ? "ring-2 ring-primary shadow-lg glow-electric"
              : "hover:ring-1 hover:ring-primary/30"
          }`}
        >
          <div className="aspect-square overflow-hidden bg-muted">
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
      ))}
    </div>
  );
}
