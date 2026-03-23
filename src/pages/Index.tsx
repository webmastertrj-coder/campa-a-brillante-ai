import { useState, useCallback } from "react";
import { Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUploader } from "@/components/FileUploader";
import { ProductGrid } from "@/components/ProductGrid";
import { PillarSelector } from "@/components/PillarSelector";
import { ResultsTabs } from "@/components/ResultsTabs";
import type { ShopifyProduct } from "@/lib/shopify-parser";
import {
  type Pillar,
  type Channel,
  type GeneratedContent,
  ALL_CHANNELS,
  getChannelLabel,
  buildPrompt,
} from "@/lib/content-generator";

// Mock generation for now — will be replaced with AI edge function
function mockGenerate(product: ShopifyProduct, pillar: Pillar): GeneratedContent[] {
  const templates: Record<Channel, (p: ShopifyProduct, pil: Pillar) => string> = {
    tiktok: (p, pil) =>
      pil === "ventas"
        ? `🎬 HOOK (0-3s):\n"¿Sabías que ${p.title} está arrasando? Solo por $${p.price}"\n\n📱 CUERPO (3-12s):\n"Este producto tiene todo lo que necesitas. Calidad premium, diseño exclusivo y un precio que no vas a creer. ${p.description.slice(0, 80)}..."\n\n🔥 CTA (12-15s):\n"¡Corre al link en bio antes de que se agote! Envío gratis HOY"`
        : pil === "comunidad"
        ? `🎬 HOOK (0-3s):\n"3 formas de combinar ${p.title} que no conocías"\n\n📱 CUERPO (3-12s):\n"Tip 1: Úsalo con tonos neutros para un look elegante\nTip 2: Combínalo con accesorios dorados\nTip 3: Perfecto para ocasiones casuales y formales"\n\n💬 CTA (12-15s):\n"¿Cuál es tu combo favorito? Comenta 👇"`
        : `🎬 HOOK (0-3s):\n"Lo que nadie te cuenta sobre ${p.title}"\n\n📱 CUERPO (3-12s):\n"Descubrimos 5 razones por las que este producto se convirtió en el más vendido del mes. La razón #3 te va a sorprender..."\n\n🔗 CTA (12-15s):\n"Link en bio para ver la historia completa"`,
    instagram: (p, pil) =>
      pil === "ventas"
        ? `🔥 ¡OFERTA FLASH! 🔥\n\n${p.title} a solo $${p.price} 💰\n\n✅ Calidad premium\n✅ Envío gratis\n✅ Stock limitado\n\n¡No te lo pierdas! Link en bio 🛒\n\n#moda #oferta #tendencia #estilo #fashion #compraonline #tiendaonline #descuento #outfit #lookdeldia`
        : pil === "comunidad"
        ? `✨ ¿Conoces la historia detrás de ${p.title}? ✨\n\n${p.description.slice(0, 120)}...\n\nCada pieza cuenta una historia. ¿Tú qué opinas? ¿Lo combinarías con algo casual o elegante? 💭\n\n#estilo #moda #tendencia #inspiración #ootd #fashion #comunidad #opinión`
        : `📊 5 datos que no sabías sobre ${p.title}\n\n1️⃣ Es uno de los más buscados este mes\n2️⃣ Combina con todo tu guardarropa\n3️⃣ El secreto está en los detalles...\n\n¿Quieres saber los otros 2? 👀\n➡️ Link en bio\n\n#curiosidades #moda #tendencia #datos`,
    email: (p, pil) =>
      pil === "ventas"
        ? `📧 ASUNTO: 🔥 ¡Solo HOY! ${p.title} con ENVÍO GRATIS 🚀\n\nPRE-HEADER: Stock limitado - No te quedes sin el tuyo\n\n---\n\nHola,\n\n¿Buscabas algo especial? Lo encontramos por ti.\n\n🛍️ ${p.title} — $${p.price}\n\n• Calidad premium garantizada\n• Envío gratis por tiempo limitado\n• Devolución sin costo\n\n[COMPRAR AHORA →]\n\n⏰ Esta oferta expira en 24 horas`
        : pil === "comunidad"
        ? `📧 ASUNTO: ✨ Las tendencias que están marcando este mes\n\nPRE-HEADER: Descubre cómo los expertos combinan ${p.title}\n\n---\n\nHola,\n\nEsta semana queremos compartirte algo especial.\n\n${p.title} se ha convertido en el favorito de nuestra comunidad. ¿La razón?\n\n• Versátil para cualquier ocasión\n• Diseño que no pasa de moda\n• Aprobado por nuestros estilistas\n\n¿Quieres ver cómo lo combinan? [VER LOOKS →]`
        : `📧 ASUNTO: 🤔 ¿Por qué todo el mundo habla de ${p.title}?\n\nPRE-HEADER: Hay 5 razones — la #3 te sorprenderá\n\n---\n\nHola,\n\nAlgo está pasando con ${p.title} y teníamos que contártelo.\n\nEn las últimas semanas:\n\n📈 +300% de búsquedas\n⭐ 4.9/5 en reseñas\n🏆 Top 1 en su categoría\n\n¿Quieres saber por qué? [DESCÚBRELO AQUÍ →]`,
    meta: (p, pil) =>
      pil === "ventas"
        ? `📝 TEXTO PRINCIPAL:\n"${p.title} por solo $${p.price}. Envío gratis hoy. Stock limitado."\n\n📌 TÍTULO:\n"${p.title.slice(0, 35)} - Oferta"\n\n🔗 DESCRIPCIÓN DEL ENLACE:\n"Compra ahora con envío gratis"\n\n🎯 CTA: Comprar ahora`
        : pil === "comunidad"
        ? `📝 TEXTO PRINCIPAL:\n"¿Ya conoces la tendencia que está arrasando? ${p.title} es el favorito de nuestra comunidad."\n\n📌 TÍTULO:\n"Tendencia: ${p.title.slice(0, 25)}"\n\n🔗 DESCRIPCIÓN DEL ENLACE:\n"Únete a la conversación"\n\n🎯 CTA: Más información`
        : `📝 TEXTO PRINCIPAL:\n"5 razones por las que ${p.title} es el producto del momento. ¿Las conoces todas?"\n\n📌 TÍTULO:\n"${p.title.slice(0, 30)} — Descubre"\n\n🔗 DESCRIPCIÓN DEL ENLACE:\n"Lee el artículo completo"\n\n🎯 CTA: Más información`,
    google: (p, pil) =>
      pil === "ventas"
        ? `📊 TÍTULOS (máx 30 caracteres):\n1. "${p.title.slice(0, 22)} - Oferta"\n2. "Compra ${p.title.slice(0, 18)} Hoy"\n3. "${p.title.slice(0, 17)} Envío Gratis"\n\n📝 DESCRIPCIONES (máx 90 caracteres):\n1. "Descubre ${p.title} a solo $${p.price}. Envío gratis y devolución sin costo. ¡Compra ya!"\n2. "Oferta exclusiva en ${p.title}. Calidad premium al mejor precio. Stock limitado."`
        : pil === "comunidad"
        ? `📊 TÍTULOS (máx 30 caracteres):\n1. "Tendencia: ${p.title.slice(0, 16)}"\n2. "Descubre ${p.title.slice(0, 18)}"\n3. "Estilo ${p.title.slice(0, 20)}"\n\n📝 DESCRIPCIONES (máx 90 caracteres):\n1. "Únete a miles que ya descubrieron ${p.title}. Inspírate con los mejores looks."\n2. "La tendencia del momento: ${p.title}. Descubre cómo combinarlo."`
        : `📊 TÍTULOS (máx 30 caracteres):\n1. "5 Datos de ${p.title.slice(0, 16)}"\n2. "Secretos ${p.title.slice(0, 19)}"\n3. "Lo Nuevo: ${p.title.slice(0, 17)}"\n\n📝 DESCRIPCIONES (máx 90 caracteres):\n1. "¿Sabías esto sobre ${p.title}? 5 datos sorprendentes que necesitas conocer."\n2. "Descubre por qué ${p.title} se ha convertido en el más buscado del mes."`,
  };

  return ALL_CHANNELS.map((ch) => ({
    channel: ch,
    label: getChannelLabel(ch),
    content: templates[ch](product, pillar),
  }));
}

export default function Index() {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [selectedPillar, setSelectedPillar] = useState<Pillar | null>(null);
  const [results, setResults] = useState<GeneratedContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = useCallback(() => {
    if (selectedProduct === null || !selectedPillar) return;
    setIsLoading(true);
    // Simulate AI delay
    setTimeout(() => {
      const content = mockGenerate(products[selectedProduct], selectedPillar);
      setResults(content);
      setIsLoading(false);
    }, 1500);
  }, [selectedProduct, selectedPillar, products]);

  const canGenerate = selectedProduct !== null && selectedPillar !== null;

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

        {/* Step 2: Select product */}
        {products.length > 0 && (
          <section className="space-y-3 animate-fade-in">
            <StepHeader
              number={2}
              title={`Selecciona un producto (${products.length} encontrados)`}
            />
            <ProductGrid
              products={products}
              selectedIndex={selectedProduct}
              onSelect={setSelectedProduct}
            />
          </section>
        )}

        {/* Step 3: Select pillar */}
        {selectedProduct !== null && (
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
              Generar Contenido
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
