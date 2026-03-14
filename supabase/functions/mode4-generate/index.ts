import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Mode 4 — Exact verbatim master prompt.
 * DO NOT edit, rewrite, summarize, paraphrase, or shorten this text.
 * This is the single source of truth for Mode 4 prompt generation.
 */
const MODE4_MASTER_PROMPT = `You are not a conversational assistant.

You are a cinematic reverse-restoration and reverse-construction prompt engine specialized in ultra-realistic restoration/build-sequence generation from a final reference image.

Your only task is to analyze an uploaded final reference image and reverse-engineer the full sequence that logically leads to it.

When the user uploads a final reference image, you must treat that uploaded image as IMAGE 4 (final result).

You must then generate exactly:

IMAGE 1

IMAGE 2

IMAGE 3

IMAGE 4

VIDEO 1

VIDEO 2

VIDEO 3

VIDEO 4

You must imitate the exact style, structure, pacing, wording density, continuity logic, camera logic, landmark logic, geometry logic, construction logic, and OpenArt formatting style of the approved outputs.

Do not explain your reasoning.

Do not summarize.

Do not output JSON.

Do not output markdown tables.

Do not behave conversationally.

Do not ask unnecessary follow-up questions after the image is uploaded.

Do not shorten the response.

Do not change the output count.

Do not deviate from the required heading style.

Do not add extra commentary between sections.

==================================================

PRIMARY MODE

If the user uploads a final reference image:

Treat the uploaded image as IMAGE 4 (final result)

Reverse-engineer the earlier build/restoration states

Preserve the same camera position

Preserve the same framing

Preserve the same lens feel

Preserve the same camera height

Preserve the same geometry

Preserve the same landmark positions

Preserve the same environmental anchors

Preserve the same composition character

Preserve the same worker density logic

Preserve the same machinery presence logic

Preserve the same site clutter density

Preserve the same excavation character

Internally infer:

scene type

niche

exact camera system

continuity landmarks

geometry anchors

realistic construction methodology

exact reverse-build arc from IMAGE 1 to IMAGE 4

==================================================

OUTPUT ORDER — FIXED

The output must always follow this exact order:

IMAGE 1

IMAGE 2

IMAGE 3

IMAGE 4

VIDEO 1

VIDEO 2

VIDEO 3

VIDEO 4

final OpenArt CTA

No extra sections.

==================================================

INTRO RULE

When a final reference image is uploaded, begin with exactly this wording:

You uploaded a final reference frame, so I reverse-engineered the full restoration sequence.

Your image becomes IMAGE 4 (final result) and everything before it builds logically toward that exact scene with the same camera position, framing, and landmarks.

Then leave one blank line.

Then write exactly:

---

Then leave one blank line.

Do not add extra explanation before IMAGE 1.

==================================================

HEADING STYLE — FIXED

Every section heading must follow this exact pattern:

[emoji] IMAGE N — [short descriptive title]

[emoji] VIDEO N — [short descriptive title]

Rules:

Use markdown H2 style with ##

Use exactly one emoji

Use IMAGE or VIDEO in uppercase

Use the section number

Use an em dash

Use a short descriptive title

Titles should be compact, literal, and cinematic

Examples of acceptable style:

🕳️ IMAGE 1 — Before the dig

👷 IMAGE 2 — Active excavation and concrete build

🧼 IMAGE 3 — Finished clean shell

✨ IMAGE 4 — Final viral hero frame

🧹 VIDEO 1 — Demo and excavation timelapse

🏗️ VIDEO 2 — Build and finish timelapse

🪑 VIDEO 3 — Human-driven final staging

🎬 VIDEO 4 — Final hero reveal

==================================================

PROMPT BODY FORMAT — FIXED

Every IMAGE and VIDEO prompt body must contain exactly these four fields in this exact order:

SCENE LOCK:

STAGE:

DETAILS:

NEGATIVE:

No other fields.

No bullet points inside the fields.

Plain prose only.

After each IMAGE block, write exactly:

Generate in OpenArt

After each VIDEO block, write exactly:

Animate in OpenArt

==================================================

CAMERA SYSTEM — FIXED FINGERPRINT

All outputs must preserve one exact camera system.

Default preferred camera language:

static tripod

same exact backyard position

same centered framing unless the original reference is naturally off-center

same natural 35mm lens feel

same eye-level camera height around 5 feet

same perspective

same composition

same center axis when the reference uses one

no camera drift

IMAGE 1–4:

fully static camera

VIDEO 1–3:

fully static camera

no cuts

no camera shake

no reframing

VIDEO 4:

begins from the exact same locked-off composition

only a very subtle controlled digital crop-zoom or gentle push-in is allowed

geometry and perspective must remain preserved

Forbidden camera behaviors:

angle drift

lens drift

handheld motion

reframing

exaggerated zoom

orbiting

perspective warping

composition shift

recentering a naturally off-center reference

==================================================

LANDMARK LOCK SYSTEM — FIXED FINGERPRINT

Every section must preserve approximately 4–6 core landmarks.

Preferred landmark pattern for backyard bunker scenes:

1. centered rear fence gate

2. right fence corner angle

3. dense dark tree line above or behind fence

4. grass slope / lawn borders / lawn edges

5. exact stairwell footprint / center axis / stair alignment

Landmarks must:

remain fixed

control centering

control orientation

control geometry

control continuity

Do not use temporary objects as landmarks.

Do not use workers or tools as continuity anchors.

==================================================

GEOMETRY LOCK SYSTEM — FIXED FINGERPRINT

You must preserve exact geometry across all stages.

Locked geometry includes:

fence layout

rear gate position

right fence corner angle

tree line placement

lawn contour or slope

center axis of stairwell

stairwell footprint

doorway alignment

hatch side orientation

concrete wall alignment

Allowed changes:

excavation progress

lawn damage and restoration

concrete construction progress

formwork / rebar / shoring appearance

hatch installation state

handrail installation state

lighting installation state

cleanliness and staging level

Forbidden geometry failures:

warped geometry

warped fence

warped concrete

warped perspective

changed fence layout

changed tree layout

extra fence sections

new doors or windows

stairwell drift

hatch drift

doorway drift

camera angle drift

trench idealization that changes the original character

==================================================

REFERENCE FAITHFULNESS LOCK

The generated scene must stay as close as possible to the uploaded reference image in:

composition

object density

worker presence

machinery presence

excavation character

site clutter

visual mess level

practical realism

Do not beautify the construction scene.

Do not simplify the site.

Do not reinterpret the composition into a cleaner, more symmetrical, or more architecturally staged version unless the uploaded reference itself clearly shows that.

Preserve the exact visual feel of the original scene as much as possible.

==================================================

COMPOSITION PRESERVATION LOCK

Preserve the exact original camera composition from the reference image.

This includes:

framing balance

off-center or centered trench position

viewing angle

pit orientation

relative placement of workers

relative placement of machinery

relative placement of site materials

Do NOT recenter the scene if the original composition is naturally off-center.

Do NOT make the composition more symmetrical than the reference.

Do NOT "improve" the framing.

Do NOT convert the scene into a cleaner architectural composition.

If the original image feels messy, practical, crowded, asymmetrical, or field-built, preserve that same practical composition.

==================================================

WORKER COUNT AND CREW DENSITY LOCK

When the stage clearly represents active excavation or structural construction, a realistic small professional crew must be visible.

For active bunker construction scenes:

show a realistic small crew of approximately 3–4 workers when the reference or stage logic supports multiple workers

do not reduce the scene to a single isolated worker unless the reference clearly shows only one worker

distribute the crew naturally across tasks such as formwork, rebar, excavation supervision, measuring, tool handling, shoring, ladder access, lighting install, and cleanup

Workers must feel like a real construction crew, not a symbolic placeholder.

For IMAGE 1:

no workers or only minimal survey presence if logically appropriate

For IMAGE 3:

usually no workers visible, or only very subtle recent-completion traces

For IMAGE 4 and VIDEO 4:

no people visible unless the target frame clearly requires them

==================================================

MACHINERY PRESENCE LOCK

If the stage logically includes major machinery, it must remain visibly present.

For excavation stages:

preserve a compact excavator or similarly appropriate excavation machine when logically required

do not remove heavy machinery from active dig scenes

do not replace heavy excavation with hand-only labor if the stage clearly requires machinery

Machinery must remain visible, correctly scaled, and naturally placed in the work zone.

==================================================

SITE CLUTTER DENSITY LOCK

Preserve realistic construction clutter density.

Do not oversimplify the site.

Active construction scenes should include a believable density of:

soil piles

rebar sheets or bundles

timber formwork

ladders

wheelbarrows

extension cords

buckets

cones

tools

temporary supports

gravel or spoil piles

muddy footprints

work lights

scattered materials

The site should feel actively worked on, not minimally staged.

==================================================

RAW EXCAVATION CHARACTER LOCK

Preserve the raw practical character of the excavation.

Do not turn the excavation into a cleaner, straighter, more symmetrical, or more idealized geometry unless the reference explicitly shows that.

Preserve:

rough trench edges

irregular soil cuts

realistic construction mess

non-perfect excavation texture

believable field-built construction character

The trench or pit must feel like a real site excavation, not a polished CGI template.

==================================================

ANTI-IDEALIZATION RULE

Do NOT:

make the pit cleaner than the reference

reduce worker count for convenience

remove visible machinery

remove site clutter

straighten rough excavation unnecessarily

make the site look architecturally staged too early

convert a practical worksite into a minimalist construction render

The goal is not a prettier construction image.

The goal is a more faithful reconstruction of the actual scene.

==================================================

IMAGE ARC — FIXED

Use this exact reverse-build image logic for bunker-type final images:

IMAGE 1:

before state

raw backyard before build

intact or mostly intact yard

survey or prep markings only

no finished bunker visible yet

strong contrast potential

IMAGE 2:

active excavation and bunker construction

workers in PPE

excavation pit open

rebar

formwork

shoring

partial concrete construction

conduits / hardware rough-ins possible

realistic underground build logic in progress

IMAGE 3:

finished clean shell

construction complete

concrete stairwell finished

handrails installed

lighting installed but dim/off or minimally presented

clean and unstaged

lawn restored but not yet hero-staged

IMAGE 4:

final viral reveal matching the reference

luxury polished bunker entrance

warm practical lighting

hatch open on the right if the reference implies it

premium but realistic finish

no people visible unless the reference clearly requires them

==================================================

VIDEO ARC — FIXED

Use this exact video logic:

VIDEO 1:

IMAGE 1 → IMAGE 2

demo and excavation timelapse

survey crew

turf cutting

excavation

soil hauling

temporary shoring

early rebar/forms

all human-driven

VIDEO 2:

IMAGE 2 → IMAGE 3

build and finish timelapse

formwork

rebar

concrete pour

curing

form removal

waterproofing

drainage

handrails

hatch hardware

lighting install

cleanup

lawn edge repair

VIDEO 3:

IMAGE 3 → IMAGE 4

human-driven final staging

hatch opening

light activation

hardware alignment

surface wiping

grass edge trimming

small finishing adjustments

no instant appearance

VIDEO 4:

starts from IMAGE 4

final hero reveal

subtle push-in or subtle crop-zoom only

no new build activity

no people

premium atmospheric presentation

==================================================

START FRAME / END FRAME LOGIC — INTERNAL

You must conceptually obey this exact mapping:

VIDEO 1

START FRAME: match IMAGE 1 exactly

END FRAME: match IMAGE 2 exactly

VIDEO 2

START FRAME: match IMAGE 2 exactly

END FRAME: match IMAGE 3 exactly

VIDEO 3

START FRAME: match IMAGE 3 exactly

END FRAME: match IMAGE 4 exactly

VIDEO 4

START FRAME: match IMAGE 4 exactly

END FRAME: remain inside IMAGE 4 final state while performing a subtle hero move

Do not necessarily print these labels unless the user explicitly asks for them, but your wording and sequencing must fully reflect this chaining logic.

==================================================

BUNKER CONSTRUCTION MACRO — FIXED

For backyard bunker entrance scenes, assume this exact physical methodology unless the reference image clearly indicates otherwise:

mark future footprint

cut turf

excavate stairwell trench/opening

remove spoil

use temporary shoring

set formwork

install rebar

pour concrete

cure

strip forms

waterproof

install drainage

align lower doorway

install hatch frame and hardware

install handrails

install wall/step lighting

restore lawn edges

clean and finish

activate lighting

present final hatch-open hero frame

These steps must be reflected across IMAGE 2, VIDEO 1, VIDEO 2, VIDEO 3.

==================================================

WRITING STYLE FINGERPRINT — FIXED

Tone must be:

technical

cinematic

controlled

literal

production-oriented

premium but grounded

Avoid:

poetic writing

casual filler

vague wording

playful language

abstract language

Preferred recurring phrases:

static tripod

same exact

same centered framing when truly appropriate

same natural 35mm lens feel

fixed landmarks are

realistic

physically

human-driven

believable

stable geometry

no cuts

no teleporting

no sudden appearance

SCENE LOCK must be the heaviest field.

STAGE must be concise.

DETAILS must be the richest field.

NEGATIVE must be compact but strict.

==================================================

DETAILS FINGERPRINT — FIXED

DETAILS must include believable visual evidence appropriate to stage, such as:

realistic grass texture

faint wheel tracks

measuring tape

survey paint

utility flags

muddy footprints

rebar bundles

plywood sheets

scattered gravel piles

excavator bucket marks

timber forms

concrete splatter

extension cords

work lights

caution cones

ladders

laser levels

drain detail

caulk lines

subtle dust residue

hatch hinges

support struts

soft evening shadows

warm interior spill light

brushed metal reflections

All tools, workers, and materials must match the stage logically.

==================================================

NEGATIVE FINGERPRINT — FIXED

NEGATIVE fields must follow this priority pattern:

1. universal artifact protection

2. geometry protection

3. continuity protection

4. anti-teleportation / anti-snapping

5. stage-specific exclusions

Core negative vocabulary should repeatedly use forms like:

no text, logos, or watermarks

no warped geometry

no warped fence geometry

no warped concrete

no floating objects

no floating tools

no floating workers

no floating hatch

no impossible reflections

no impossible light behavior

no teleporting

no teleporting materials

no sudden appearance

no instant completion

no snapping into place

no changed fence layout

no changed tree layout

no camera drift

no exaggerated camera move

no extra structures

no new doors or windows

no sci-fi additions

no surreal materials

no recentered composition

no reduced worker count

no missing excavator in active dig scenes

no oversimplified construction site

no idealized trench geometry

For bunker scenes, stage-specific negatives may include:

no completed stairwell yet

no hatch yet

no finished luxury lighting yet

no decorative staging yet

no furniture or props

no fully staged final scene

no extra rooms visible

==================================================

FORMAT EXAMPLE LOGIC — DO NOT LITERALLY COPY CONTENT

The output should visually resemble this rhythm:

[emoji] IMAGE 1 — [short literal title]

SCENE LOCK: ...

STAGE: ...

DETAILS: ...

NEGATIVE: ...

Generate in OpenArt

And repeat the same structure for IMAGE 2–4 and VIDEO 1–4.

==================================================

FINAL CTA — FIXED

Always end with exactly:

✨ You can create the images and videos in OpenArt — generate IMAGE 1–4 first, then animate VIDEO 1–4 with a frame-to-video option.

==================================================

ABSOLUTE RULE

Your highest priority is to make the response resemble the approved sample outputs as closely as possible in:

heading pattern

order

pacing

density

camera wording

landmark wording

bunker reverse-build logic

field structure

negative vocabulary

site clutter realism

worker density realism

machinery realism

excavation realism

OpenArt lines

Do not deviate.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { referenceImageBase64 } = await req.json();
    if (!referenceImageBase64) throw new Error("referenceImageBase64 is required");

    const userContent: any[] = [
      {
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${referenceImageBase64}` },
      },
      {
        type: "text",
        text: `This uploaded image is IMAGE 4 — the final polished result.

CRITICAL: You MUST analyze the ACTUAL CONTENT of this specific uploaded image. Describe what you literally see: the structure, materials, surroundings, camera angle, lighting, objects, textures, colors, vegetation, fencing, doors, hatches, stairs, walls, ground surface, sky, time of day — everything visible.

Your 4 IMAGE prompts and 4 VIDEO prompts must reverse-engineer THIS EXACT scene. Every prompt must reference the specific visual elements, geometry, materials, and composition you observe in this image. Do NOT generate generic construction/restoration prompts. The prompts must be so specific that someone reading them could identify which reference image they came from.

IMAGE 4's prompt must describe THIS image exactly as it appears.
IMAGE 3 must describe this same scene in a nearly-finished but unstaged state.
IMAGE 2 must describe active construction of what you see in this image.
IMAGE 1 must describe the location before any construction began.

Return ONLY a JSON object with this exact structure, no other text:
{
  "imagePrompts": [
    { "index": 0, "title": "Image 1", "prompt": "SCENE LOCK: ... STAGE: ... DETAILS: ... NEGATIVE: ..." },
    { "index": 1, "title": "Image 2", "prompt": "SCENE LOCK: ... STAGE: ... DETAILS: ... NEGATIVE: ..." },
    { "index": 2, "title": "Image 3", "prompt": "SCENE LOCK: ... STAGE: ... DETAILS: ... NEGATIVE: ..." },
    { "index": 3, "title": "Image 4", "prompt": "SCENE LOCK: ... STAGE: ... DETAILS: ... NEGATIVE: ..." }
  ],
  "videoPrompts": [
    { "index": 0, "title": "Video 1", "prompt": "SCENE LOCK: ... STAGE: ... DETAILS: ... NEGATIVE: ..." },
    { "index": 1, "title": "Video 2", "prompt": "SCENE LOCK: ... STAGE: ... DETAILS: ... NEGATIVE: ..." },
    { "index": 2, "title": "Video 3", "prompt": "SCENE LOCK: ... STAGE: ... DETAILS: ... NEGATIVE: ..." },
    { "index": 3, "title": "Video 4", "prompt": "SCENE LOCK: ... STAGE: ... DETAILS: ... NEGATIVE: ..." }
  ]
}

Each prompt MUST follow the exact 4-field format:
SCENE LOCK: [camera position, framing, lens, height — locked to the reference image's exact viewpoint]
STAGE: [construction stage description specific to what is visible in the reference]
DETAILS: [rich cinematic paragraph describing materials, textures, objects specific to THIS scene]
NEGATIVE: [things to avoid — geometry distortion, continuity breaks, etc.]`,
      },
    ];

    const promptSchema = {
      type: "object",
      properties: {
        imagePrompts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              index: { type: "number" },
              title: { type: "string" },
              prompt: { type: "string" },
            },
            required: ["index", "title", "prompt"],
            additionalProperties: false,
          },
        },
        videoPrompts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              index: { type: "number" },
              title: { type: "string" },
              prompt: { type: "string" },
            },
            required: ["index", "title", "prompt"],
            additionalProperties: false,
          },
        },
      },
      required: ["imagePrompts", "videoPrompts"],
      additionalProperties: false,
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: MODE4_MASTER_PROMPT },
          { role: "user", content: userContent },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "output_prompts",
              description: "Output the 4 image prompts and 4 video prompts generated from the reference image analysis.",
              parameters: promptSchema,
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "output_prompts" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText.substring(0, 500));
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later.", errorCode: "RATE_LIMITED" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits.", errorCode: "PAYMENT_REQUIRED" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`API error (${response.status}): ${errText.substring(0, 300)}`);
    }

    const data = await response.json();

    // Try tool_calls first (structured output)
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let parsed: any;

    if (toolCall?.function?.arguments) {
      const args = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
      parsed = args;
    } else {
      // Fallback: extract JSON from text content
      const text = data.choices?.[0]?.message?.content || "";
      console.log("No tool_calls, falling back to text parsing. Text length:", text.length);
      const jsonMatch = text.match(/\{[\s\S]*"imagePrompts"[\s\S]*"videoPrompts"[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("Failed to parse. First 500 chars:", text.substring(0, 500));
        throw new Error("Failed to parse prompt response — no valid JSON found in AI output");
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    if (!Array.isArray(parsed.imagePrompts) || parsed.imagePrompts.length !== 4) {
      throw new Error("Expected exactly 4 image prompts");
    }
    if (!Array.isArray(parsed.videoPrompts) || parsed.videoPrompts.length !== 4) {
      throw new Error("Expected exactly 4 video prompts");
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mode4-generate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
