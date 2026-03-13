import { create } from 'zustand';

export type Mode3Step = 1 | 2 | 3 | 4 | 5;

export const MODE3_STEP_LABELS: Record<Mode3Step, string> = {
  1: 'Setup',
  2: 'Prompts',
  3: 'Images',
  4: 'Videos',
  5: 'Download',
};

export const MODE3_ROOM_TYPES = [
  'Kitchen',
  'Living Room',
  'Garage',
  'Bedroom',
  'Bathroom',
  'Dining Area',
  'Home Office',
  'Studio Apartment',
  'Retail Interior',
  'Luxury Showroom',
] as const;

export type Mode3RoomType = typeof MODE3_ROOM_TYPES[number];

export const MODE3_IMAGE_STAGES = [
  'Empty Construction Space',
  'Mid Construction Prep',
  'Completed Metallic Epoxy Floor',
  'Fully Furnished Luxury Room',
] as const;

export const MODE3_VIDEO_STAGES = [
  'Construction Begins',
  'Epoxy Installation',
  'Human Furnishing',
] as const;

export interface Mode3ImageSlot {
  index: number;
  stage: string;
  prompt: string;
  imageUrl: string | null;
  imageBase64: string | null;
  generating: boolean;
}

export interface Mode3VideoSlot {
  index: number;
  stage: string;
  prompt: string;
  videoUrl: string | null;
  operationName: string | null;
  generating: boolean;
}

export interface Mode3State {
  projectId: string | null;
  name: string;
  currentStep: Mode3Step;
  selectedRoom: Mode3RoomType | null;
  promptsGenerating: boolean;
  promptsGenerated: boolean;
  imageSlots: Mode3ImageSlot[];
  videoSlots: Mode3VideoSlot[];
}

interface Mode3Actions {
  setProjectId: (id: string | null) => void;
  setName: (name: string) => void;
  setCurrentStep: (step: Mode3Step) => void;
  setSelectedRoom: (room: Mode3RoomType | null) => void;
  setPromptsGenerating: (v: boolean) => void;
  setPromptsGenerated: (v: boolean) => void;
  setImageSlots: (slots: Mode3ImageSlot[]) => void;
  setVideoSlots: (slots: Mode3VideoSlot[]) => void;
  updateImageSlot: (index: number, updates: Partial<Mode3ImageSlot>) => void;
  updateVideoSlot: (index: number, updates: Partial<Mode3VideoSlot>) => void;
  resetProject: () => void;
}

const makeImageSlots = (): Mode3ImageSlot[] =>
  MODE3_IMAGE_STAGES.map((stage, i) => ({ index: i, stage, prompt: '', imageUrl: null, imageBase64: null, generating: false }));

const makeVideoSlots = (): Mode3VideoSlot[] =>
  MODE3_VIDEO_STAGES.map((stage, i) => ({ index: i, stage, prompt: '', videoUrl: null, operationName: null, generating: false }));

const initialState: Mode3State = {
  projectId: null,
  name: '',
  currentStep: 1,
  selectedRoom: null,
  promptsGenerating: false,
  promptsGenerated: false,
  imageSlots: makeImageSlots(),
  videoSlots: makeVideoSlots(),
};

export const useMode3Store = create<Mode3State & Mode3Actions>((set) => ({
  ...initialState,
  setProjectId: (id) => set({ projectId: id }),
  setName: (name) => set({ name }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setSelectedRoom: (room) => set({ selectedRoom: room }),
  setPromptsGenerating: (v) => set({ promptsGenerating: v }),
  setPromptsGenerated: (v) => set({ promptsGenerated: v }),
  setImageSlots: (slots) => set({ imageSlots: slots }),
  setVideoSlots: (slots) => set({ videoSlots: slots }),
  updateImageSlot: (index, updates) => set((state) => ({
    imageSlots: state.imageSlots.map((s) => s.index === index ? { ...s, ...updates } : s),
  })),
  updateVideoSlot: (index, updates) => set((state) => ({
    videoSlots: state.videoSlots.map((s) => s.index === index ? { ...s, ...updates } : s),
  })),
  resetProject: () => set({ ...initialState, imageSlots: makeImageSlots(), videoSlots: makeVideoSlots() }),
}));
