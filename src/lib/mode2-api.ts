import { supabase } from '@/integrations/supabase/client';
import type { Mode2MaterialMapping } from '@/types/mode';

interface ClassifyResult {
  classification: 'interior' | 'exterior';
  materialMapping: Mode2MaterialMapping;
}

interface PlanResult {
  summary: string;
  imagePrompts: string[];
  videoPrompts: string[];
}

interface Mode2ImageResult {
  imageUrl: string;
  imageBase64: string;
  storagePath?: string;
}

interface Mode2VideoResult {
  videoUrl: string;
  videoUrl2?: string;
  midpointImageUrl?: string;
  midpointImageBase64?: string;
  status: 'complete';
  operationName?: string;
  generationMode?: string;
}

export async function classifyImage(imageBase64: string): Promise<ClassifyResult> {
  const { data, error } = await supabase.functions.invoke('mode2-generate', {
    body: { action: 'classify', imageBase64 },
  });

  if (error) throw new Error(`Classification error: ${error.message}`);
  if (data?.error) throw new Error(data.error);

  return {
    classification: data.classification,
    materialMapping: data.materialMapping,
  };
}

export async function generateMode2Plan(
  imageBase64: string,
  classification: string,
  materialMapping: Mode2MaterialMapping | null,
  customNotes: string,
): Promise<PlanResult> {
  const { data, error } = await supabase.functions.invoke('mode2-generate', {
    body: { action: 'plan', imageBase64, classification, materialMapping, customNotes },
  });

  if (error) throw new Error(`Plan generation error: ${error.message}`);
  if (data?.error) throw new Error(data.error);

  return {
    summary: data.summary,
    imagePrompts: data.imagePrompts,
    videoPrompts: data.videoPrompts,
  };
}

export async function generateMode2Image(
  prompt: string,
  sceneIndex: number,
  projectName: string,
  referenceImageBase64?: string,
  previousImageBase64?: string,
): Promise<Mode2ImageResult> {
  const { data, error } = await supabase.functions.invoke('mode2-imagen', {
    body: { prompt, sceneIndex, projectName, referenceImageBase64, previousImageBase64 },
  });

  if (error) throw new Error(`Image generation error: ${error.message}`);
  if (data?.error) throw new Error(data.error);

  const imageUrl = data.imageUrl || (data.imageBase64 ? `data:image/png;base64,${data.imageBase64}` : '');
  if (!imageUrl && !data.imageBase64) throw new Error('No image returned');

  return {
    imageUrl,
    imageBase64: data.imageBase64,
    storagePath: data.storagePath,
  };
}

async function generateMidpointImage(
  startImageBase64: string,
  endImageBase64: string,
  transitionIndex: number,
  projectName: string,
  motionPrompt: string,
): Promise<Mode2ImageResult> {
  const { data, error } = await supabase.functions.invoke('mode2-imagen', {
    body: {
      action: 'midpoint',
      startImageBase64,
      endImageBase64,
      transitionIndex,
      projectName,
      motionPrompt,
    },
  });

  if (error) throw new Error(`Midpoint image error: ${error.message}`);
  if (data?.error) throw new Error(data.error);

  return {
    imageUrl: data.imageUrl,
    imageBase64: data.imageBase64,
    storagePath: data.storagePath,
  };
}

