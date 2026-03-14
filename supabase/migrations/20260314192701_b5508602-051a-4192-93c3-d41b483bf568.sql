
CREATE TABLE public.mode4_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  current_step integer NOT NULL DEFAULT 1,
  reference_image_url text DEFAULT NULL,
  image_slots jsonb DEFAULT '[]'::jsonb,
  video_slots jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.mode4_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mode4 projects" ON public.mode4_projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own mode4 projects" ON public.mode4_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mode4 projects" ON public.mode4_projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own mode4 projects" ON public.mode4_projects FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_mode4_projects_updated_at BEFORE UPDATE ON public.mode4_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
