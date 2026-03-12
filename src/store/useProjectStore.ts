import { create } from 'zustand';
import type {
  ProjectState, WorkflowStep, QualityMode, SceneData, TransitionPair,
  AudioData, ContinuityFlag, InteriorStyle, VisualMood, ConstructionIntensity,
} from '@/types/project';
import { SCENE_TITLES, REPAIR_SCENES, getWorkerCuesForScene, DEFAULT_SCENE_SHOT_TYPES } from '@/types/project';

interface ProjectStore extends ProjectState {
  projectId: string | null;
  setProjectId: (id: string | null) => void;
  setName: (name: string) => void;
  setReferenceNotes: (notes: string) => void;
  setQualityMode: (mode: QualityMode) => void;
  setCurrentStep: (step: WorkflowStep) => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  selectIdea: (index: number) => void;
  setInteriorStyle: (style: InteriorStyle) => void;
  setVisualMood: (mood: VisualMood) => void;
  setConstructionIntensity: (intensity: ConstructionIntensity) => void;
  setCustomNotes: (notes: string) => void;
  setProjectTitle: (title: string) => void;
  setProjectSummary: (summary: string) => void;
  setScenes: (scenes: SceneData[]) => void;
  updateScene: (index: number, updates: Partial<SceneData>) => void;
  setTransitions: (transitions: TransitionPair[]) => void;
  updateTransition: (index: number, updates: Partial<TransitionPair>) => void;
  setAudio: (audio: Partial<AudioData>) => void;
  setContinuityFlags: (flags: ContinuityFlag[]) => void;
  loadState: (state: ProjectState) => void;
  resetProject: () => void;
  getState: () => ProjectState;
}

const initialScenes: SceneData[] = SCENE_TITLES.map((title, i) => ({
  index: i,
  title,
  imagePrompt: '',
  motionPrompt: '',
  notes: '',
  narration: '',
  approved: false,
  generating: false,
  hasRepairActivity: REPAIR_SCENES.includes(i),
  workerCues: getWorkerCuesForScene(i),
  shotType: DEFAULT_SCENE_SHOT_TYPES[i] || 'exterior',
}));

const initialState: ProjectState = {
  name: '',
  referenceNotes: '',
  qualityMode: 'balanced',
  currentStep: 1,
  selectedIdeaIndex: null,
  interiorStyle: 'luxury-bunker',
  visualMood: 'cinematic-dramatic',
  constructionIntensity: 'medium',
  customNotes: '',
  projectTitle: '',
  projectSummary: '',
  scenes: initialScenes,
  transitions: [],
  audio: {
    fullScript: '',
    sceneNarrations: Array(9).fill(''),
    ambienceNotes: Array(9).fill(''),
    sfxNotes: Array(9).fill(''),
    ttsReady: false,
    generatedAudioUrls: Array(9).fill(''),
    fullAudioUrl: undefined,
    audioGenerated: false,
  },
  continuityFlags: [],
};

export const useProjectStore = create<ProjectStore>((set, get) => ({
  ...initialState,
  projectId: null,

  setProjectId: (id) => set({ projectId: id }),
  setName: (name) => set({ name }),
  setReferenceNotes: (notes) => set({ referenceNotes: notes }),
  setQualityMode: (mode) => set({ qualityMode: mode }),
  setCurrentStep: (step) => set({ currentStep: step }),

  goToNextStep: () => set((s) => ({
    currentStep: Math.min(5, s.currentStep + 1) as WorkflowStep,
  })),

  goToPrevStep: () => set((s) => ({
    currentStep: Math.max(1, s.currentStep - 1) as WorkflowStep,
  })),

  selectIdea: (index) => set({ selectedIdeaIndex: index }),
  setInteriorStyle: (style) => set({ interiorStyle: style }),
  setVisualMood: (mood) => set({ visualMood: mood }),
  setConstructionIntensity: (intensity) => set({ constructionIntensity: intensity }),
  setCustomNotes: (notes) => set({ customNotes: notes }),
  setProjectTitle: (title) => set({ projectTitle: title }),
  setProjectSummary: (summary) => set({ projectSummary: summary }),

  setScenes: (scenes) => set({ scenes }),
  updateScene: (index, updates) => set((s) => ({
    scenes: s.scenes.map((sc, i) => i === index ? { ...sc, ...updates } : sc),
  })),

  setTransitions: (transitions) => set({ transitions }),
  updateTransition: (index, updates) => set((s) => ({
    transitions: s.transitions.map((tr, i) => i === index ? { ...tr, ...updates } : tr),
  })),

  setAudio: (audio) => set((s) => ({
    audio: { ...s.audio, ...audio },
  })),

  setContinuityFlags: (flags) => set({ continuityFlags: flags }),

  loadState: (state) => set({ ...state }),

  resetProject: () => set({ ...initialState, projectId: null }),

  getState: () => {
    const s = get();
    return {
      name: s.name,
      referenceNotes: s.referenceNotes,
      qualityMode: s.qualityMode,
      currentStep: s.currentStep,
      selectedIdeaIndex: s.selectedIdeaIndex,
      interiorStyle: s.interiorStyle,
      visualMood: s.visualMood,
      constructionIntensity: s.constructionIntensity,
      customNotes: s.customNotes,
      projectTitle: s.projectTitle,
      projectSummary: s.projectSummary,
      scenes: s.scenes,
      transitions: s.transitions,
      audio: s.audio,
      continuityFlags: s.continuityFlags,
    };
  },
}));
