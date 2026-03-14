import { supabase } from '@/integrations/supabase/client';
import type { Mode4ImageSlot, Mode4VideoSlot, Mode4WorkflowStep } from '@/types/mode4';

export interface SavedMode4Project {
  id: string;
  name: string;
  current_step: number;
  reference_image_url: string | null;
  updated_at: string;
  created_at: string;
}

export interface Mode4ProjectData {
  projectId: string;
  name: string;
  currentStep: Mode4WorkflowStep;
  referenceImageUrl: string | null;
  referenceImageBase64: string | null;
  imageSlots: Mode4ImageSlot[];
  videoSlots: Mode4VideoSlot[];
}

async function getAuthenticatedUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const userId = data.session?.user?.id;
  if (!userId) throw new Error('Not authenticated');
  return userId;
}

export async function loadMode4ProjectList(): Promise<SavedMode4Project[]> {
  const { data, error } = await supabase
    .from('mode4_projects' as any)
    .select('id, name, current_step, reference_image_url, updated_at, created_at')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data || []) as any as SavedMode4Project[];
}

export async function loadMode4Project(id: string): Promise<Mode4ProjectData> {
  const { data, error } = await supabase
    .from('mode4_projects' as any)
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;

  const d = data as any;
  return {
    projectId: id,
    name: d.name,
    currentStep: d.current_step as Mode4WorkflowStep,
    referenceImageUrl: d.reference_image_url || null,
    referenceImageBase64: null, // base64 is NOT stored in DB — too large
    imageSlots: Array.isArray(d.image_slots) && d.image_slots.length > 0
      ? d.image_slots.map((s: any) => ({ ...s, generating: false, imageBase64: undefined }))
      : Array.from({ length: 4 }, (_, i) => ({ index: i, title: `Image ${i + 1}`, prompt: '', approved: false, generating: false })),
    videoSlots: Array.isArray(d.video_slots) && d.video_slots.length > 0
      ? d.video_slots.map((v: any) => ({ ...v, generating: false }))
      : Array.from({ length: 4 }, (_, i) => ({ index: i, title: `Video ${i + 1}`, prompt: '', approved: false, generating: false })),
  };
}

export async function saveMode4Project(
  id: string | null,
  state: {
    name: string;
    currentStep: Mode4WorkflowStep;
    referenceImageUrl: string | null;
    imageSlots: Mode4ImageSlot[];
    videoSlots: Mode4VideoSlot[];
  },
): Promise<string> {
  // Strip large base64 data before saving to DB
  const basePayload = {
    name: state.name,
    current_step: state.currentStep,
    reference_image_url: state.referenceImageUrl,
    image_slots: state.imageSlots.map(({ generating, imageBase64, ...rest }) => ({ ...rest, generating: false })) as any,
    video_slots: state.videoSlots.map(({ generating, ...rest }) => ({ ...rest, generating: false })) as any,
  };

  if (id) {
    const { error } = await supabase
      .from('mode4_projects' as any)
      .update(basePayload)
      .eq('id', id);
    if (error) throw error;
    return id;
  } else {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('mode4_projects' as any)
      .insert({ ...basePayload, user_id: userId })
      .select('id')
      .single();
    if (error) throw error;
    return (data as any).id;
  }
}

export async function deleteMode4Project(id: string): Promise<void> {
  const { error } = await supabase
    .from('mode4_projects' as any)
    .delete()
    .eq('id', id);
  if (error) throw error;
}
