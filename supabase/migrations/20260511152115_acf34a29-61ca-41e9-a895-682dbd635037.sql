
CREATE TABLE public.folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view folders" ON public.folders FOR SELECT USING (true);
CREATE POLICY "Public can insert folders" ON public.folders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update folders" ON public.folders FOR UPDATE USING (true);
CREATE POLICY "Public can delete folders" ON public.folders FOR DELETE USING (true);

CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  pillar TEXT,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Public can insert projects" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update projects" ON public.projects FOR UPDATE USING (true);
CREATE POLICY "Public can delete projects" ON public.projects FOR DELETE USING (true);

CREATE INDEX idx_projects_folder ON public.projects(folder_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
