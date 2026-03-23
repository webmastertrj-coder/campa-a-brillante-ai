import { useCallback, useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import { parseShopifyFile, type ShopifyProduct } from "@/lib/shopify-parser";

interface FileUploaderProps {
  onProductsLoaded: (products: ShopifyProduct[]) => void;
}

export function FileUploader({ onProductsLoaded }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(
    (file: File) => {
      setError(null);
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext !== "csv" && ext !== "json") {
        setError("Solo se aceptan archivos CSV o JSON de Shopify");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const products = parseShopifyFile(text, file.name);
        if (products.length === 0) {
          setError("No se encontraron productos válidos en el archivo");
          return;
        }
        setFileName(file.name);
        onProductsLoaded(products);
      };
      reader.readAsText(file);
    },
    [onProductsLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleClear = () => {
    setFileName(null);
    setError(null);
    onProductsLoaded([]);
  };

  if (fileName) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
        <FileText className="h-5 w-5 text-primary" />
        <span className="text-sm font-medium text-foreground">{fileName}</span>
        <button onClick={handleClear} className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <label
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-all duration-300 ${
          isDragging
            ? "border-primary bg-primary/5 glow-electric"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        }`}
      >
        <Upload className={`mb-3 h-10 w-10 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
        <p className="text-sm font-medium text-foreground">
          Arrastra tu archivo aquí o <span className="text-primary underline">selecciónalo</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          CSV o JSON exportado de Shopify
        </p>
        <input
          type="file"
          accept=".csv,.json"
          onChange={handleChange}
          className="hidden"
        />
      </label>
      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
