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

export async function generateMode3Image(
  prompt: string,
  imageIndex: number,
  projectName: string,
  previousImageBase64?: string | null,
): Promise<{ imageUrl: string; imageBase64: string }> {
  const { data, error } = await supabase.functions.invoke('mode3-imagen', {
    body: { prompt, imageIndex, projectName, previousImageBase64: previousImageBase64 || undefined },
  });

  if (error) throw new Error(error.message || 'Failed to generate image');
  if (data?.error) throw new Error(data.error);

  return data as { imageUrl: string; imageBase64: string };
}

export async function generateMode3Video(
  prompt: string,
  videoIndex: number,
  projectName: string,
  startImageBase64: string,
  endImageBase64: string,
): Promise<{ operationName: string; generationMode: string }> {
  const { data, error } = await supabase.functions.invoke('veo-generate', {
    body: {
      prompt,
      startImageBase64,
      endImageBase64,
      projectName,
      pairIndex: videoIndex,
      model: 'veo-3.1-generate-preview',
      allowPromptOnlyFallback: false,
    },
  });

  if (error) throw new Error(error.message || 'Failed to start video generation');
  if (data?.error) throw new Error(data.error);

  if (data?.status === 'started' && data?.operationName) {
    return { operationName: data.operationName, generationMode: data.generationMode };
  }
  if (data?.status === 'complete' && data?.videoUrl) {
    return { operationName: '__COMPLETE__:' + data.videoUrl, generationMode: data.generationMode };
  }

  throw new Error('Unexpected video generation response');
}

export async function pollMode3Video(
  operationName: string,
  projectName: string,
  videoIndex: number,
): Promise<{ done: boolean; videoUrl?: string; error?: string }> {
  const { data, error } = await supabase.functions.invoke('veo-generate', {
    body: {
      mode: 'poll',
      operationName,
      projectName,
      pairIndex: videoIndex,
    },
  });

  if (error) throw new Error(error.message || 'Failed to poll video');
  if (data?.error) throw new Error(data.error);

  if (data?.status === 'complete' || data?.done === true) {
    return { done: true, videoUrl: data.videoUrl };
  }
  if (data?.status === 'error') {
    return { done: true, error: data.error };
  }

  return { done: false };
}