async function generateSingleVeoVideo(
  prompt: string,
  pairIndex: number,
  projectName: string,
  startImageBase64: string,
  endImageBase64: string | undefined,
  durationSeconds: number,
  subIndex?: string,
) {
  // Transition 4 (pairIndex 3) = real-time, all others = timelapse
  const isRealTime = pairIndex === 3;

  const speedPrefix = isRealTime
    ? [
        'CRITICAL MOTION RULES: This transition must play at natural REAL-TIME (1×) speed.',
        'Workers move at normal human speed. Tools operate at realistic construction pace.',
        'Do NOT accelerate motion. Do NOT fast-forward. Do NOT compress time.',
        'Camera must stay completely locked: no pan, no tilt, no zoom, no drift, no shake.',
        'All structural changes must occur progressively through visible worker activity.',
        'Ambient construction sounds only. No music. No dialogue. No narration.',
      ].join(' ')
    : [
        'CRITICAL MOTION RULES: This transition must appear as TIMELAPSE construction.',
        'Workers move faster than real time while maintaining believable motion.',
        'Camera must stay completely locked: no pan, no tilt, no zoom, no drift, no shake.',
        'Construction progress is accelerated but physically realistic — no magical transformations.',
        'All structural changes must occur progressively through visible worker activity.',
        'Ambient construction sounds only. No music. No dialogue. No narration.',
      ].join(' ');

  const realisticRules = [
    'REALISTIC CONSTRUCTION RULES: All visible renovation changes must be caused by workers performing physical tasks.',
    'Objects must NEVER repair themselves. Walls must not magically rebuild. Floors must not transform automatically.',
    'Windows must not appear suddenly. Doors must not materialize. Debris must not disappear instantly.',
    'Every change must be shown as a physical action performed by workers using tools.',
    'Workers must carry tools, move materials, install components, remove debris, and repair structures step by step.',
    'No magical transformation. No automatic repair. No instant reconstruction. No physics-breaking changes.',
  ].join(' ');

  const workerRules = pairIndex === 6
    ? 'WORKER RULES: Workers may be minimal, subtle, or distant in this final transition as the renovation reaches completion. If present, a man in yellow work clothing and a woman in black work clothing perform final touches.'
    : [
        'MANDATORY WORKER RULES: Two workers MUST be clearly visible performing the actual renovation work throughout this entire video.',
        'Worker 1: A man wearing yellow work clothing. Worker 2: A woman wearing black work clothing.',
        'They must use real professional tools and techniques appropriate to the task (plastering, painting, tiling, carpentry, epoxy flooring, window installation, etc.).',
        'NO structural change may happen without workers physically causing it.',
        'Every visible renovation progress must be directly attributed to the workers\' physical labor.',
        'If the workers are not shown doing the work, the change must NOT happen. This is non-negotiable.',
      ].join(' ');

  const hardenedPrompt = `${speedPrefix}\n\n${realisticRules}\n\n${workerRules}\n\n${prompt}`;

  const storagePairIndex = subIndex ? `${pairIndex}_${subIndex}` : pairIndex;

  const { data, error } = await supabase.functions.invoke('veo-generate', {
    body: {
      prompt: hardenedPrompt,
      model: 'veo-3.1-generate-preview',
      startImageBase64,
      endImageBase64,
      projectName: `mode2/${projectName}`,
      pairIndex: storagePairIndex,
      durationSeconds,
      allowPromptOnlyFallback: false,
    },
  });

  if (error) throw new Error(`Video generation error: ${error.message}`);
  if (data?.error) throw new Error(data.error);

  if (data.videoUrl) {
    return {
      videoUrl: data.videoUrl,
      status: 'complete' as const,
      operationName: data.operationName,
      storagePath: data.storagePath,
      generationMode: data.generationMode,
    };
  }

  if (data.operationName && data.status === 'started') {
    const maxPolls = 120;
    const pollInterval = 5000;

    for (let i = 0; i < maxPolls; i++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const { data: pollData, error: pollError } = await supabase.functions.invoke('veo-generate', {
        body: {
          mode: 'poll',
          operationName: data.operationName,
          projectName: `mode2/${projectName}`,
          pairIndex: storagePairIndex,
        },
      });

      if (pollError) {
        const errorBody = (pollError as any)?.context?.body;
        if (errorBody?.done && errorBody?.errorCode === 'RAI_FILTERED') {
          throw new Error(`Safety filter: ${errorBody.error || 'Content blocked by safety filters.'}`);
        }
        if (errorBody?.done && errorBody?.error) {
          throw new Error(errorBody.error);
        }
        console.warn(`Poll ${i + 1} error:`, pollError.message);
        continue;
      }

      if (pollData?.done) {
        if (pollData.status === 'error') {
          throw new Error(pollData.error || 'Video generation failed');
        }
        return {
          videoUrl: pollData.videoUrl,
          status: 'complete' as const,
          operationName: data.operationName,
          storagePath: pollData.storagePath,
          generationMode: data.generationMode || pollData.generationMode,
        };
      }
    }

    throw new Error('Video generation timed out after 10 minutes.');
  }

  throw new Error(data.message || 'No video URL returned');
}

export async function generateMode2Video(
  prompt: string,
  pairIndex: number,
  projectName: string,
  startImageBase64: string,
  endImageBase64?: string,
): Promise<Mode2VideoResult> {
  const result = await generateSingleVeoVideo(prompt, pairIndex, projectName, startImageBase64, endImageBase64, 8);
  return {
    videoUrl: result.videoUrl,
    status: 'complete',
    operationName: result.operationName,
    generationMode: result.generationMode,
  };
}

export function imageUrlToBase64(url: string): Promise<string> {
  if (url.startsWith('data:')) {
    return Promise.resolve(url.split(',')[1]);
  }

  return fetch(url)
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch image');
      return res.blob();
    })
    .then(blob => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    }));
}
