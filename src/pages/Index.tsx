import { useState, useCallback } from "react";
import { Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUploader } from "@/components/FileUploader";
import { ProductGrid } from "@/components/ProductGrid";
import { PillarSelector } from "@/components/PillarSelector";
import { ResultsTabs } from "@/components/ResultsTabs";
import type { ShopifyProduct } from "@/lib/shopify-parser";
import { type Pillar } from "@/lib/content-generator";
import { generateForProducts, type ProductResults } from "@/lib/ai-client";
import { toast } from "sonner";

export default function Index() {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [selectedPillar, setSelectedPillar] = useState<Pillar | null>(null);
  const [results, setResults] = useState<ProductResults[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleProduct = useCallback((index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }, []);

  const handleGenerate = useCallback(async () => {
    if (selectedIndices.length === 0 || !selectedPillar) return;
    setIsLoading(true);
    setResults([]);
    try {
      const selectedProducts = selectedIndices.map((i) => products[i]);
      const content = await generateForProducts(selectedProducts, selectedPillar);
      setResults(content);
      if (content.some((r) => r.errors.length > 0)) {
        toast.warning("Algunos canales tuvieron errores, pero se generó contenido parcial.");
      }
    } catch (e: any) {
      toast.error(e.message || "Error al generar contenido");
    } finally {
      setIsLoading(false);
    }
  }, [selectedIndices, selectedPillar, products]);

  const canGenerate = selectedIndices.length > 0 && selectedPillar !== null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-electric">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">
              AdsGenius <span className="text-gradient">AI</span>
            </span>
          </div>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Automatización de marketing con IA
          </p>
        </div>
      </header>

      <main className="container py-8 space-y-8 animate-fade-in">
        {/* Hero section */}
        <section className="text-center space-y-3">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Transforma tus productos en{" "}
            <span className="text-gradient">campañas multicanal</span>
          </h1>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground">
            Sube tu catálogo de Shopify, elige una estrategia y genera contenido
            optimizado para todos tus canales en segundos.
          </p>
        </section>

        {/* Step 1: Upload */}
        <section className="space-y-3">
          <StepHeader number={1} title="Sube tu catálogo de Shopify" />
          <FileUploader onProductsLoaded={setProducts} />
        </section>

        {/* Step 2: Select products */}
        {products.length > 0 && (
          <section className="space-y-3 animate-fade-in">
            <StepHeader
              number={2}
              title={`Selecciona productos (${selectedIndices.length} de ${products.length} seleccionados)`}
            />
            <ProductGrid
              products={products}
              selectedIndices={selectedIndices}
              onToggle={handleToggleProduct}
            />
          </section>
        )}

        {/* Step 3: Select pillar */}
        {selectedIndices.length > 0 && (
          <section className="space-y-3 animate-fade-in">
            <StepHeader number={3} title="Elige tu pilar estratégico" />
            <PillarSelector selected={selectedPillar} onSelect={setSelectedPillar} />
          </section>
        )}

        {/* Generate button */}
        {canGenerate && (
          <div className="flex justify-center animate-fade-in">
            <Button
              variant="electric"
              size="lg"
              onClick={handleGenerate}
              disabled={isLoading}
              className="gap-2 px-8"
            >
              <Sparkles className="h-4 w-4" />
              {isLoading
                ? "Generando..."
                : `Generar Contenido (${selectedIndices.length} producto${selectedIndices.length > 1 ? "s" : ""})`}
            </Button>
          </div>
        )}

        {/* Step 4: Results */}
        {(results.length > 0 || isLoading) && (
          <section className="space-y-3 animate-fade-in">
            <StepHeader number={4} title="Contenido generado" />
            <ResultsTabs results={results} isLoading={isLoading} />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 mt-16">
        <div className="container text-center text-xs text-muted-foreground">
          AdsGenius AI — Automatización de marketing inteligente
        </div>
      </footer>
    </div>
  );
}

function StepHeader({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full gradient-electric text-xs font-bold text-primary-foreground">
        {number}
      </div>
      <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
    </div>
  );
}
