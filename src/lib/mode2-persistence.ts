import { supabase } from '@/integrations/supabase/client';
import type { Mode2State } from '@/store/useMode2Store';
import type { Mode2WorkflowStep, Mode2Path, Mode2Source } from '@/types/mode';

export interface SavedMode2Project {
  id: string;
  name: string;
  quality_mode: string;
  current_step: number;
  classification: string | null;
  path: string | null;
  updated_at: string;
  created_at: string;
}

async function getAuthenticatedUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const userId = data.session?.user?.id;
  if (!userId) throw new Error('Not authenticated');
  return userId;
}

export async function loadMode2ProjectList(): Promise<SavedMode2Project[]> {

  const { data, error } = await supabase
    .from('mode2_projects')
    .select('id, name, quality_mode, current_step, classification, path, updated_at, created_at')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data || []) as SavedMode2Project[];
}

export async function loadMode2Project(id: string): Promise<Mode2State> {
  const { data, error } = await supabase
    .from('mode2_projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;

  const d = data as any;
  return {
    name: d.name,
    qualityMode: d.quality_mode,
    currentStep: d.current_step as Mode2WorkflowStep,
    customNotes: d.custom_notes || '',
    path: d.path as Mode2Path,
    source: d.source as Mode2Source,
    referenceImageBase64: '',
    referenceImageUrl: d.reference_image_url || '',
    selectedTemplateId: d.selected_template_id || null,
    classification: d.classification as 'interior' | 'exterior' | null,
    classifying: false,
    materialMapping: d.material_mapping || null,
    planSummary: d.plan_summary || '',
    planGenerating: false,
    scenes: Array.isArray(d.scenes) && d.scenes.length > 0
      ? d.scenes.map((s: any) => ({ ...s, generating: false }))
      : [],
    transitions: Array.isArray(d.transitions) && d.transitions.length > 0
      ? d.transitions.map((t: any) => ({ ...t, generating: false }))
      : [],
  };
}

export async function saveMode2Project(id: string | null, state: Mode2State): Promise<string> {
  const userId = await getAuthenticatedUserId();

  const payload = {
    user_id: userId,
    name: state.name,
    quality_mode: state.qualityMode,
    current_step: state.currentStep,
    custom_notes: state.customNotes,
    path: state.path,
    source: state.source,
    reference_image_url: state.referenceImageUrl,
    selected_template_id: state.selectedTemplateId,
    classification: state.classification,
    material_mapping: state.materialMapping as any,
    plan_summary: state.planSummary,
    scenes: state.scenes.map(({ imageBase64, generating, ...rest }) => ({ ...rest, generating: false })) as any,
    transitions: state.transitions.map(({ generating, ...rest }) => ({ ...rest, generating: false })) as any,
  };

  if (id) {
    const { error } = await supabase
      .from('mode2_projects')
      .update(payload)
      .eq('id', id);
    if (error) throw error;
    return id;
  } else {
    const { data, error } = await supabase
      .from('mode2_projects')
      .insert(payload)
      .select('id')
      .single();
    if (error) throw error;
    return (data as any).id;
  }
}

export async function deleteMode2Project(id: string): Promise<void> {
  const { error } = await supabase
    .from('mode2_projects')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
