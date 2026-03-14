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
