import type { QualityMode, ShotType, TransitionShotType, InteriorStyle, VisualMood, ConstructionIntensity } from '@/types/project';
import { deriveTransitionShotType, TRANSITION_SHOT_TYPE_LABELS } from '@/types/project';

/**
 * MASTER SYSTEM PROMPT
 */
export const MASTER_SYSTEM_PROMPT = `You are an expert AI assistant specialized in creating viral bunker restoration timelapse video content for YouTube Shorts, TikTok, and Instagram Reels.

BUNKER TIME LAPS (MASTER PROMPT)

BUNKER TIME LAPS VIRAL VIDEO

MASTER PROMPT (PROFESSIONAL VERSION)

PROJECT OBJECTIVE:
Create a short-form, hyper-realistic cinematic AI timelapse transformation video similar to viral construction and restoration content seen on YouTube Shorts, TikTok, and Instagram Reels.

The video must show construction workers transforming a severely damaged or abandoned bunker into a fully restored, modern, functional space.

The transformation must:
- Feel gradual and realistic
- Avoid instant changes
- Show clear progress in every stage
- Follow a 9-scene storytelling structure
- Be optimized for vertical 9:16 format

9-SCENE STORY STRUCTURE (MANDATORY):

Scene 1 — BEFORE (Damaged State)
- Abandoned bunker
- Broken concrete, rust, debris, cracks
- Poor lighting, dirty atmosphere
- No workers present
- Environment feels neglected

Scene 2 — ARRIVAL
- Construction crew arrives
- Carrying tools and materials
- Inspecting site
- Setting up lighting and equipment

Scene 3 — WORK IN PROGRESS (Exterior Start)
- Debris removal
- Welding and repairing structure
- Reinforcing damaged sections
- Early visible improvements

Scene 4 — EXTERIOR NEAR COMPLETION
- Exterior mostly restored
- Clean surfaces
- Fresh concrete or metal
- Organized surroundings

Scene 5 — ENTERING UNDERGROUND
- Workers open or access the bunker entrance
- Interior is dark, damaged, unfinished
- Underground environment revealed

Scene 6 — INTERIOR WORK IN PROGRESS
- Installing lighting systems
- Wall repairs
- Flooring installation
- Running cables and systems
- Gradual visible improvement

Scene 7 — INTERIOR FINALIZATION
- Clean and modern interior
- Bright cinematic lighting
- Polished surfaces
- Fully functional environment

Scene 8 — INTERIOR DESIGN TRANSFORMATION
Examples:
- Modern living room
- High-tech studio
- Command center
- Office space
- Luxury underground apartment
- Research lab
- Gaming room
- Minimalist smart home

Scene 9 — FINAL AFTER (Cinematic Reveal)
- Fully restored bunker (inside + outside)
- Futuristic, clean, impressive
- Wide cinematic reveal shot
- Highly satisfying transformation

CONTENT REQUIREMENTS:

1. Provide 10 Unique Location Concepts
Each concept must:
- Feature a completely different environment
- Show strong before-and-after contrast

Examples:
- Mountain bunker
- Desert bunker
- Coastal bunker
- Forest bunker
- Snow-covered bunker
- Abandoned city bunker
- Jungle bunker
- Cliffside bunker
- Industrial zone bunker
- War-zone bunker

2. For Each Idea Provide:

A. 9 Detailed Text-to-Image Prompts
One per scene:
- Same camera angle across all scenes
- Same location consistency
- Same lighting style
- Hyper-realistic
- Cinematic
- Highly detailed
- Natural construction progress
- Vertical 9:16 format
- Compatible with Midjourney / SDXL / Leonardo

B. 9 Short Animation Prompts
Simple motion instructions such as:
- Dust drifting
- Workers operating tools
- Sparks from welding
- Slow cinematic camera push
- Light flickering on
- Debris clearing
- Keep concise.

C. 1 Full Voiceover Script Per Idea
- 30–45 seconds
- Emotional and satisfying tone
- Strong hook
- Focused on transformation
- Powerful final reveal

STYLE REQUIREMENTS:
- Hyper-realistic
- Cinematic lighting
- Natural shadows
- Accurate construction equipment
- Believable material transitions
- No fantasy elements
- No instant transformations
- Structured visual progression
- Designed for viral short-form
- Vertical 9:16 format only

CRITICAL RULES:
- Every scene must maintain the EXACT same bunker identity, entrance geometry, and camera angle
- Worker presence is SCENE-AWARE (not globally blocked):
  • Scene 1 (Before): NO workers — atmosphere only
  • Scenes 2, 3, 5, 6: Workers REQUIRED
  • Scenes 4, 7, 8: Workers OPTIONAL
  • Scene 9 (Final Reveal): NO workers — cinematic reveal only
- NO magical self-repair. All structural changes must have visible worker or tool/equipment evidence
- All motion must be minimal, restrained, and gradual — construction timelapse style

OUTPUT FORMAT (MANDATORY):
For each of the 10 ideas, structure as:

IDEA TITLE

Scene 1 — Before
Text-to-Image Prompt:
Animation Prompt:

Scene 2 — Arrival
Text-to-Image Prompt:
Animation Prompt:

Scene 3 — Work in Progress
Text-to-Image Prompt:
Animation Prompt:

Scene 4 — Exterior Near Completion
Text-to-Image Prompt:
Animation Prompt:

Scene 5 — Entering Underground
Text-to-Image Prompt:
Animation Prompt:

Scene 6 — Interior Work in Progress
Text-to-Image Prompt:
Animation Prompt:

Scene 7 — Interior Finalization
Text-to-Image Prompt:
Animation Prompt:

Scene 8 — Interior Design Transformation
Text-to-Image Prompt:
Animation Prompt:

Scene 9 — Final After
Text-to-Image Prompt:
Animation Prompt:

Voiceover Script:`;

