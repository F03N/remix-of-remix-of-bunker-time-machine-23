import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CONTINUITY_INSTRUCTION = `CRITICAL REQUIREMENTS:
- Modify THIS EXACT IMAGE. Do NOT redesign or recreate the scene.
- Preserve ALL geometry exactly: roof shape, walkway, slope, fence layout, building footprint, bunker position.
- Preserve the EXACT camera position, angle, height, lens, and framing.
- Preserve ALL landmarks: trees, fence corners, gates, lawn edges, structures.
- Do NOT recenter the composition.
- Do NOT replace the building or alter the property.
- Do NOT alter roof type, walkway shape, fence layout, or vegetation placement.
- ONLY change what the stage-specific prompt describes (construction progress, staging, lighting).`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase config missing");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json();
    const { prompt, imageIndex, projectName, sourceImageBase64 } = body;

    if (!prompt) throw new Error("prompt is required");
    if (imageIndex === undefined) throw new Error("imageIndex is required");
    if (!sourceImageBase64) throw new Error("sourceImageBase64 is required — every image must chain from a source");

    const cleanBase64 = sourceImageBase64.includes(",") ? sourceImageBase64.split(",")[1] : sourceImageBase64;

    // Build image-to-image editing instruction
    let stageInstruction: string;

    if (imageIndex === 0) {
      stageInstruction = `[SOURCE: uploaded reference image — the FINAL polished result]
Transform this finished scene BACKWARDS to show the raw BEFORE state (pre-construction).
${CONTINUITY_INSTRUCTION}
Remove all construction, staging, and finishing. Show the raw untouched property before any work began.

${prompt}`;
    } else if (imageIndex === 1) {
      stageInstruction = `[SOURCE: Image 1 — raw before state]
Transform this image FORWARD to show active excavation and construction in progress.
${CONTINUITY_INSTRUCTION}
Add construction activity on the same exact property. Do not change the property itself.

${prompt}`;
    } else if (imageIndex === 2) {
      stageInstruction = `[SOURCE: Image 2 — active construction]
Transform this image FORWARD to show the finished clean shell, construction complete but unstaged.
${CONTINUITY_INSTRUCTION}
Complete the construction, clean the site, but do not add final luxury staging.

${prompt}`;
    } else {
      stageInstruction = `[SOURCE: Image 3 — finished clean shell]
Transform this image FORWARD to show the final polished hero result with luxury staging and lighting.
${CONTINUITY_INSTRUCTION}
Add final staging, premium lighting, and polished finish. This is the viral hero frame.

${prompt}`;
    }

    const contentParts = [
      {
        type: "image_url",
        image_url: { url: `data:image/png;base64,${cleanBase64}` },
      },
      {
        type: "text",
        text: stageInstruction,
      },
    ];

    console.log(`Mode4 image gen: index=${imageIndex}, sourceLen=${cleanBase64.length}`);

    let generatedImage: string | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-pro-image-preview",
            messages: [{ role: "user", content: contentParts }],
            modalities: ["image", "text"],
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
          console.error(`Attempt ${attempt + 1} failed:`, response.status, errText.substring(0, 200));
          if (attempt < 2) { await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); continue; }
          throw new Error(`Image generation failed (${response.status}): ${errText.substring(0, 300)}`);
        }

        const data = await response.json();
        generatedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (generatedImage) break;

        console.warn(`Attempt ${attempt + 1}: No image in response`);
        if (attempt < 2) await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
      } catch (err) {
        if (attempt < 2) { await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); continue; }
        throw err;
      }
    }

    if (!generatedImage) throw new Error("No image generated after 3 attempts");

    // Upload to storage
    const base64Data = generatedImage.includes(",") ? generatedImage.split(",")[1] : generatedImage;
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const safeName = (projectName || "mode4").replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = `${safeName}/mode4/image_${imageIndex + 1}_${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("bunker-assets")
      .upload(fileName, imageBytes, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ imageUrl: generatedImage, imageBase64: base64Data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: publicUrl } = supabase.storage.from("bunker-assets").getPublicUrl(fileName);

    return new Response(JSON.stringify({
      imageUrl: publicUrl.publicUrl,
      imageBase64: base64Data,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("mode4-imagen error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
