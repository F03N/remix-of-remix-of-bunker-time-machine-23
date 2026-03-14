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

    const { referenceImageBase64 } = await req.json();
    if (!referenceImageBase64) throw new Error("referenceImageBase64 is required");

    const systemPrompt = buildSystemPrompt();

    const userContent: any[] = [
      {
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${referenceImageBase64}` },
      },
      {
        type: "text",
        text: `Analyze this reference image carefully. This is IMAGE 4 — the final polished result of a cinematic reverse-restoration / reverse-construction sequence.

Based on this image, generate exactly 4 IMAGE prompts and 4 VIDEO prompts following the master prompt structure.

Return ONLY a JSON object with this exact structure, no other text:
{
  "imagePrompts": [
    { "index": 0, "title": "Image 1", "prompt": "..." },
    { "index": 1, "title": "Image 2", "prompt": "..." },
    { "index": 2, "title": "Image 3", "prompt": "..." },
    { "index": 3, "title": "Image 4", "prompt": "..." }
  ],
  "videoPrompts": [
    { "index": 0, "title": "Video 1", "prompt": "..." },
    { "index": 1, "title": "Video 2", "prompt": "..." },
    { "index": 2, "title": "Video 3", "prompt": "..." },
    { "index": 3, "title": "Video 4", "prompt": "..." }
  ]
}

Each prompt must follow the exact format:
SCENE LOCK: [camera position, framing, lens feel, height description]
STAGE: [stage description]
DETAILS: [cinematic visual details paragraph]
NEGATIVE: [things to avoid]`,
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
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
        return new Response(JSON.stringify({ error: "Payment required. Please add credits.", errorCode: "PAYMENT_REQUIRED" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`API error (${response.status}): ${errText.substring(0, 300)}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse prompt response");

    const parsed = JSON.parse(jsonMatch[0]);

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

function buildSystemPrompt(): string {
  return `You are a cinematic reverse-restoration prompt architect.

You receive a FINAL reference image (IMAGE 4) and must generate a complete set of prompts that describe the reverse-construction / reverse-restoration journey leading to that final image.

==================================================
IMAGE SEQUENCE (4 IMAGES)
==================================================

IMAGE 1 — Before / Raw / Pre-build State
The scene in its original raw condition before any construction or restoration began. Untouched land, ruins, demolition state, or bare foundation. No construction activity yet. Same camera position and framing as the final image.

IMAGE 2 — Active Excavation / Active Construction / Mid-build State
The same scene during active construction. Excavation equipment, trenches, scaffolding, workers, raw materials, concrete forms, rebar, dust, machinery. The site is messy, realistic, and mid-process. Same camera position and framing.

IMAGE 3 — Finished Clean Shell / Completed but Unstaged State
The construction is complete but the space is not yet decorated or staged. Clean walls, finished floors, installed windows and doors, but no furniture, no decor, no landscaping details. The shell is done. Same camera position and framing.

IMAGE 4 — Final Polished Reference-matched State
This MUST match the uploaded reference image exactly. Fully finished, decorated, staged, landscaped, and polished. This is the hero shot. Same camera position and framing.

==================================================
VIDEO SEQUENCE (4 VIDEOS)
==================================================

VIDEO 1 — IMAGE 1 → IMAGE 2
Cinematic transition from raw pre-build state to active construction. Show the beginning of excavation, machinery arriving, workers starting. Natural real-time speed. No timelapse.

VIDEO 2 — IMAGE 2 → IMAGE 3
Cinematic transition from active construction to finished shell. Show construction completing, scaffolding removed, surfaces cleaned. Natural real-time speed.

VIDEO 3 — IMAGE 3 → IMAGE 4
Cinematic transition from clean shell to final polished state. Show staging, furniture placement, landscaping, finishing touches. Natural real-time speed.

VIDEO 4 — Final Hero Reveal starting from IMAGE 4
A cinematic hero reveal shot. Starting from IMAGE 4, show a slow dramatic reveal — perhaps a gentle camera push-in, a light sweep, or atmospheric shift that showcases the final result in its full glory. This is the money shot.

==================================================
GLOBAL CONTINUITY RULES
==================================================

- Same camera position throughout all images and videos
- Same framing throughout
- Same lens feel throughout
- Same camera height throughout
- Same geometry throughout
- Same landmarks throughout
- Same environment continuity throughout
- Same composition character throughout
- Preserve site clutter realism in construction stages
- Preserve machinery realism
- Preserve worker density realism
- Preserve excavation realism
- Do NOT beautify construction stages
- Do NOT simplify the site
- Do NOT recenter naturally off-center scenes
- Do NOT idealize trench/pit geometry

==================================================
PROMPT FORMAT
==================================================

Every prompt (image and video) must follow this exact structure:

SCENE LOCK: [describe camera position, framing, lens feel, camera height]
STAGE: [describe the stage in one line]
DETAILS: [cinematic, visually descriptive paragraph — photorealistic tone, no jargon, no bullet points]
NEGATIVE: [things to explicitly avoid in generation]

==================================================
OUTPUT RULES
==================================================

- 4 image prompts first, then 4 video prompts
- Each prompt must be a complete, self-contained description
- Photorealistic, cinematic tone
- No technical jargon
- No bullet points inside prompts
- Strong visual storytelling`;
}