/**
 * PROJECT PLAN PROMPT — generates title, summary, and 9 scene prompts
 */
export function getProjectPlanPrompt(config: {
  ideaTitle: string;
  ideaDescription: string;
  environmentType: string;
  interiorStyle: InteriorStyle;
  visualMood: VisualMood;
  constructionIntensity: ConstructionIntensity;
  customNotes: string;
}): string {
  const { ideaTitle, ideaDescription, environmentType, interiorStyle, visualMood, constructionIntensity, customNotes } = config;

  const interiorLabel = interiorStyle.replace(/-/g, ' ');
  const moodLabel = visualMood.replace(/-/g, ' ');

  return `Create a complete bunker transformation project plan.

SELECTED CONCEPT:
Title: ${ideaTitle}
Description: ${ideaDescription}
Environment: ${environmentType}

USER CONFIGURATION:
- Final Interior Style: ${interiorLabel}
- Visual Mood: ${moodLabel}
- Construction Intensity: ${constructionIntensity}
- Output Format: Vertical 9:16
${customNotes ? `- Custom Notes: ${customNotes}` : ''}

Generate a COMPLETE PROJECT including:
1. A cinematic project title
2. A short project summary (2-3 sentences)
3. 9 detailed scenes following the mandatory structure

The 9 scenes MUST follow this EXACT structure:
Scene 1 — BEFORE (Damaged State)
Scene 2 — ARRIVAL
Scene 3 — WORK IN PROGRESS (Exterior Start)
Scene 4 — EXTERIOR NEAR COMPLETION
Scene 5 — ENTERING UNDERGROUND
Scene 6 — INTERIOR WORK IN PROGRESS
Scene 7 — INTERIOR FINALIZATION
Scene 8 — INTERIOR DESIGN TRANSFORMATION (using ${interiorLabel} as the design theme)
Scene 9 — FINAL AFTER (Cinematic Reveal)

The visual mood must be: ${moodLabel}
The construction intensity is: ${constructionIntensity}

For EACH scene, provide:
- "title": string (scene name)
- "imagePrompt": string — CRITICAL: This must be a PURE NATURAL LANGUAGE DESCRIPTION. Write it as a single flowing paragraph describing the scene visually. Do NOT use any labels, field names, structured data, JSON-like keys, bullet points, or metadata tags like "setting:", "camera_angle:", "environment_state:", "Identity_lock:", etc. The prompt must read like a photographer describing a shot, NOT like a data sheet. Example: "A crumbling concrete bunker entrance in a post-apocalyptic cityscape, seen from eye-level, with rusted iron door and exposed rebar, surrounded by debris, overcast sky, hyper-realistic, cinematic lighting, 8K, vertical 9:16 format."
- "motionPrompt": string (short animation instruction, minimal motion, timelapse style)
- "narration": string (1-2 sentence voiceover narration)
- "notes": string (continuity notes)

Worker presence rules:
- Scene 1: NO workers. Atmosphere only.
- Scene 2: Workers REQUIRED. Crew arriving with tools.
- Scene 3: Workers REQUIRED. Active debris removal, welding.
- Scene 4: Workers OPTIONAL. Clean exterior.
- Scene 5: Workers REQUIRED. Opening bunker entrance.
- Scene 6: Workers REQUIRED. Installing lighting, repairing walls.
- Scene 7: Workers OPTIONAL. Clean modern interior.
- Scene 8: Workers usually ABSENT. Design reveal.
- Scene 9: NO workers. Cinematic reveal.

Return a JSON object with:
{
  "projectTitle": string,
  "projectSummary": string,
  "scenes": [array of 9 scene objects]
}

Return ONLY the JSON, no markdown formatting or code blocks.`;
}

