import { supabase } from '@/integrations/supabase/client';

export interface Mode4GeneratedPrompts {
  imagePrompts: { index: number; title: string; prompt: string }[];
  videoPrompts: { index: number; title: string; prompt: string }[];
}

export async function generateMode4Prompts(referenceImageBase64: string): Promise<Mode4GeneratedPrompts> {
  const { data, error } = await supabase.functions.invoke('mode4-generate', {
    body: { referenceImageBase64 },
  });

  if (error) {
    const msg = error.message || '';
    if (msg.includes('429') || msg.includes('quota') || msg.includes('RATE_LIMITED')) {
      throw new Error('API quota exceeded — wait a few minutes then retry.');
    }
    throw new Error(msg || 'Failed to generate prompts');
  }
  if (data?.error) {
    if (data.errorCode === 'RATE_LIMITED' || data.error.includes('quota')) {
      throw new Error('API quota exceeded — wait a few minutes then retry.');
    }
    if (data.errorCode === 'PAYMENT_REQUIRED') {
      throw new Error('Payment required — please add credits to continue.');
    }
    throw new Error(data.error);
  }

  return data as Mode4GeneratedPrompts;
}

export interface Mode4ImageResult {
  imageUrl: string;
  imageBase64: string;
}

export async function generateMode4Image(
  prompt: string,
  imageIndex: number,
  projectName: string,
  sourceImageBase64: string,
): Promise<Mode4ImageResult> {
  const { data, error } = await supabase.functions.invoke('mode4-imagen', {
    body: { prompt, imageIndex, projectName, sourceImageBase64 },
  });

  if (error) {
    const msg = error.message || '';
    if (msg.includes('429') || msg.includes('quota') || msg.includes('RATE_LIMITED')) {
      throw new Error('API quota exceeded — wait a few minutes then retry.');
    }
    throw new Error(msg || 'Failed to generate image');
  }
  if (data?.error) {
    if (data.errorCode === 'RATE_LIMITED' || data.error.includes('quota')) {
      throw new Error('API quota exceeded — wait a few minutes then retry.');
    }
    if (data.errorCode === 'PAYMENT_REQUIRED') {
      throw new Error('Payment required — please add credits to continue.');
    }
    throw new Error(data.error);
  }

  return data as Mode4ImageResult;
}

/* ─── Video generation ─── */

export interface Mode4VideoResult {
  videoUrl: string;
  storagePath?: string;
  operationName?: string;
  status: 'started' | 'complete' | 'polling' | 'error';
  generationMode?: string;
}

export async function generateMode4Video(
  prompt: string,
  videoIndex: number,
  projectName: string,
  startImageBase64: string,
  endImageBase64?: string,
): Promise<Mode4VideoResult> {
  const { data, error } = await supabase.functions.invoke('veo-generate', {
    body: {
      prompt,
      startImageBase64,
      endImageBase64: endImageBase64 || undefined,
      projectName,
      pairIndex: videoIndex,
      durationSeconds: 8,
      allowPromptOnlyFallback: false,
    },
  });

  if (error) {
    const msg = error.message || '';
    if (msg.includes('429') || msg.includes('quota') || msg.includes('RATE_LIMITED')) {
      throw new Error('API quota exceeded — wait a few minutes then retry.');
    }
    throw new Error(msg || 'Failed to start video generation');
  }
  if (data?.error) {
    if (data.errorCode === 'RATE_LIMITED') throw new Error('API quota exceeded — wait a few minutes then retry.');
    if (data.errorCode === 'PAYMENT_REQUIRED') throw new Error('Payment required — please add credits to continue.');
    throw new Error(data.error);
  }

  return data as Mode4VideoResult;
}

export async function pollMode4Video(
  operationName: string,
  projectName: string,
  videoIndex: number,
): Promise<Mode4VideoResult> {
  const { data, error } = await supabase.functions.invoke('veo-generate', {
    body: {
      mode: 'poll',
      operationName,
      projectName,
      pairIndex: videoIndex,
    },
  });

  if (error) throw new Error(error.message || 'Poll failed');
  if (data?.error) throw new Error(data.error);

  return {
    videoUrl: data.videoUrl || '',
    storagePath: data.storagePath,
    status: data.done ? 'complete' : 'polling',
    generationMode: data.generationMode,
  };
}
