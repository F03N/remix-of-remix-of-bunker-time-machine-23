import { create } from 'zustand';
import type { Mode4WorkflowStep, Mode4ImageSlot, Mode4VideoSlot } from '@/types/mode4';

interface Mode4State {
  projectId: string | null;
  name: string;
  currentStep: Mode4WorkflowStep;
  referenceImageUrl: string | null;
  referenceImageBase64: string | null;
  imageSlots: Mode4ImageSlot[];
  videoSlots: Mode4VideoSlot[];

  setProjectId: (id: string | null) => void;
  setName: (name: string) => void;
  setCurrentStep: (step: Mode4WorkflowStep) => void;
  setReferenceImage: (base64: string, url?: string) => void;
  setImageSlots: (slots: Mode4ImageSlot[]) => void;
  setVideoSlots: (slots: Mode4VideoSlot[]) => void;
  updateImageSlot: (index: number, updates: Partial<Mode4ImageSlot>) => void;
  updateVideoSlot: (index: number, updates: Partial<Mode4VideoSlot>) => void;
  resetProject: () => void;
}

const initialImageSlots: Mode4ImageSlot[] = Array.from({ length: 4 }, (_, i) => ({
  index: i,
  title: `Image ${i + 1}`,
  prompt: '',
  approved: false,
  generating: false,
}));

const initialVideoSlots: Mode4VideoSlot[] = Array.from({ length: 4 }, (_, i) => ({
  index: i,
  title: `Video ${i + 1}`,
  prompt: '',
  approved: false,
  generating: false,
}));

export const useMode4Store = create<Mode4State>((set) => ({
  projectId: null,
  name: '',
  currentStep: 1,
  referenceImageUrl: null,
  referenceImageBase64: null,
  imageSlots: [...initialImageSlots],
  videoSlots: [...initialVideoSlots],

  setProjectId: (id) => set({ projectId: id }),
  setName: (name) => set({ name }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setReferenceImage: (base64, url) => set({ referenceImageBase64: base64 || null, referenceImageUrl: url || null }),
  setImageSlots: (slots) => set({ imageSlots: slots }),
  setVideoSlots: (slots) => set({ videoSlots: slots }),
  updateImageSlot: (index, updates) =>
    set((state) => ({
      imageSlots: state.imageSlots.map((s) => (s.index === index ? { ...s, ...updates } : s)),
    })),
  updateVideoSlot: (index, updates) =>
    set((state) => ({
      videoSlots: state.videoSlots.map((s) => (s.index === index ? { ...s, ...updates } : s)),
    })),
  resetProject: () => set({
    projectId: null,
    name: '',
    currentStep: 1,
    referenceImageUrl: null,
    referenceImageBase64: null,
    imageSlots: initialImageSlots.map((s) => ({ ...s })),
    videoSlots: initialVideoSlots.map((s) => ({ ...s })),
  }),
}));
