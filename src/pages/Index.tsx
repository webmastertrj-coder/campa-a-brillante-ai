import { useState, useCallback } from "react";
import { Sparkles, Zap, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { StoreUrlInput } from "@/components/StoreUrlInput";
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
  const [isUnified, setIsUnified] = useState(false);
  const [results, setResults] = useState<ProductResults[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const currentStep = products.length === 0
    ? 1
    : selectedIndices.length === 0
    ? 2
    : !selectedPillar
    ? 3
    : results.length > 0 || isLoading
    ? 5
    : 4;

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
      
      let targetProducts = selectedProducts;
      if (isUnified && selectedProducts.length > 1) {
        targetProducts = [{
          id: "unified",
          title: `Campaña Unificada (${selectedProducts.length} productos)`,
          description: "Esta campaña única incluye los siguientes productos consolidados:\n\n" + selectedProducts.map(p => `• ${p.title} (Precio: $${p.price})\nDescripción: ${p.description}`).join("\n\n"),
          price: "Varios",
          imageUrl: selectedProducts[0].imageUrl,
          metrics: { views: 0, addToCart: 0, purchases: 0, periodDays: 7 },
        } satisfies ShopifyProduct];
      }

      const content = await generateForProducts(targetProducts, selectedPillar);
      setResults(content);
      if (content.some((r) => r.errors.length > 0)) {
        toast.warning("Algunos canales tuvieron errores, pero se generó contenido parcial.");
      }
    } catch (e: any) {
      toast.error(e.message || "Error al generar contenido");
    } finally {
      setIsLoading(false);
    }
  }, [selectedIndices, selectedPillar, products, isUnified]);

  const canGenerate = selectedIndices.length > 0 && selectedPillar !== null;

  return (
    <div className="min-h-screen gradient-mesh">
      {/* Header */}
      <header className="border-b border-border/40 glass sticky top-0 z-50">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-electric shadow-sm">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground tracking-tight">
              AdsGenius <span className="text-gradient">AI</span>
            </span>
          </div>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Automatización de marketing con IA
          </p>
        </div>
      </header>

      <main className="container max-w-4xl py-10 space-y-10">
        {/* Hero */}
        <section className="text-center space-y-4 pb-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Potenciado con Inteligencia Artificial
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-tight">
            Transforma tus productos en{" "}
            <span className="text-gradient">campañas multicanal</span>
          </h1>
          <p className="mx-auto max-w-lg text-sm text-muted-foreground leading-relaxed sm:text-base">
            Conecta tu tienda Shopify, elige una estrategia y genera contenido
            optimizado para todos tus canales en segundos.
          </p>
        </section>

        {/* Progress bar */}
        <ProgressIndicator current={currentStep} />

        {/* Step 1 */}
        <StepSection
          number={1}
          title="Conecta tu tienda Shopify"
          subtitle="Pega el link de tu tienda para importar tus productos"
          isActive={currentStep >= 1}
          isComplete={products.length > 0}
        >
          <StoreUrlInput onProductsLoaded={setProducts} />
        </StepSection>

        {/* Step 2 */}
        {products.length > 0 && (
          <StepSection
            number={2}
            title="Selecciona productos"
            subtitle={`${selectedIndices.length} de ${products.length} seleccionados`}
            isActive={currentStep >= 2}
            isComplete={selectedIndices.length > 0}
          >
            <ProductGrid
              products={products}
              selectedIndices={selectedIndices}
              onToggle={handleToggleProduct}
            />
          </StepSection>
        )}

        {/* Step 3 */}
        {selectedIndices.length > 0 && (
          <StepSection
            number={3}
            title="Elige tu estrategia"
            subtitle="Define el enfoque de tu campaña"
            isActive={currentStep >= 3}
            isComplete={selectedPillar !== null}
          >
            <div className="space-y-6">
              <PillarSelector selected={selectedPillar} onSelect={setSelectedPillar} />
              
              {selectedIndices.length > 1 && (
                <div className="flex items-center space-x-3 rounded-lg border border-border/50 bg-secondary/20 p-4 transition-all hover:bg-secondary/30">
                  <Switch 
                    id="unified-mode" 
                    checked={isUnified}
                    onCheckedChange={setIsUnified}
                  />
                  <div className="space-y-0.5 cursor-pointer" onClick={() => setIsUnified(!isUnified)}>
                    <Label htmlFor="unified-mode" className="text-sm font-semibold cursor-pointer">
                      Unificar productos en una sola campaña
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Si lo activas, la IA tomará los {selectedIndices.length} productos seleccionados y creará textos que los mencionen a todos al mismo tiempo. Recomendado para armar "outfits" o catálogos rápidos.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </StepSection>
        )}

        {/* Generate button */}
        {canGenerate && !isLoading && results.length === 0 && (
          <div className="flex justify-center animate-fade-in pt-2">
            <Button
              variant="electric"
              size="lg"
              onClick={handleGenerate}
              className="gap-2.5 px-10 h-12 text-base font-semibold shadow-lg"
            >
              <Sparkles className="h-4.5 w-4.5" />
              Generar Contenido
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 4: Results */}
        {(results.length > 0 || isLoading) && (
          <StepSection
            number={4}
            title="Contenido generado"
            subtitle="Tu campaña multicanal lista para publicar"
            isActive
            isComplete={results.length > 0 && !isLoading}
          >
            <div className="space-y-6">
              <ResultsTabs results={results} isLoading={isLoading} pillar={selectedPillar} />
              
              {results.length > 0 && !isLoading && (
                <div className="flex justify-center pt-2">
                  <Button 
                    variant="outline" 
                    onClick={handleGenerate} 
                    className="gap-2.5 h-10 px-6 font-medium"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Regenerar Contenido
                  </Button>
                </div>
              )}
            </div>
          </StepSection>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 mt-16">
        <div className="container text-center text-xs text-muted-foreground">
          AdsGenius AI — Automatización de marketing inteligente
        </div>
      </footer>
    </div>
  );
}

/* ─── Progress Indicator ─── */
function ProgressIndicator({ current }: { current: number }) {
  const steps = [
    { n: 1, label: "Tienda" },
    { n: 2, label: "Productos" },
    { n: 3, label: "Estrategia" },
    { n: 4, label: "Generar" },
  ];

  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((step, i) => {
        const isComplete = current > step.n;
        const isActive = current === step.n;
        return (
          <div key={step.n} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                  isComplete
                    ? "gradient-electric text-primary-foreground shadow-sm"
                    : isActive
                    ? "border-2 border-primary bg-card text-primary shadow-sm"
                    : "border border-border bg-card text-muted-foreground"
                }`}
              >
                {isComplete ? "✓" : step.n}
              </div>
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive || isComplete ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`mx-3 mb-5 h-[2px] w-10 sm:w-16 rounded-full transition-colors duration-300 ${
                  current > step.n ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Step Section ─── */
function StepSection({
  number,
  title,
  subtitle,
  isActive,
  isComplete,
  children,
}: {
  number: number;
  title: string;
  subtitle: string;
  isActive: boolean;
  isComplete: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="animate-fade-in">
      <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-all duration-300 ${
              isComplete
                ? "gradient-electric text-primary-foreground shadow-sm"
                : isActive
                ? "border-2 border-primary bg-primary/5 text-primary"
                : "border border-border bg-muted text-muted-foreground"
            }`}
          >
            {isComplete ? "✓" : number}
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}
