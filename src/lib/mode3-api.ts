import { supabase } from '@/integrations/supabase/client';
import type { Mode3RoomType } from '@/store/useMode3Store';

export interface Mode3GeneratedPrompts {
  imagePrompts: { index: number; stage: string; prompt: string }[];
  videoPrompts: { index: number; stage: string; prompt: string }[];
}

export async function generateMode3Prompts(roomType: Mode3RoomType): Promise<Mode3GeneratedPrompts> {
  const { data, error } = await supabase.functions.invoke('mode3-generate', {
    body: { roomType },
  });

  if (error) throw new Error(error.message || 'Failed to generate prompts');
  if (data?.error) throw new Error(data.error);

  return data as Mode3GeneratedPrompts;
}
