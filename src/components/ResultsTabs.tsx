import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Sparkles, FileDown } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import type { GeneratedContent, Pillar } from "@/lib/content-generator";
import type { ProductResults } from "@/lib/ai-client";
import type { ShopifyProduct } from "@/lib/shopify-parser";
import { exportAllToPDF, exportChannelToPDF } from "@/lib/pdf-exporter";

interface ResultsTabsProps {
  results: ProductResults[];
  isLoading: boolean;
  pillar: Pillar | null;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground hover:shadow-sm"
    >
      {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
      {copied ? "¡Copiado!" : "Copiar"}
    </button>
  );
}

function ProductHeader({ product }: { product: ShopifyProduct }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border/40 bg-muted/30 p-4">
      {product.imageUrl && (
        <img
          src={product.imageUrl}
          alt={product.title}
          className="h-14 w-14 rounded-lg object-cover shadow-sm"
        />
      )}
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-base font-semibold text-foreground truncate">{product.title}</h3>
        <p className="text-sm font-semibold text-primary">${product.price}</p>
      </div>
    </div>
  );
}

function ProductChannelResults({
  channels,
  product,
  pillar,
}: {
  channels: GeneratedContent[];
  product: ShopifyProduct;
  pillar: Pillar | null;
}) {
  if (channels.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        No se pudo generar contenido para este producto.
      </p>
    );
  }

  const handleChannelPdf = (ch: GeneratedContent) => {
    try {
      exportChannelToPDF(product, ch, pillar ?? "ventas");
      toast.success(`PDF de ${ch.label} descargado`);
    } catch {
      toast.error("No se pudo generar el PDF");
    }
  };

  return (
    <Tabs defaultValue={channels[0]?.channel} className="w-full">
      <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/40 p-1 rounded-xl">
        {channels.map((r) => (
          <TabsTrigger
            key={r.channel}
            value={r.channel}
            className="text-xs rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
          >
            {r.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {channels.map((r) => (
        <TabsContent key={r.channel} value={r.channel}>
          <Card className="border-border/40 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 gap-2">
              <CardTitle className="text-base font-display">{r.label}</CardTitle>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleChannelPdf(r)}
                  className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground hover:shadow-sm"
                >
                  <FileDown className="h-3 w-3" />
                  PDF
                </button>
                <CopyButton text={r.content} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none rounded-xl bg-muted/30 p-5 leading-relaxed text-foreground">
                <ReactMarkdown>{r.content}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
}

export function ResultsTabs({ results, isLoading }: ResultsTabsProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-5">
        <div className="relative">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-primary animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Generando contenido con IA...</p>
          <p className="text-xs text-muted-foreground mt-1">Esto puede tomar unos segundos por canal</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) return null;

  if (results.length === 1) {
    return (
      <div className="space-y-4">
        <ProductHeader product={results[0].product} />
        <ProductChannelResults channels={results[0].channels} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {results.map((productResult, idx) => (
        <div key={idx} className="space-y-4">
          <ProductHeader product={productResult.product} />
          <ProductChannelResults channels={productResult.channels} />
        </div>
      ))}
    </div>
  );
}
