
CREATE TABLE public.mode2_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  quality_mode TEXT NOT NULL DEFAULT 'balanced',
  current_step INTEGER NOT NULL DEFAULT 1,
  custom_notes TEXT DEFAULT '',
  path TEXT,
  source TEXT,
  reference_image_url TEXT DEFAULT '',
  selected_template_id TEXT,
  classification TEXT,
  material_mapping JSONB,
  plan_summary TEXT DEFAULT '',
  scenes JSONB DEFAULT '[]'::jsonb,
  transitions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mode2_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mode2 projects" ON public.mode2_projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own mode2 projects" ON public.mode2_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mode2 projects" ON public.mode2_projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own mode2 projects" ON public.mode2_projects FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_mode2_projects_updated_at
  BEFORE UPDATE ON public.mode2_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
