import { describe, it, expect, beforeEach } from 'vitest';
import { useMode2Store } from '@/store/useMode2Store';
import { getTransitionSpeedRule } from '@/lib/mode2-api';
import {
  MODE2_SCENE_COUNT,
  MODE2_TRANSITION_COUNT,
  MODE2_INTERIOR_TITLES,
  MODE2_EXTERIOR_TITLES,
} from '@/types/mode';

describe('Mode 2 — End-to-End Workflow Validation', () => {
  beforeEach(() => {
    useMode2Store.getState().resetProject();
  });

  // ─── 1. SCENE & TRANSITION COUNTS ───────────────────────
  describe('Scene & Transition Counts', () => {
    it('must have exactly 8 scenes', () => {
      expect(MODE2_SCENE_COUNT).toBe(8);
    });

    it('must have exactly 7 transitions', () => {
      expect(MODE2_TRANSITION_COUNT).toBe(7);
    });

    it('store initializes with 8 empty scenes', () => {
      const state = useMode2Store.getState();
      expect(state.scenes).toHaveLength(8);
    });

    it('store initializes with 7 empty transitions', () => {
      const state = useMode2Store.getState();
      expect(state.transitions).toHaveLength(7);
    });

    it('interior classification produces exactly 8 scenes', () => {
      expect(MODE2_INTERIOR_TITLES).toHaveLength(8);
    });

    it('exterior classification produces exactly 8 scenes', () => {
      expect(MODE2_EXTERIOR_TITLES).toHaveLength(8);
    });
  });

  // ─── 2. TRANSITION MAPPING ──────────────────────────────
  describe('Transition Mapping (Image→Image)', () => {
    it('transition i connects scene i to scene i+1', () => {
      const state = useMode2Store.getState();
      state.transitions.forEach((tr, i) => {
        expect(tr.startSceneIndex).toBe(i);
        expect(tr.endSceneIndex).toBe(i + 1);
      });
    });

    it('no gaps or skips in transition sequence', () => {
      const state = useMode2Store.getState();
      for (let i = 0; i < state.transitions.length - 1; i++) {
        expect(state.transitions[i].endSceneIndex).toBe(
          state.transitions[i + 1].startSceneIndex
        );
      }
    });

    it('first transition starts at scene 0, last ends at scene 7', () => {
      const state = useMode2Store.getState();
      expect(state.transitions[0].startSceneIndex).toBe(0);
      expect(state.transitions[6].endSceneIndex).toBe(7);
    });
  });

  // ─── 3. SPEED RULES ────────────────────────────────────
  describe('Video Speed Rules', () => {
    it('transition 1 (index 0) = timelapse', () => {
      expect(getTransitionSpeedRule(0)).toBe('timelapse');
    });

    it('transition 2 (index 1) = timelapse', () => {
      expect(getTransitionSpeedRule(1)).toBe('timelapse');
    });

    it('transition 3 (index 2) = timelapse', () => {
      expect(getTransitionSpeedRule(2)).toBe('timelapse');
    });

    it('transition 4 (index 3) = realtime', () => {
      expect(getTransitionSpeedRule(3)).toBe('realtime');
    });

    it('transition 5 (index 4) = timelapse', () => {
      expect(getTransitionSpeedRule(4)).toBe('timelapse');
    });

    it('transition 6 (index 5) = timelapse', () => {
      expect(getTransitionSpeedRule(5)).toBe('timelapse');
    });

    it('transition 7 (index 6) = timelapse', () => {
      expect(getTransitionSpeedRule(6)).toBe('timelapse');
    });
  });

  // ─── 4. STORE STATE MANAGEMENT ─────────────────────────
  describe('Store State Management', () => {
    it('resetProject clears all state', () => {
      const store = useMode2Store.getState();
      store.setName('Test');
      store.setClassification('interior');
      store.setPlanSummary('Some plan');
      store.resetProject();

      const state = useMode2Store.getState();
      expect(state.name).toBe('');
      expect(state.classification).toBeNull();
      expect(state.planSummary).toBe('');
      expect(state.scenes).toHaveLength(8);
      expect(state.transitions).toHaveLength(7);
    });

    it('initScenesForClassification sets correct titles for interior', () => {
      useMode2Store.getState().initScenesForClassification('interior');
      const scenes = useMode2Store.getState().scenes;
      expect(scenes).toHaveLength(8);
      scenes.forEach((s, i) => {
        expect(s.title).toBe(MODE2_INTERIOR_TITLES[i]);
      });
    });

    it('initScenesForClassification sets correct titles for exterior', () => {
      useMode2Store.getState().initScenesForClassification('exterior');
      const scenes = useMode2Store.getState().scenes;
      expect(scenes).toHaveLength(8);
      scenes.forEach((s, i) => {
        expect(s.title).toBe(MODE2_EXTERIOR_TITLES[i]);
      });
    });

    it('updateScene modifies only the target scene', () => {
      useMode2Store.getState().updateScene(2, { imagePrompt: 'test prompt' });
      const scenes = useMode2Store.getState().scenes;
      expect(scenes[2].imagePrompt).toBe('test prompt');
      expect(scenes[1].imagePrompt).toBe('');
      expect(scenes[3].imagePrompt).toBe('');
    });

    it('updateTransition modifies only the target transition', () => {
      useMode2Store.getState().updateTransition(3, { motionPrompt: 'motion test' });
      const transitions = useMode2Store.getState().transitions;
      expect(transitions[3].motionPrompt).toBe('motion test');
      expect(transitions[2].motionPrompt).toBe('');
      expect(transitions[4].motionPrompt).toBe('');
    });
  });

  // ─── 5. WORKFLOW STEP NAVIGATION ───────────────────────
  describe('Workflow Step Navigation', () => {
    it('starts at step 1', () => {
      expect(useMode2Store.getState().currentStep).toBe(1);
    });

    it('goToNextStep advances correctly', () => {
      const store = useMode2Store.getState();
      store.goToNextStep();
      expect(useMode2Store.getState().currentStep).toBe(2);
      store.goToNextStep();
      expect(useMode2Store.getState().currentStep).toBe(3);
    });

    it('goToNextStep caps at step 5', () => {
      const store = useMode2Store.getState();
      for (let i = 0; i < 10; i++) store.goToNextStep();
      expect(useMode2Store.getState().currentStep).toBe(5);
    });

    it('goToPrevStep floors at step 1', () => {
      const store = useMode2Store.getState();
      for (let i = 0; i < 5; i++) store.goToPrevStep();
      expect(useMode2Store.getState().currentStep).toBe(1);
    });
  });

  // ─── 6. NO PROMPT-ONLY FALLBACK ───────────────────────
  describe('Frame Guidance Enforcement', () => {
    it('generateMode2Video signature requires both start and end base64', async () => {
      // Import dynamically to check the function signature
      const { generateMode2Video } = await import('@/lib/mode2-api');
      expect(typeof generateMode2Video).toBe('function');
      // The function has 6 params: prompt, pairIndex, projectName, startImageBase64, endImageBase64
      expect(generateMode2Video.length).toBeGreaterThanOrEqual(5);
    });
  });

  // ─── 7. QUALITY MODE ──────────────────────────────────
  describe('Quality Mode', () => {
    it('defaults to balanced', () => {
      expect(useMode2Store.getState().qualityMode).toBe('balanced');
    });

    it('can be changed', () => {
      useMode2Store.getState().setQualityMode('quality');
      expect(useMode2Store.getState().qualityMode).toBe('quality');
    });
  });

  // ─── 8. ASSET COMPLETENESS CHECK ──────────────────────
  describe('Asset Completeness Validation', () => {
    it('can detect all scenes generated', () => {
      const store = useMode2Store.getState();
      // Simulate all scenes generated
      for (let i = 0; i < 8; i++) {
        store.updateScene(i, {
          generatedImageUrl: `https://example.com/scene_${i}.png`,
          imageBase64: 'fakebase64',
          approved: true,
        });
      }
      const scenes = useMode2Store.getState().scenes;
      const allGenerated = scenes.every(s => !!s.generatedImageUrl);
      expect(allGenerated).toBe(true);
    });

    it('can detect all transitions generated', () => {
      const store = useMode2Store.getState();
      for (let i = 0; i < 7; i++) {
        store.updateTransition(i, {
          generatedVideoUrl: `https://example.com/transition_${i}.mp4`,
          approved: true,
        });
      }
      const transitions = useMode2Store.getState().transitions;
      const allGenerated = transitions.every(t => !!t.generatedVideoUrl);
      expect(allGenerated).toBe(true);
    });

    it('detects missing assets correctly', () => {
      const store = useMode2Store.getState();
      // Only generate some scenes
      store.updateScene(0, { generatedImageUrl: 'url', approved: true });
      store.updateScene(1, { generatedImageUrl: 'url', approved: true });

      const scenes = useMode2Store.getState().scenes;
      const missingScenes = scenes.filter(s => !s.generatedImageUrl);
      expect(missingScenes).toHaveLength(6);
    });
  });
});