/**
 * AUDIO PLAN PROMPT
 */
export function getAudioPlanPrompt(scenes: { title: string; narration: string }[]): string {
  const sceneList = scenes.map((s, i) => `Scene ${i + 1} (${s.title}): ${s.narration}`).join('\n');
  return `Create a complete audio plan for this 9-scene bunker restoration timelapse video.

Scenes:
${sceneList}

VOICEOVER REQUIREMENTS:
- 1 Full Voiceover Script Per Idea
- Total script: 30–45 seconds
- Emotional and satisfying tone
- Strong hook at the beginning
- Focused on transformation narrative
- Powerful final reveal moment

Return a JSON object with:
- "fullScript": string (complete voiceover script, 30-45 seconds, with [Scene X] markers)
- "sceneNarrations": string[] (array of 9 narration texts)
- "ambienceNotes": string[] (array of 9 ambient sound descriptions)
- "sfxNotes": string[] (array of 9 sound effect cues)

Return ONLY the JSON object, no markdown formatting or code blocks.`;
}

/**
 * Build STRICT pair transition prompt.
 */
export function buildStrictTransitionPrompt(
  motionPrompt: string,
  settings: { motionStrength: number; cameraIntensity: number; realismPriority: number; morphSuppression: number; continuityStrictness: number },
  startSceneTitle: string,
  endSceneTitle: string,
  hasRepairActivity: boolean,
  endSceneIndex?: number,
  startShotType?: ShotType,
  endShotType?: ShotType
): string {
  const isUltraStrict = settings.motionStrength <= 15 && settings.morphSuppression >= 95;
  const isStrict = settings.motionStrength <= 30 && settings.morphSuppression >= 85;

  // Build strong worker instructions based on scene requirements
  let workerNote: string;
  let antiMagicNote: string;
  if (endSceneIndex !== undefined) {
    const workerRequired = [1, 2, 4, 5].includes(endSceneIndex);
    const noWorkers = [0, 8].includes(endSceneIndex);
    if (workerRequired) {
      workerNote = 'Construction workers MUST be visible throughout the entire video performing the repair work. Show workers using tools, carrying materials, welding, hammering, or installing components. The workers are the CAUSE of every change. Without workers visible, the video is invalid.';
      antiMagicNote = 'CRITICAL: Every structural change, repair, or improvement MUST be caused by visible human workers using physical tools. Surfaces do NOT clean themselves. Walls do NOT repair themselves. Debris does NOT disappear on its own. If something changes, a worker must be shown doing it. No magical self-repair. No autonomous material transformation.';
    } else if (noWorkers) {
      workerNote = 'No workers present. This is an atmosphere-only or cinematic reveal shot.';
      antiMagicNote = 'No structural changes should occur. This is a static environmental or reveal shot.';
    } else {
      workerNote = 'Workers are optional but if any repair or change happens, workers or evidence of recent human work (fresh tool marks, scaffolding, equipment) must be visible as the cause.';
      antiMagicNote = 'Any visible improvement must show evidence of human construction work. Nothing repairs or transforms on its own.';
    }
  } else {
    workerNote = hasRepairActivity
      ? 'Construction workers MUST be visible performing all repair work. Every change requires a visible human cause.'
      : 'Atmosphere only. No construction activity. No changes to structure.';
    antiMagicNote = hasRepairActivity
      ? 'No self-repairing surfaces. No magically disappearing debris. Workers cause all changes.'
      : 'Static atmosphere. No structural changes.';
  }

  const transitionShotType = (startShotType && endShotType) ? deriveTransitionShotType(startShotType, endShotType) : null;
  const shotTypeConstraint = buildShotTypeConstraint(transitionShotType, startShotType, endShotType);

  if (isUltraStrict) {
    return `${motionPrompt}

ABSOLUTE CONSTRAINTS — DO NOT DEVIATE:
- Start frame: "${startSceneTitle}" — End frame: "${endSceneTitle}"
- LOCKED camera. No camera movement whatsoever.
- LOCKED composition. Same framing, same angle, same field of view throughout.
- LOCKED structure. Same bunker geometry, same entrance shape, same wall positions, same proportions.
- LOCKED environment. Same sky, same terrain, same surrounding elements.
- ALMOST STATIC video. Only extremely subtle, slow, realistic changes allowed.
- NO morphing. No shape-shifting. No warping. No melting. No stretching.
- NO new objects appearing from nowhere. NO objects disappearing without a worker removing them.
- NO style changes. NO color grading shifts. NO lighting mood changes.
- NO creative interpretation. Reproduce the start image with only the minimal physical changes described in the motion prompt.

WORKER & REALISM RULES:
- ${workerNote}
- ${antiMagicNote}
- This is a real construction timelapse. Every physical change must have a visible human cause.
- Think of it as a security camera recording real construction workers over hours, compressed into seconds.
${shotTypeConstraint}`;
  }

  if (isStrict) {
    return `${motionPrompt}

STRICT CONSTRAINTS:
- Start: "${startSceneTitle}" → End: "${endSceneTitle}"
- Camera: stationary. No movement.
- Composition: identical framing and angle throughout.
- Structure: same bunker geometry, entrance, walls, proportions.
- Environment: same surroundings, sky, terrain.
- Motion: very minimal. Slow, subtle, realistic changes only.
- No morphing. No warping. No objects appearing/disappearing without cause.
- No creative reinterpretation. Follow the motion prompt literally.

WORKER & REALISM RULES:
- ${workerNote}
- ${antiMagicNote}
- Construction timelapse style: changes happen because workers physically make them happen.
${shotTypeConstraint}`;
  }

  return `${motionPrompt}

CONSTRAINTS:
- Transition from "${startSceneTitle}" to "${endSceneTitle}".
- Maintain same bunker structure, entrance geometry, and camera angle.
- Keep same environment and composition.
- Controlled, gradual motion. Construction timelapse style.
- No heavy morphing. No dramatic camera movements.

WORKER & REALISM RULES:
- ${workerNote}
- ${antiMagicNote}
- All repairs and changes must be visibly caused by human workers, not self-occurring.
${shotTypeConstraint}`;
}

