import { useState } from "react";
import { Code2, Copy, Check, ChevronDown, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";

const SCRIPT_URL = `${window.location.origin}/shopify-tracker.js`;

const PIXEL_SNIPPET = `// Pega esto en: Shopify Admin → Configuración → Eventos del cliente → Añadir píxel personalizado
(async () => {
  const res = await fetch("${SCRIPT_URL}");
  const code = await res.text();
  new Function(code)();
})();`;

const THEME_SNIPPET = `<!-- Pega esto en theme.liquid antes de </body> -->
<script src="${SCRIPT_URL}" defer></script>`;

export function TrackerInstructions() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (label: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success("Código copiado");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 text-left">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Code2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                Activa el tracking de tus productos
              </p>
              <p className="text-xs text-muted-foreground">
                Instala el script en Shopify para ver vistas, carritos y compras de los últimos 7 días
              </p>
            </div>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-4 pt-2">
          <div className="flex gap-2 rounded-lg bg-primary/5 border border-primary/10 p-3">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Una vez instalado, los datos empezarán a llegar automáticamente. Vuelve a importar tu tienda en unos días para ver las métricas reflejadas en cada producto.
            </p>
          </div>

          <SnippetBlock
            title="Opción 1 — Custom Pixel (recomendado)"
            description="Sin tocar el código del tema. Configuración → Eventos del cliente → Añadir píxel personalizado."
            code={PIXEL_SNIPPET}
            copied={copied === "pixel"}
            onCopy={() => copy("pixel", PIXEL_SNIPPET)}
          />

          <SnippetBlock
            title="Opción 2 — Theme.liquid"
            description="Edita tu tema y pega el script antes del cierre de </body>."
            code={THEME_SNIPPET}
            copied={copied === "theme"}
            onCopy={() => copy("theme", THEME_SNIPPET)}
          />
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function SnippetBlock({
  title,
  description,
  code,
  copied,
  onCopy,
}: {
  title: string;
  description: string;
  code: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
      <div className="relative group">
        <pre className="overflow-x-auto rounded-lg bg-foreground/[0.04] border border-border/50 p-3 text-[11px] font-mono leading-relaxed text-foreground/80">
          {code}
        </pre>
        <Button
          variant="outline"
          size="sm"
          onClick={onCopy}
          className="absolute top-2 right-2 h-7 gap-1 px-2 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
    </div>
  );
}
