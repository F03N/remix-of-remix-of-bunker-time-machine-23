
CREATE TABLE public.mode3_projects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  current_step integer NOT NULL DEFAULT 1,
  selected_room text,
  prompts_generated boolean NOT NULL DEFAULT false,
  image_slots jsonb DEFAULT '[]'::jsonb,
  video_slots jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.mode3_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mode3 projects" ON public.mode3_projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own mode3 projects" ON public.mode3_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mode3 projects" ON public.mode3_projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own mode3 projects" ON public.mode3_projects FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_mode3_projects_updated_at
  BEFORE UPDATE ON public.mode3_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
