import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderPlus, Save } from "lucide-react";
import { toast } from "sonner";
import { createFolder, listFolders, saveProject, type Folder } from "@/lib/projects";
import type { ProductResults } from "@/lib/ai-client";
import type { Pillar } from "@/lib/content-generator";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: ProductResults[];
  pillar: Pillar | null;
  defaultTitle?: string;
  onSaved?: () => void;
}

export function SaveToProjectDialog({ open, onOpenChange, results, pillar, defaultTitle, onSaved }: Props) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderId, setFolderId] = useState<string>("none");
  const [title, setTitle] = useState("");
  const [newFolder, setNewFolder] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(defaultTitle ?? `Campaña ${new Date().toLocaleDateString("es-ES")}`);
    listFolders().then(setFolders).catch(() => toast.error("No se pudieron cargar las carpetas"));
  }, [open, defaultTitle]);

  const handleCreateFolder = async () => {
    const name = newFolder.trim();
    if (!name) return;
    setCreatingFolder(true);
    try {
      const f = await createFolder(name);
      setFolders((prev) => [f, ...prev]);
      setFolderId(f.id);
      setNewFolder("");
      toast.success("Carpeta creada");
    } catch {
      toast.error("No se pudo crear la carpeta");
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Pon un nombre al proyecto");
      return;
    }
    setSaving(true);
    try {
      await saveProject({
        title: title.trim(),
        folder_id: folderId === "none" ? null : folderId,
        pillar,
        content: results,
      });
      toast.success("Proyecto guardado");
      onSaved?.();
      onOpenChange(false);
    } catch {
      toast.error("No se pudo guardar el proyecto");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Guardar en proyectos</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="proj-title">Nombre del proyecto</Label>
            <Input id="proj-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Carpeta</Label>
            <Select value={folderId} onValueChange={setFolderId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin carpeta</SelectItem>
                {folders.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>O crea una carpeta nueva</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Nombre de la carpeta"
                value={newFolder}
                onChange={(e) => setNewFolder(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              />
              <Button type="button" variant="outline" onClick={handleCreateFolder} disabled={creatingFolder || !newFolder.trim()}>
                <FolderPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="electric" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}