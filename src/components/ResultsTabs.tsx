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
import { marked } from "marked";

marked.setOptions({ breaks: true, gfm: true });

async function copyRichText(markdown: string) {
  const html = await marked.parse(markdown);
  const styledHtml = `<div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; font-size: 14px; line-height: 1.6; white-space: normal;">${html}</div>`;
  // Plain text fallback that preserves line breaks
  const plain = markdown;

  try {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      const item = new ClipboardItem({
        "text/html": new Blob([styledHtml], { type: "text/html" }),
        "text/plain": new Blob([plain], { type: "text/plain" }),
      });
      await navigator.clipboard.write([item]);
      return;
    }
  } catch {
    // fall through to legacy path
  }

  // Legacy fallback: use a contenteditable div + execCommand("copy")
  const container = document.createElement("div");
  container.contentEditable = "true";
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.innerHTML = styledHtml;
  document.body.appendChild(container);
  const range = document.createRange();
  range.selectNodeContents(container);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  try {
    document.execCommand("copy");
  } finally {
    selection?.removeAllRanges();
    document.body.removeChild(container);
  }
}

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

function ExportAllButton({ results, pillar }: { results: ProductResults[]; pillar: Pillar | null }) {
  const handleExport = () => {
    try {
      exportAllToPDF(results, pillar ?? "ventas");
      toast.success("PDF descargado correctamente");
    } catch {
      toast.error("No se pudo generar el PDF");
    }
  };

  const totalChannels = results.reduce((sum, r) => sum + r.channels.length, 0);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-border/40 bg-gradient-to-r from-primary/5 to-transparent p-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">Exporta tu campaña completa</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {results.length} producto{results.length !== 1 ? "s" : ""} · {totalChannels} pieza{totalChannels !== 1 ? "s" : ""} de contenido · Texto seleccionable
        </p>
      </div>
      <Button onClick={handleExport} variant="electric" size="sm" className="shrink-0">
        <FileDown className="h-4 w-4" />
        Descargar PDF completo
      </Button>
    </div>
  );
}

export function ResultsTabs({ results, isLoading, pillar }: ResultsTabsProps) {
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

  return (
    <div className="space-y-6">
      <ExportAllButton results={results} pillar={pillar} />
      <div className="space-y-8">
        {results.map((productResult, idx) => (
          <div key={idx} className="space-y-4">
            <ProductHeader product={productResult.product} />
            <ProductChannelResults
              channels={productResult.channels}
              product={productResult.product}
              pillar={pillar}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
