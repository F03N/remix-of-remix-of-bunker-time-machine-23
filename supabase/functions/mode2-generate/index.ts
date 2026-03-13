import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body = await req.json();
    const { action, imageBase64, classification, materialMapping, customNotes } = body;

    if (action === "classify") {
      return await handleClassify(imageBase64, LOVABLE_API_KEY);
    }

    if (action === "plan") {
      return await handlePlan(imageBase64, classification, materialMapping, customNotes, LOVABLE_API_KEY);
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (e) {
    console.error("mode2-generate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleClassify(imageBase64: string, apiKey: string) {
  if (!imageBase64) throw new Error("imageBase64 is required for classification");

  const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image and classify it as either INTERIOR or EXTERIOR.

Then perform a detailed visual analysis and material/object mapping. Identify all visible objects and architectural elements including:
- walls (material, color, condition, exact position)
- floors or ground (material, type, condition)
- ceilings (material, type, condition)
- paint colors
- woodwork
- windows (type, style, condition, position)
- doors (type, style, condition, position)
- pavement or ground
- roof
- fixtures
- furniture (items, positions, materials)
- planters
- structural elements
- lighting (type, sources, quality)

For each detected element determine exact position, scale, orientation, materials, textures, colors, and lighting conditions.

Respond ONLY in this exact JSON format, no other text:
{
  "classification": "interior" or "exterior",
  "materialMapping": {
    "walls": "description of material, color, condition, position",
    "floors": "description of material, type, condition",
    "ceiling": "description of material, type, condition",
    "windows": "description of type, style, condition, positions",
    "doors": "description of type, style, condition, positions",
    "furniture": "description of items, positions, materials",
    "lighting": "description of type, sources, quality",
    "extras": "description of plants, decorations, pavement, landscaping, roof, fixtures, planters, woodwork, paint colors, structural elements"
  }
}`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${cleanBase64}`
              }
            }
          ]
        }
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later.", errorCode: "RATE_LIMITED" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "Credits exhausted. Please add credits.", errorCode: "PAYMENT_REQUIRED" }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    throw new Error(`Classification error (${response.status}): ${errText.substring(0, 300)}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse classification response");

  const parsed = JSON.parse(jsonMatch[0]);

  return new Response(JSON.stringify({
    classification: parsed.classification,
    materialMapping: parsed.materialMapping,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function handlePlan(
  imageBase64: string,
  classification: string,
  materialMapping: any,
  customNotes: string,
  apiKey: string,
) {
  if (!classification) throw new Error("classification is required for plan generation");

  const isInterior = classification === "interior";
  const cleanBase64 = imageBase64?.includes(",") ? imageBase64.split(",")[1] : imageBase64;

  const stepsSpec = isInterior ? INTERIOR_STEPS : EXTERIOR_STEPS;
  const materialContext = materialMapping ? `\nDetected Materials:\n${JSON.stringify(materialMapping, null, 2)}` : "";
  const notesContext = customNotes ? `\nUser Notes: ${customNotes}` : "";

  // ============================================================
  // MODE 2 MASTER SYSTEM PROMPT — PRESERVED EXACTLY AS SPECIFIED
  // DO NOT SUMMARIZE. DO NOT COMPRESS. DO NOT REWRITE.
  // DO NOT SIMPLIFY. DO NOT LOOSELY REINTERPRET.
  // This is the literal creative and technical source of truth.
  // ============================================================
  const systemPrompt = `Act like a Professional AI Prompt Engineer specialized in ultra-realistic cinematic renovation visuals based on a single reference ${isInterior ? 'interior' : 'exterior'} image.

Scene Type: ${classification.toUpperCase()}
${materialContext}
${notesContext}

==================================================
SCENE DETECTION
==================================================

After the reference image is uploaded, the scene has been automatically classified as ${classification.toUpperCase()}. All renovation planning, material mapping, prompt generation, worker logic, and transitions must follow this classification. You must not mix interior logic with exterior logic.

==================================================
VISUAL ANALYSIS
==================================================

Perform a detailed visual analysis of the reference image. Identify all visible objects and architectural elements including:
- walls
- floors
- ceilings
- paint colors
- woodwork
- windows
- doors
- pavement or ground
- roof
- fixtures
- furniture
- planters
- structural elements

For each detected element determine:
- exact position
- scale
- orientation
- materials
- textures
- colors
- lighting conditions

Use this analysis to generate precise renovation prompts that preserve:
- composition
- spatial arrangement
- camera angle
- object placement
- material accuracy
- architectural identity
- lighting continuity

Do NOT introduce new elements.
Do NOT redesign the space.
Do NOT alter proportions.
Do NOT invent new architecture.
Do NOT change the layout.

Maintain extremely high fidelity to the original reference image.

==================================================
MATERIAL AND OBJECT MAPPING
==================================================

Create a material and object mapping that identifies the original locations of:
- walls
- floors
- ceilings
- paint
- woodwork
- windows
- doors
- pavement or ground
- roof
- fixtures
- furniture
- planters

All renovation steps must preserve these original positions.

Locked layout means:
- existing walls stay where they are
- existing windows stay where they are
- existing doors stay where they are
- furniture returns only to original detected positions
- the same room/building must remain the same room/building
- no object proportion changes
- no structural redesign

==================================================
PROMPT STYLE
==================================================

All image prompts must be written as ultra-detailed cinematic paragraphs.
All video prompts must be written as ultra-detailed cinematic paragraphs.
Do not output short prompts.
Do not use bullet points inside the generated prompts.
Do not use vague language.
Do not use generic renovation wording.

Every prompt must describe:
- environment
- materials
- renovation state
- worker activity
- lighting
- camera perspective
- continuity constraints

==================================================
STRICT CONTINUITY RULES
==================================================

The following rules are mandatory for all generated prompts:

1. Same exact room/building identity across all 8 images
2. Same exact camera angle across all 8 images
3. Same exact framing across all 8 images
4. Same exact composition across all 8 images
5. Same exact structural layout across all 8 images
6. Same exact object positions unless a step explicitly restores them
7. No redesign
8. No fantasy
9. No magical self-repair
10. Only the specific renovation task for the current step may change

Priority order:
1. Layout fidelity
2. Camera fidelity
3. Architectural fidelity
4. Material fidelity
5. Step-specific renovation change
6. Worker realism

Identity fidelity is more important than creativity.

==================================================
ABSOLUTE STEP ISOLATION
==================================================

Each image step may modify ONLY the specific renovation target assigned to that step. All other elements must remain visually identical to the immediately previous image.

Step isolation rules:
- Image 1: Original abandoned state. No changes.
- Image 2: CLEANING ONLY. Remove dirt, debris, bushes, grass. Do NOT repair walls, ceiling, floor, windows, or doors. Structural damage remains fully visible.
- Image 3: WALLS ONLY. Repair wall plaster/paint only. Floor, ceiling, windows, doors remain exactly as in Image 2. All damage in non-wall elements persists.
- Image 4: CEILING ONLY. Repair ceiling only. Walls remain as Image 3. Floor, windows, doors remain as Image 3. All damage in non-ceiling elements persists.
- Image 5: WINDOWS AND DOORS ONLY. Install/repair windows and doors only. Ceiling stays as Image 4. Floor stays as Image 4. Walls stay as Image 4.
- Image 6: FLOORING ONLY. Install/repair floor only. No other element changes. All other elements remain as Image 5.
- Image 7: FURNITURE/FINISHING ONLY. Place furniture and decor only. No structural changes. All architecture remains as Image 6.
- Image 8: FINAL POLISH. Same room, same layout, same architecture. Only cleaned and polished presentation. No redesign.

CRITICAL: Do NOT regenerate the whole room from scratch at each step. Each prompt must explicitly state which elements remain unchanged.

==================================================
FLOOR OPENING / FLOOR HOLE CONTINUITY
==================================================

If the reference image contains a floor opening, hole, gap, or structural floor damage, it is a CRITICAL IDENTITY MARKER.

The floor opening must remain in the EXACT SAME position, shape, scale, and perspective until the flooring step (Image 6) explicitly repairs it.

Required progression:
- Image 1: Floor opening clearly visible and damaged
- Image 2: Floor opening still clearly visible after cleaning
- Image 3: Floor opening still clearly visible during wall repair
- Image 4: Floor opening still clearly visible during ceiling repair
- Image 5: Floor opening still clearly visible during window/door work
- Image 6: FIRST step where structural floor repair is allowed. Show realistic floor preparation and installation.
- Image 7: Opening may be fully covered only if flooring was logically completed in Image 6
- Image 8: Final floor is finished

The hole must NOT move, shrink randomly, change geometry, or disappear before Image 6.

Each image prompt (Images 1-5) must explicitly state: "The floor opening/hole remains in its exact original position, shape, and scale — unchanged."

==================================================
GRADUAL CEILING PROGRESSION
==================================================

If the ceiling starts heavily destroyed, it must NOT jump directly to a near-finished state in Image 4.

The ceiling repair in Image 4 must show believable intermediate or completion stages proportional to the damage level:
- If minor damage: repair can complete in one step
- If major damage: show stabilization, partial repair framework, then near-completion

The pace of ceiling repair must stay proportional to the rest of the room renovation pace.

Do NOT show a pristine finished ceiling if the rest of the room is still heavily damaged.

==================================================
RESTORATION, NOT REDESIGN
==================================================

The final output must be RESTORATION of the original space, NOT REDESIGN into something new.

Preserve:
- Original structural character
- Original proportions
- Original architectural rhythm
- Original room identity and feel

Do NOT:
- Convert the room into a premium showroom
- Add luxury design elements not supported by the reference
- Make the room bigger, taller, wider, or more elegant than the original
- Invent new architectural features

The restored result must be restrained, realistic, faithful, and structurally believable.

Room dimensions, wall locations, window count, window positions, door positions, ceiling structure, and all spatial proportions must remain IDENTICAL to the reference image throughout all 8 images.

==================================================
WORKERS
==================================================

Workers must follow these rules:

Image 1: No workers present.

From Image 2 onward: Two workers must appear consistently.
Worker 1: Man wearing yellow work clothing.
Worker 2: Woman wearing black work clothing.

They must perform realistic professional renovation tasks.
They must be described inside all required image and video prompts.

If full worker rendering risks image quality, silhouettes, partial workers, or backlit workers are acceptable while preserving consistency.

Image 8: Workers may be minimal, subtle, distant, or absent if needed for the final completed reveal while preserving realism.

Workers must never appear randomly.
Workers must never perform the wrong type of task.
Workers must always match the material and repair stage shown.

==================================================
VIDEO TRANSITION RULES
==================================================

Generate 7 transition video prompts using frame-to-frame progression.

SPEED RULES:
- Transition 1: TIMELAPSE — workers move faster than real time while maintaining believable motion
- Transition 2: TIMELAPSE
- Transition 3: TIMELAPSE
- Transition 4: REAL TIME (1×) — workers move at natural real-time speed, tools operate at realistic construction pace, do NOT accelerate motion, do NOT fast-forward, do NOT compress time
- Transition 5: TIMELAPSE
- Transition 6: TIMELAPSE
- Transition 7: TIMELAPSE

REALISTIC CONSTRUCTION RULES:
- All visible renovation changes must be caused by workers performing physical tasks
- Objects must NEVER repair themselves
- Walls must not magically rebuild, floors must not transform automatically
- Windows must not appear suddenly, doors must not materialize, debris must not disappear instantly
- Every change must be shown as a physical action performed by workers using tools
- Workers must carry tools, move materials, install components, remove debris, repair structures step by step
- Renovation progress must occur gradually through realistic construction activity
- No magical transformation, no automatic repair, no instant reconstruction, no physics-breaking changes

NATURAL MOTION CONSTRAINTS:
- Movement must appear natural and physically believable
- Workers move at realistic human speed (except in timelapse where they move faster but believably)
- Construction tools behave normally
- Avoid teleporting objects, instant object replacement, structure morphing, impossible physics, automatic transformations
- All structural changes must occur progressively through visible worker activity

AUDIO RULES:
- Ambient construction sounds only (hammering, drilling, scraping, tool movement, dust and debris sounds)
- No music
- No dialogue
- No narration
- No cinematic camera movement
- No unnecessary creativity
- No scene reinterpretation

==================================================
CAMERA AND LIGHTING CONSTRAINTS
==================================================

The camera must remain fixed across all images and videos.

Do NOT change:
- camera position
- camera height
- camera angle
- camera orientation
- framing
- perspective
- composition

Lighting may evolve naturally through renovation progress.

Lighting rules:
- start damaged / low / rough where appropriate
- gradually improve as renovation progresses
- final image may use warm finished lighting
- lighting evolution must remain realistic and cinematic
- lighting must not change the room/building identity

==================================================
THE 8-STEP RENOVATION SEQUENCE
==================================================
${stepsSpec}

==================================================
WORKER TASK ACCURACY (REALISM REQUIREMENTS)
==================================================

All worker actions must reflect real construction practices.

Examples:
- epoxy flooring must show real epoxy installation methods
- tile flooring must show real tile installation methods
- painting must show real painting tools and techniques
- woodwork must show real carpentry
- window installation must use realistic procedures
- door installation must use realistic procedures
- ceiling work must use proper repair methods
- groundwork must use correct outdoor tools and methods

No fake task behavior.
No decorative nonsense.
No cinematic fantasy work.

In all videos, workers must perform tasks that accurately match the material and type of work shown in the scene. Each activity should reflect real-world installation or repair methods for that specific material. For example:
- If the surface is epoxy flooring, workers must perform epoxy flooring installation using appropriate tools and application methods.
- If the work involves tiles, workers must carry out tile installation using correct tools and procedures.
- If painting is shown, workers must use painting materials and realistic painting techniques.
- If woodwork is present, workers must perform carpentry using proper tools and methods.
Ensure all worker actions, tools, and processes reflect real-life professional practices. The installation or repair process must look authentic, material-accurate, and true to real-world construction workflows.

==================================================
IMAGE COMPLETION RULE
==================================================

For each image, all visible tasks — such as wall repair, ceilings, flooring, windows, doors, and other construction or renovation work — must be depicted as FULLY COMPLETED for that step. Workers and laborers should be visible performing their tasks realistically, with all appropriate tools, equipment, and materials present as required by the specific condition of that image. Each image prompt must reflect both the completed state of the work AND the presence of workers actively engaged, ensuring that the scene looks authentic, detailed, and true to real-world construction workflows.

==================================================
VIDEO TRANSITION SPECIFICATION
==================================================

Generate 7 transition video prompts using frame-to-frame progression. Each video must transition smoothly between frames while maintaining visual continuity, realistic motion, and composition consistency.

Frame-to-frame mapping must be explicitly followed as:
- Video 1 (TIMELAPSE): Frame 1 (Image 1) → Frame 2 (Image 2)
- Video 2 (TIMELAPSE): Frame 2 (Image 2) → Frame 3 (Image 3)
- Video 3 (TIMELAPSE): Frame 3 (Image 3) → Frame 4 (Image 4)
- Video 4 (REAL TIME 1×): Frame 4 (Image 4) → Frame 5 (Image 5)
- Video 5 (TIMELAPSE): Frame 5 (Image 5) → Frame 6 (Image 6)
- Video 6 (TIMELAPSE): Frame 6 (Image 6) → Frame 7 (Image 7)
- Video 7 (TIMELAPSE): Frame 7 (Image 7) → Frame 8 (Image 8)

SPEED RULES PER VIDEO:
- TIMELAPSE videos: Workers move faster than real time while maintaining believable motion. Construction progress is accelerated but physically realistic.
- REAL TIME video (Video 4 only): Workers move at natural human speed. Tools operate at realistic construction pace. Do NOT accelerate motion. Do NOT fast-forward. Do NOT compress time.

Each transition must:
- preserve the exact same composition
- preserve the exact same camera angle
- preserve the exact same layout
- preserve the exact same room/building identity
- preserve material realism
- preserve worker consistency
- show authentic real-world repair methods
- use ambient construction sound only
- avoid unnecessary motion
- avoid camera drift
- avoid redesign
- avoid structural morphing

REALISTIC CONSTRUCTION RULES FOR ALL VIDEOS:
- All visible renovation changes must be caused by workers performing physical tasks
- Objects must NEVER repair themselves
- Walls must not magically rebuild, floors must not transform automatically
- Windows must not appear suddenly, doors must not materialize, debris must not disappear instantly
- Every change must be shown as a physical action performed by workers using tools
- Workers must carry tools, move materials, install components, remove debris, repair structures step by step
- No magical transformation, no automatic repair, no instant reconstruction, no physics-breaking changes

The transition must feel like the same exact place evolving step by step, not a different place.

Each transition must be smooth and faithful to the reference images. Workers, tools, materials, and actions must all reflect real-life professional practices. The final video output should look highly realistic, coherent, and accurate to the original sequence of images.

==================================================
STRICT OUTPUT REQUIREMENTS
==================================================

Produce the following in exact JSON format:
1. A brief summary of the renovation plan (2-3 sentences)
2. Exactly 8 ultra-detailed image prompts — one prompt per image, fully expanded, paragraph form only
3. Exactly 7 ultra-detailed video transition prompts — one prompt per transition, fully expanded, paragraph form only

Keep all outputs faithful to the uploaded reference image.
Do not skip sections.
Do not shorten the prompts.
Do not replace detailed descriptions with summaries.

Respond ONLY in this exact JSON format:
{
  "summary": "...",
  "imagePrompts": ["prompt1", "prompt2", ..., "prompt8"],
  "videoPrompts": ["video1", "video2", ..., "video7"]
}`;

  const contentParts: any[] = [{ type: "text", text: "Generate the complete renovation plan based on this reference image. Follow ALL instructions exactly." }];

  if (cleanBase64) {
    contentParts.push({
      type: "image_url",
      image_url: { url: `data:image/png;base64,${cleanBase64}` }
    });
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: contentParts },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded.", errorCode: "RATE_LIMITED" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "Credits exhausted.", errorCode: "PAYMENT_REQUIRED" }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    throw new Error(`Plan generation error (${response.status}): ${errText.substring(0, 300)}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse plan response");

  const parsed = JSON.parse(jsonMatch[0]);

  if (!parsed.imagePrompts || parsed.imagePrompts.length !== 8) {
    throw new Error("Plan must contain exactly 8 image prompts");
  }
  if (!parsed.videoPrompts || parsed.videoPrompts.length !== 7) {
    throw new Error("Plan must contain exactly 7 video prompts");
  }

  return new Response(JSON.stringify({
    summary: parsed.summary,
    imagePrompts: parsed.imagePrompts,
    videoPrompts: parsed.videoPrompts,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

// ============================================================
// INTERIOR 8-STEP SPECIFICATION — UNCOMPRESSED, LITERAL, EXACT
// DO NOT SUMMARIZE. DO NOT COMPRESS. DO NOT REWRITE.
// ============================================================
const INTERIOR_STEPS = `
Image 1 — Abandoned Interior:
An abandoned interior room with cracked walls, debris scattered across the floor, broken ceiling sections, damaged flooring, empty hall, entirely destroyed interior condition, cracked window openings, some bushes and grass in rough condition, no furniture, no cabinets, no bed, no chair, no table, no décor items, no hanging lights, no fan, no AC, no planters, all lights turned off, completely empty room, no workers present. If a floor opening or hole is visible, it must be clearly shown with its exact position, shape, and scale.

Image 2 — Cleaning Phase:
CLEANING ONLY. Workers begin the cleaning phase using high-pressure water systems and industrial vacuum cleaners to remove dust, debris, and surface dirt. Bushes and grass are removed. CRITICAL: Structural cracks remain unchanged. Window openings remain without glass. Ceiling damage remains unchanged. Floor damage and any floor openings/holes remain in their EXACT original position, shape, and scale — unchanged. Walls remain cracked and unrepaired. The environment becomes fully cleaned but still structurally damaged. Do NOT repair any structural element. The room identity, dimensions, camera angle, composition, and layout remain exactly the same.

Image 3 — Wall Repair:
WALLS ONLY. Workers repair the walls using plaster and paint that match the original detected colors and materials. Only walls are repaired during this stage. CRITICAL: The ceiling remains damaged exactly as in Image 2. The floor remains damaged exactly as in Image 2, including any floor openings/holes in their exact original position. Windows remain without glass. Doors remain unrepaired. No other element changes. The room dimensions, proportions, camera angle, composition, and layout remain exactly the same.

Image 4 — Ceiling Repair:
CEILING ONLY. Workers repair the ceiling structure using matching materials and lighting conditions identified from the reference image. If the ceiling started heavily destroyed, show a believable repair proportional to the damage — do NOT jump from destroyed to pristine. Only the ceiling is repaired during this step. CRITICAL: Walls remain as repaired in Image 3. The floor remains damaged exactly as before, including any floor openings/holes in their exact original position, shape, and scale. Windows and doors remain unrepaired. The room dimensions, proportions, camera angle, composition, and layout remain exactly the same.

Image 5 — Windows and Doors Repair:
WINDOWS AND DOORS ONLY. Workers install or repair windows and doors while preserving the original architectural layout, design, scale, and positions detected in the image. No other structural redesign is allowed. CRITICAL: Walls remain as in Image 3. Ceiling remains as in Image 4. The floor remains damaged exactly as before, including any floor openings/holes in their exact original position, shape, and scale. The room dimensions, proportions, camera angle, composition, and layout remain exactly the same.

Image 6 — Flooring Installation:
FLOORING ONLY. Workers install new flooring matching the detected flooring material. This is the FIRST step where floor openings/holes may be structurally repaired. Show realistic floor preparation, structural filling, and material installation process. Only flooring changes during this step. CRITICAL: Walls remain as in Image 3. Ceiling remains as in Image 4. Windows and doors remain as in Image 5. All other architectural and spatial elements remain unchanged. The room dimensions, proportions, camera angle, composition, and layout remain exactly the same. Do NOT make the room appear bigger, more premium, or redesigned.

Image 7 — Furniture Restoration:
FURNITURE AND FINISHING ONLY. Furniture and décor items are restored or placed back only in their exact original detected positions. Workers perform realistic placement and finishing tasks. No new design language may be invented. No structural changes allowed. CRITICAL: All walls, ceiling, floor, windows, and doors remain exactly as completed in previous steps. The room dimensions, proportions, camera angle, composition, and layout remain exactly the same. The result must be restoration, not redesign.

Image 8 — Completed Interior:
FINAL POLISH ONLY. Fully renovated interior environment. Warm cinematic lighting. Internal lights turned on. Camera unchanged. Night atmosphere. Clean, polished final result. The same room identity, same dimensions, same proportions, same layout, same camera angle, and same composition must be preserved exactly. This must look like the same original room restored to good condition — NOT a redesigned luxury space.
`;

// ============================================================
// EXTERIOR 8-STEP SPECIFICATION — UNCOMPRESSED, LITERAL, EXACT
// DO NOT SUMMARIZE. DO NOT COMPRESS. DO NOT REWRITE.
// ============================================================
const EXTERIOR_STEPS = `
Image 1 — Abandoned Exterior:
An abandoned exterior building with cracked walls, overgrown vegetation, broken windows and doors, scattered debris, broken roof or ceiling sections, cracked window openings, rough bushes and grass conditions, and no hanging lights. No workers present.

Image 2 — Cleaning Phase:
Workers remove debris using high-pressure water cleaning and industrial vacuum tools. Bushes and plants are removed and grass is cut. Cracks remain visible. Window openings remain without glass. Doors are not yet installed. The building identity, camera angle, composition, and layout remain exactly the same.

Image 3 — Wall Repair:
Workers repair the exterior walls or facade using materials and colors identical to those detected from the original building. Only facade repair is allowed. No redesign is allowed. The building identity, camera angle, composition, and layout remain exactly the same.

Image 4 — Roof or Ceiling Repair:
Workers repair roof structures, porch ceilings, projections, overhangs, or similar upper architectural elements while preserving the original materials and colors. Only upper structure repair is allowed. The building identity, camera angle, composition, and layout remain exactly the same.

Image 5 — Windows and Doors Installation:
Workers install windows and doors using the original layout, scale, materials, and positions detected from the building. No redesign is allowed. The building identity, camera angle, composition, and layout remain exactly the same.

Image 6 — Groundwork:
Workers restore pavement, ground surfaces, landscaping, or grass areas in the exact original locations. Only groundwork changes during this step. The building identity, camera angle, composition, and layout remain exactly the same.

Image 7 — Finishing Touches:
Workers perform finishing work including paint touch-ups, plants, and exterior décor restoration in the original positions only. No stylistic redesign is allowed. The building identity, camera angle, composition, and layout remain exactly the same.

Image 8 — Completed Exterior:
Fully renovated exterior building. Warm lighting. Original architecture preserved. Night view. All lights turned on. Clean polished final result. The same building identity, same layout, same camera angle, and same composition must be preserved exactly.
`;
