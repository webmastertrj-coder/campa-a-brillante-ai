import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder as FolderIcon, FolderPlus, Trash2, FileText, ArrowLeft, Eye, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  createFolder,
  deleteFolder,
  deleteProject,
  listFolders,
  listProjects,
  type Folder,
  type ProjectRow,
} from "@/lib/projects";
import type { ProductResults } from "@/lib/ai-client";
import type { Pillar } from "@/lib/content-generator";
import { ResultsTabs } from "./ResultsTabs";

interface Props {
  trigger: React.ReactNode;
}

export function ProjectsManager({ trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [activeFolder, setActiveFolder] = useState<Folder | null>(null);
  const [viewing, setViewing] = useState<ProjectRow | null>(null);
  const [newFolder, setNewFolder] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const [f, p] = await Promise.all([
        listFolders(),
        listProjects(activeFolder?.id ?? undefined),
      ]);
      setFolders(f);
      setProjects(p);
    } catch (e) {
      console.error("ProjectsManager refresh error", e);
      toast.error("No se pudieron cargar los proyectos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeFolder?.id]);

  const handleCreateFolder = async () => {
    const name = newFolder.trim();
    if (!name) return;
    try {
      await createFolder(name);
      setNewFolder("");
      toast.success("Carpeta creada");
      refresh();
    } catch {
      toast.error("No se pudo crear la carpeta");
    }
  };

  const handleDeleteFolder = async (f: Folder) => {
    if (!confirm(`¿Eliminar la carpeta "${f.name}"? Los proyectos quedarán sin carpeta.`)) return;
    try {
      await deleteFolder(f.id);
      toast.success("Carpeta eliminada");
      refresh();
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  const handleDeleteProject = async (p: ProjectRow) => {
    if (!confirm(`¿Eliminar el proyecto "${p.title}"?`)) return;
    try {
      await deleteProject(p.id);
      toast.success("Proyecto eliminado");
      refresh();
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  const folderName = activeFolder?.name ?? "Todos los proyectos";

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setViewing(null); setActiveFolder(null); } }}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="font-display">
              {viewing ? viewing.title : "Mis proyectos"}
            </SheetTitle>
            {!viewing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={refresh}
                disabled={loading}
                className="gap-1.5"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
            )}
          </div>
        </SheetHeader>

        {viewing ? (
          <div className="mt-6 space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setViewing(null)} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Volver
            </Button>
            <ResultsTabs
              results={viewing.content as ProductResults[]}
              isLoading={false}
              pillar={(viewing.pillar as Pillar | null) ?? null}
            />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Crear carpeta */}
            <div className="flex gap-2">
              <Input
                placeholder="Nueva carpeta..."
                value={newFolder}
                onChange={(e) => setNewFolder(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              />
              <Button onClick={handleCreateFolder} disabled={!newFolder.trim()} variant="outline">
                <FolderPlus className="h-4 w-4" /> Crear
              </Button>
            </div>

            {/* Carpetas */}
            <div>
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Carpetas</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActiveFolder(null)}
                  className={`flex items-center justify-between rounded-lg border p-3 text-sm transition-all hover:bg-muted ${
                    activeFolder === null ? "border-primary bg-primary/5" : "border-border/60"
                  }`}
                >
                  <span className="flex items-center gap-2"><FolderIcon className="h-4 w-4" /> Todos</span>
                </button>
                {folders.map((f) => (
                  <div
                    key={f.id}
                    className={`flex items-center justify-between rounded-lg border p-3 text-sm transition-all hover:bg-muted ${
                      activeFolder?.id === f.id ? "border-primary bg-primary/5" : "border-border/60"
                    }`}
                  >
                    <button onClick={() => setActiveFolder(f)} className="flex flex-1 items-center gap-2 text-left truncate">
                      <FolderIcon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{f.name}</span>
                    </button>
                    <button onClick={() => handleDeleteFolder(f)} className="text-muted-foreground hover:text-destructive ml-2">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Proyectos */}
            <div>
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Proyectos en {folderName}
              </h3>
              {loading ? (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              ) : projects.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center border border-dashed rounded-lg">
                  No hay proyectos guardados aún.
                </p>
              ) : (
                <div className="space-y-2">
                  {projects.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border/60 p-3 hover:bg-muted/50">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{p.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.pillar ? `${p.pillar} · ` : ""}{new Date(p.created_at).toLocaleDateString("es-ES")}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => setViewing(p)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteProject(p)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}