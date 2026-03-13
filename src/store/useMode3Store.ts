import { create } from 'zustand';

export interface Mode3State {
  projectId: string | null;
  name: string;
  currentStep: number;
}

interface Mode3Actions {
  setProjectId: (id: string | null) => void;
  setName: (name: string) => void;
  setCurrentStep: (step: number) => void;
  resetProject: () => void;
}

const initialState: Mode3State = {
  projectId: null,
  name: '',
  currentStep: 1,
};

export const useMode3Store = create<Mode3State & Mode3Actions>((set) => ({
  ...initialState,
  setProjectId: (id) => set({ projectId: id }),
  setName: (name) => set({ name }),
  setCurrentStep: (step) => set({ currentStep: step }),
  resetProject: () => set({ ...initialState }),
}));
