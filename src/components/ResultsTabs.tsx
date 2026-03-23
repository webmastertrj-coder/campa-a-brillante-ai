import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import type { GeneratedContent } from "@/lib/content-generator";

interface ResultsTabsProps {
  results: GeneratedContent[];
  isLoading: boolean;
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
      className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}

export function ResultsTabs({ results, isLoading }: ResultsTabsProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Generando contenido con IA...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Selecciona un producto y un pilar estratégico para generar contenido
        </p>
      </div>
    );
  }

  return (
    <Tabs defaultValue={results[0]?.channel} className="w-full">
      <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1">
        {results.map((r) => (
          <TabsTrigger
            key={r.channel}
            value={r.channel}
            className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            {r.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {results.map((r) => (
        <TabsContent key={r.channel} value={r.channel}>
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-display">{r.label}</CardTitle>
              <CopyButton text={r.content} />
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap rounded-lg bg-muted/50 p-4 text-sm leading-relaxed text-foreground">
                {r.content}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
}
