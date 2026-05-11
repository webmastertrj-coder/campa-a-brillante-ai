import { supabase } from "@/integrations/supabase/client";
import type { ProductResults } from "./ai-client";
import type { Pillar } from "./content-generator";

export interface Folder {
  id: string;
  name: string;
  created_at: string;
}

export interface ProjectRow {
  id: string;
  folder_id: string | null;
  title: string;
  pillar: string | null;
  content: ProductResults[];
  created_at: string;
  updated_at: string;
}

export async function listFolders(): Promise<Folder[]> {
  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Folder[];
}

export async function createFolder(name: string): Promise<Folder> {
  const { data, error } = await supabase
    .from("folders")
    .insert({ name })
    .select()
    .single();
  if (error) throw error;
  return data as Folder;
}

export async function deleteFolder(id: string): Promise<void> {
  const { error } = await supabase.from("folders").delete().eq("id", id);
  if (error) throw error;
}

export async function listProjects(folderId?: string | null): Promise<ProjectRow[]> {
  let q = supabase.from("projects").select("*").order("updated_at", { ascending: false });
  if (folderId) q = q.eq("folder_id", folderId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as ProjectRow[];
}

export async function saveProject(input: {
  title: string;
  folder_id: string | null;
  pillar: Pillar | null;
  content: ProductResults[];
}): Promise<ProjectRow> {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      title: input.title,
      folder_id: input.folder_id,
      pillar: input.pillar,
      content: input.content as unknown as any,
    })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as ProjectRow;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}