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

export interface Mode3ImageSlot {
  index: number;
  prompt: string;
  imageUrl: string | null;
  generating: boolean;
}

export interface Mode3VideoSlot {
  index: number;
  prompt: string;
  videoUrl: string | null;
  generating: boolean;
}

export interface Mode3State {
  projectId: string | null;
  name: string;
  currentStep: Mode3Step;
  selectedRoom: Mode3RoomType | null;
  imageSlots: Mode3ImageSlot[];
  videoSlots: Mode3VideoSlot[];
}

interface Mode3Actions {
  setProjectId: (id: string | null) => void;
  setName: (name: string) => void;
  setCurrentStep: (step: Mode3Step) => void;
  setSelectedRoom: (room: Mode3RoomType | null) => void;
  setImageSlots: (slots: Mode3ImageSlot[]) => void;
  setVideoSlots: (slots: Mode3VideoSlot[]) => void;
  resetProject: () => void;
}

const makeImageSlots = (): Mode3ImageSlot[] =>
  Array.from({ length: 4 }, (_, i) => ({ index: i, prompt: '', imageUrl: null, generating: false }));

const makeVideoSlots = (): Mode3VideoSlot[] =>
  Array.from({ length: 3 }, (_, i) => ({ index: i, prompt: '', videoUrl: null, generating: false }));

const initialState: Mode3State = {
  projectId: null,
  name: '',
  currentStep: 1,
  selectedRoom: null,
  imageSlots: makeImageSlots(),
  videoSlots: makeVideoSlots(),
};

export const useMode3Store = create<Mode3State & Mode3Actions>((set) => ({
  ...initialState,
  setProjectId: (id) => set({ projectId: id }),
  setName: (name) => set({ name }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setSelectedRoom: (room) => set({ selectedRoom: room }),
  setImageSlots: (slots) => set({ imageSlots: slots }),
  setVideoSlots: (slots) => set({ videoSlots: slots }),
  resetProject: () => set({ ...initialState, imageSlots: makeImageSlots(), videoSlots: makeVideoSlots() }),
}));