function buildShotTypeConstraint(transitionType: TransitionShotType | null, startShot?: ShotType, endShot?: ShotType): string {
  if (!transitionType || !startShot || !endShot) return '';

  const rules: Record<TransitionShotType, string> = {
    'exterior-to-exterior': `SHOT TYPE: EXTERIOR → EXTERIOR
- Stay in the same exterior-facing composition throughout.
- Do NOT switch to an interior shot at any point.
- Do NOT show the inside of the bunker.
- Camera remains outside, facing the same exterior surface/entrance.`,

    'interior-to-interior': `SHOT TYPE: INTERIOR → INTERIOR
- Stay inside the bunker throughout the entire transition.
- Do NOT jump back outside or show exterior views.
- Preserve the interior camera identity: same room, same walls, same perspective.
- Interior lighting must remain consistent.`,

    'exterior-to-interior': `SHOT TYPE: EXTERIOR → INTERIOR
- This transition moves from outside to inside.
- Show a controlled, logical push-in or reveal through the entrance.
- Do NOT cut abruptly to a disconnected interior shot.
- The transition must be physically believable.
- Maintain the same bunker identity throughout.`,

    'entrance-facing': `SHOT TYPE: ENTRANCE TRANSITION
- Camera faces the bunker entrance.
- Interior may be visible only through the same entrance opening.
- Do NOT change to a completely different unrelated camera angle.
- The entrance composition must remain consistent.`,

    'reveal': `SHOT TYPE: CINEMATIC REVEAL
- Final reveal shot showing the fully restored space.
- May combine interior and exterior elements in a cinematic composition.
- Wide, impressive framing allowed.
- No workers present.`,
  };

  return '\n' + rules[transitionType];
}

