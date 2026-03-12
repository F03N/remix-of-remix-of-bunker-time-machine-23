import { create } from 'zustand';
import type {
  Mode2WorkflowStep, Mode2Path, Mode2Source,
  Mode2SceneData, Mode2TransitionData, Mode2MaterialMapping, Mode2Template,
} from '@/types/mode';
import type { QualityMode } from '@/types/project';
import {
  MODE2_INTERIOR_TITLES, MODE2_EXTERIOR_TITLES,
  MODE2_SCENE_COUNT, MODE2_TRANSITION_COUNT,
} from '@/types/mode';

export interface Mode2State {
  name: string;
  qualityMode: QualityMode;
  currentStep: Mode2WorkflowStep;
  customNotes: string;
  path: Mode2Path;
  source: Mode2Source;
  // Reference image
  referenceImageBase64: string;
  referenceImageUrl: string;
  selectedTemplateId: string | null;
  // Classification
  classification: 'interior' | 'exterior' | null;
  classifying: boolean;
  // Material mapping
  materialMapping: Mode2MaterialMapping | null;
  // Plan
  planSummary: string;
  planGenerating: boolean;
  scenes: Mode2SceneData[];
  transitions: Mode2TransitionData[];
}

interface Mode2Store extends Mode2State {
  projectId: string | null;
  setProjectId: (id: string | null) => void;
  setName: (name: string) => void;
  setQualityMode: (mode: QualityMode) => void;
  setCurrentStep: (step: Mode2WorkflowStep) => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  setCustomNotes: (notes: string) => void;
  setPath: (path: Mode2Path) => void;
  setSource: (source: Mode2Source) => void;
  setReferenceImage: (base64: string, url: string) => void;
  setSelectedTemplate: (templateId: string | null) => void;
  setClassification: (cls: 'interior' | 'exterior' | null) => void;
  setClassifying: (v: boolean) => void;
  setMaterialMapping: (mapping: Mode2MaterialMapping | null) => void;
  setPlanSummary: (summary: string) => void;
  setPlanGenerating: (v: boolean) => void;
  setScenes: (scenes: Mode2SceneData[]) => void;
  updateScene: (index: number, updates: Partial<Mode2SceneData>) => void;
  setTransitions: (transitions: Mode2TransitionData[]) => void;
  updateTransition: (index: number, updates: Partial<Mode2TransitionData>) => void;
  initScenesForClassification: (cls: 'interior' | 'exterior') => void;
  resetProject: () => void;
  getState: () => Mode2State;
}

const createEmptyScenes = (): Mode2SceneData[] =>
  Array.from({ length: MODE2_SCENE_COUNT }, (_, i) => ({
    index: i,
    title: `Scene ${i + 1}`,
    imagePrompt: '',
    approved: false,
    generating: false,
  }));

const createEmptyTransitions = (): Mode2TransitionData[] =>
  Array.from({ length: MODE2_TRANSITION_COUNT }, (_, i) => ({
    index: i,
    startSceneIndex: i,
    endSceneIndex: i + 1,
    motionPrompt: '',
    approved: false,
    generating: false,
  }));

const initialState: Mode2State = {
  name: '',
  qualityMode: 'balanced',
  currentStep: 1,
  customNotes: '',
  path: null,
  source: null,
  referenceImageBase64: '',
  referenceImageUrl: '',
  selectedTemplateId: null,
  classification: null,
  classifying: false,
  materialMapping: null,
  planSummary: '',
  planGenerating: false,
  scenes: createEmptyScenes(),
  transitions: createEmptyTransitions(),
};

export const useMode2Store = create<Mode2Store>((set, get) => ({
  ...initialState,
  projectId: null,

  setProjectId: (id) => set({ projectId: id }),
  setName: (name) => set({ name }),
  setQualityMode: (mode) => set({ qualityMode: mode }),
  setCurrentStep: (step) => set({ currentStep: step }),

  goToNextStep: () => set((s) => ({
    currentStep: Math.min(5, s.currentStep + 1) as Mode2WorkflowStep,
  })),

  goToPrevStep: () => set((s) => ({
    currentStep: Math.max(1, s.currentStep - 1) as Mode2WorkflowStep,
  })),

  setCustomNotes: (notes) => set({ customNotes: notes }),
  setPath: (path) => set({ path }),
  setSource: (source) => set({ source }),
  setReferenceImage: (base64, url) => set({ referenceImageBase64: base64, referenceImageUrl: url }),
  setSelectedTemplate: (templateId) => set({ selectedTemplateId: templateId }),
  setClassification: (cls) => set({ classification: cls }),
  setClassifying: (v) => set({ classifying: v }),
  setMaterialMapping: (mapping) => set({ materialMapping: mapping }),
  setPlanSummary: (summary) => set({ planSummary: summary }),
  setPlanGenerating: (v) => set({ planGenerating: v }),
  setScenes: (scenes) => set({ scenes }),
  updateScene: (index, updates) => set((s) => ({
    scenes: s.scenes.map((sc, i) => i === index ? { ...sc, ...updates } : sc),
  })),
  setTransitions: (transitions) => set({ transitions }),
  updateTransition: (index, updates) => set((s) => ({
    transitions: s.transitions.map((tr, i) => i === index ? { ...tr, ...updates } : tr),
  })),

  initScenesForClassification: (cls) => {
    const titles = cls === 'interior' ? MODE2_INTERIOR_TITLES : MODE2_EXTERIOR_TITLES;
    const scenes = titles.map((title, i) => ({
      index: i,
      title,
      imagePrompt: '',
      approved: false,
      generating: false,
    }));
    const transitions = Array.from({ length: MODE2_TRANSITION_COUNT }, (_, i) => ({
      index: i,
      startSceneIndex: i,
      endSceneIndex: i + 1,
      motionPrompt: '',
      approved: false,
      generating: false,
    }));
    set({ scenes, transitions, classification: cls });
  },

  resetProject: () => set({ ...initialState, projectId: null }),

  getState: () => {
    const s = get();
    return {
      name: s.name,
      qualityMode: s.qualityMode,
      currentStep: s.currentStep,
      customNotes: s.customNotes,
      path: s.path,
      source: s.source,
      referenceImageBase64: s.referenceImageBase64,
      referenceImageUrl: s.referenceImageUrl,
      selectedTemplateId: s.selectedTemplateId,
      classification: s.classification,
      classifying: s.classifying,
      materialMapping: s.materialMapping,
      planSummary: s.planSummary,
      planGenerating: s.planGenerating,
      scenes: s.scenes,
      transitions: s.transitions,
    };
  },
}));
