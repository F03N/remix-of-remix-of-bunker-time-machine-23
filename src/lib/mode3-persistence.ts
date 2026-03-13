import { supabase } from '@/integrations/supabase/client';
import type { Mode3State, Mode3RoomType, Mode3Step } from '@/store/useMode3Store';

export interface SavedMode3Project {
  id: string;
  name: string;
  current_step: number;
  selected_room: string | null;
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

export async function loadMode3ProjectList(): Promise<SavedMode3Project[]> {
  const { data, error } = await supabase
    .from('mode3_projects' as any)
    .select('id, name, current_step, selected_room, updated_at, created_at')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data || []) as any as SavedMode3Project[];
}

export async function loadMode3Project(id: string): Promise<Mode3State> {
  const { data, error } = await supabase
    .from('mode3_projects' as any)
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;

  const d = data as any;
  return {
    projectId: id,
    name: d.name,
    currentStep: d.current_step as Mode3Step,
    selectedRoom: d.selected_room as Mode3RoomType | null,
    promptsGenerating: false,
    promptsGenerated: d.prompts_generated ?? false,
    imageSlots: Array.isArray(d.image_slots) && d.image_slots.length > 0
      ? d.image_slots.map((s: any) => ({ ...s, generating: false, imageBase64: null }))
      : [],
    videoSlots: Array.isArray(d.video_slots) && d.video_slots.length > 0
      ? d.video_slots.map((v: any) => ({ ...v, generating: false }))
      : [],
  };
}

export async function saveMode3Project(id: string | null, state: Mode3State): Promise<string> {
  const basePayload = {
    name: state.name,
    current_step: state.currentStep,
    selected_room: state.selectedRoom,
    prompts_generated: state.promptsGenerated,
    image_slots: state.imageSlots.map(({ generating, imageBase64, ...rest }) => ({ ...rest, generating: false })) as any,
    video_slots: state.videoSlots.map(({ generating, ...rest }) => ({ ...rest, generating: false })) as any,
  };

  if (id) {
    const { error } = await supabase
      .from('mode3_projects' as any)
      .update(basePayload)
      .eq('id', id);
    if (error) throw error;
    return id;
  } else {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('mode3_projects' as any)
      .insert({ ...basePayload, user_id: userId })
      .select('id')
      .single();
    if (error) throw error;
    return (data as any).id;
  }
}

export async function deleteMode3Project(id: string): Promise<void> {
  const { error } = await supabase
    .from('mode3_projects' as any)
    .delete()
    .eq('id', id);
  if (error) throw error;
}