/**
 * Build a continuity review prompt for Gemini Vision.
 */
export function getContinuityReviewPrompt(): string {
  return `You are analyzing a sequence of bunker restoration scene images for visual continuity.

The 9-scene structure is:
1. Before (Damaged State) — atmosphere only, no workers
2. Arrival — workers arriving with tools
3. Work in Progress (Exterior) — active repair
4. Exterior Near Completion — clean surfaces
5. Entering Underground — dark interior revealed
6. Interior Work In Progress — installing systems
7. Interior Finalization — clean, modern, bright
8. Interior Design — furnished with theme
9. Final Reveal — cinematic, no workers

ANALYZE EACH CONSECUTIVE PAIR for:
1. STRUCTURAL IDENTITY: Is it visually the same bunker?
2. CAMERA ANGLE: Is the viewing angle consistent?
3. COMPOSITION: Is the framing similar?
4. ENVIRONMENT: Are surroundings consistent?
5. PROGRESSION: Does restoration progress logically?
6. COLOR/LIGHTING: Is the color palette consistent?
7. WORKER PRESENCE: Scenes 2,3,5,6 should show workers. Scenes 1,9 should NOT.

For each issue found, return a JSON array of flag objects:
- "sceneIndex": number (0-8)
- "type": "identity" | "angle" | "framing" | "environment" | "progression" | "worker-logic"
- "message": string
- "severity": "warning" | "error"

If all scenes pass, return an empty array: []
Return ONLY the JSON array, no markdown or code blocks.`;
}

/**
 * Get the structural identity anchoring suffix for image generation.
 */
export function getStructuralAnchor(sceneIndex: number, ideaTitle: string): string {
  if (sceneIndex === 0) {
    return `\n\nThis image establishes the canonical bunker appearance for "${ideaTitle}". All subsequent scenes must match this exact structure, entrance geometry, camera angle, framing, and environment. Do not include any text, labels, watermarks, or written words in the image.`;
  }
  return `\n\nThis must show the exact same bunker as the first scene, same building shape, same entrance geometry, same camera angle, same framing, same environment, same surrounding terrain. Only the restoration state changes. Do not include any text, labels, watermarks, or written words in the image.`;
}
