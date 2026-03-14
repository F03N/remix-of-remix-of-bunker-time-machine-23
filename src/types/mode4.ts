export type Mode4WorkflowStep = 1 | 2 | 3 | 4;

export const MODE4_STEP_LABELS: Record<Mode4WorkflowStep, string> = {
  1: 'Setup',
  2: 'Prompts',
  3: 'Generate',
  4: 'Export',
};

export interface Mode4ImageSlot {
  index: number;
  title: string;
  prompt: string;
  generatedImageUrl?: string;
  imageBase64?: string;
  approved: boolean;
  generating: boolean;
}

export interface Mode4VideoSlot {
  index: number;
  title: string;
  prompt: string;
  generatedVideoUrl?: string;
  approved: boolean;
  generating: boolean;
}

export const MODE4_IMAGE_COUNT = 4;
export const MODE4_VIDEO_COUNT = 4;
