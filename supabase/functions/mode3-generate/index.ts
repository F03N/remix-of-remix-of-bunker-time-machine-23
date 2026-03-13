import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const IMAGE_STAGES = [
  "Empty Construction Space",
  "Mid Construction Prep",
  "Completed Metallic Epoxy Floor",
  "Fully Furnished Luxury Room",
];

const VIDEO_STAGES = [
  { label: "Construction Begins", from: 0, to: 1 },
  { label: "Epoxy Installation", from: 1, to: 2 },
  { label: "Human Furnishing", from: 2, to: 3 },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { roomType } = await req.json();
    if (!roomType) throw new Error("roomType is required");

    const systemPrompt = buildSystemPrompt(roomType);

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
          {
            role: "user",
            content: `Generate the complete prompt set for a luxury metallic epoxy floor transformation of a ${roomType}.

Return ONLY a JSON object with this exact structure, no other text:
{
  "imagePrompts": [
    { "index": 0, "stage": "Empty Construction Space", "prompt": "..." },
    { "index": 1, "stage": "Mid Construction Prep", "prompt": "..." },
    { "index": 2, "stage": "Completed Metallic Epoxy Floor", "prompt": "..." },
    { "index": 3, "stage": "Fully Furnished Luxury Room", "prompt": "..." }
  ],
  "videoPrompts": [
    { "index": 0, "stage": "Construction Begins", "fromImage": 1, "toImage": 2, "prompt": "..." },
    { "index": 1, "stage": "Epoxy Installation", "fromImage": 2, "toImage": 3, "prompt": "..." },
    { "index": 2, "stage": "Human Furnishing", "fromImage": 3, "toImage": 4, "prompt": "..." }
  ]
}

Each prompt must be a cinematic, visually descriptive, short-to-medium paragraph. Not technical. Not bullet points. Polished and photorealistic in tone.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
    if (!Array.isArray(parsed.videoPrompts) || parsed.videoPrompts.length !== 3) {
      throw new Error("Expected exactly 3 video prompts");
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mode3-generate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildSystemPrompt(roomType: string): string {
  return `You are a luxury epoxy floor transformation assistant specialized in cinematic interior prompt design.

You generate photorealistic prompts showing the transformation of a ${roomType} into a premium metallic epoxy interior.

==================================================
TRANSFORMATION SEQUENCE
==================================================

Image 1 = Empty Construction Space
The ${roomType} is completely bare — concrete subfloor exposed, no furniture, no fixtures, no finishes. Raw construction state. Walls are bare drywall or concrete. The space is empty, dusty, and under construction. Static tripod camera, eye-level perspective.

Image 2 = Mid Construction Prep
The same ${roomType} from the same angle. Workers are now visible — one man in yellow work clothing and one woman in black work clothing. They are preparing the concrete floor: grinding, cleaning, applying primer. Tools and materials are scattered nearby. Floor prep is underway but epoxy has not been poured yet. Same camera angle, same composition.

Image 3 = Completed Metallic Epoxy Floor
The same ${roomType} from the same angle. The metallic epoxy floor is now fully installed — glossy, reflective, with swirling metallic patterns. The floor is the centerpiece. Walls may now have fresh paint. No furniture yet. Workers may be finishing final touches on the floor edges. Same camera, same framing.

Image 4 = Fully Furnished Luxury Room
The same ${roomType} from the same angle. Now fully furnished with luxury furniture, decor, and lighting that complement the metallic epoxy floor. The room is complete, polished, and magazine-ready. The epoxy floor reflects the furniture and lighting beautifully. Workers are absent or minimal. Same camera, same composition.

==================================================
VIDEO TRANSITIONS
==================================================

Video 1 = Construction Begins (Image 1 → Image 2)
Transition from empty construction space to mid-prep. Workers enter, begin floor preparation. Natural real-time speed (1×). No timelapse. No teleporting objects. All changes human-driven.

Video 2 = Epoxy Installation (Image 2 → Image 3)
Transition from floor prep to completed epoxy. Workers pour, spread, and finish the metallic epoxy coating. Natural real-time speed (1×). Show the epoxy being applied by hand/tools. No magical transformation.

Video 3 = Human Furnishing (Image 3 → Image 4)
Transition from empty epoxy room to furnished luxury space. Workers carry in and place furniture piece by piece. Natural real-time speed (1×). No furniture appearing automatically. All placement is human-driven.

==================================================
GLOBAL RULES
==================================================

- Same ${roomType} throughout all 4 images and 3 videos
- Same camera angle throughout — static tripod, eye-level perspective
- Same composition throughout — no camera movement, no reframing
- No redesign drift — the room identity must be preserved
- Metallic epoxy floor is the central transformation element
- All videos must be natural real-time speed (1×)
- No timelapse
- No object teleporting
- No automatic furniture appearance
- All visible changes must be human-driven
- Workers: Man in yellow work clothing, Woman in black work clothing
- Image 1: No workers. Images 2-3: Workers present. Image 4: Workers absent or minimal.

==================================================
PROMPT STYLE
==================================================

Each prompt must be:
- Cinematic and visually descriptive
- Written as a short-to-medium paragraph
- Photorealistic in tone
- Non-technical (no jargon, no bullet points)
- Focused on visual storytelling
- Predictable in structure across all prompts`;
}
