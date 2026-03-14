import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const { prompt, imageIndex, projectName, referenceImageBase64, previousImageBase64 } = body;

    if (!prompt) throw new Error("prompt is required");
    if (imageIndex === undefined) throw new Error("imageIndex is required");

    // Build content parts
    const contentParts: any[] = [];

    // For IMAGE 4, use the reference image for maximum faithfulness
    if (imageIndex === 3 && referenceImageBase64) {
      const cleanRef = referenceImageBase64.includes(",") ? referenceImageBase64.split(",")[1] : referenceImageBase64;
      contentParts.push({
        type: "image_url",
        image_url: { url: `data:image/png;base64,${cleanRef}` },
      });
      contentParts.push({
        type: "text",
        text: `[REFERENCE IMAGE — This is the uploaded final reference. Generate IMAGE 4 to match this reference as closely as possible. Apply the prompt details below to produce the final polished hero frame matching this exact composition, lighting, and finish.]\n\n${prompt}`,
      });
    } else if (previousImageBase64) {
      // For IMAGE 2 and IMAGE 3, chain from previous image for continuity
      const cleanBase64 = previousImageBase64.includes(",") ? previousImageBase64.split(",")[1] : previousImageBase64;
      contentParts.push({
        type: "image_url",
        image_url: { url: `data:image/png;base64,${cleanBase64}` },
      });
      contentParts.push({
        type: "text",
        text: `[PREVIOUS STAGE — This is Image ${imageIndex} showing the previous stage. Generate Image ${imageIndex + 1} as the NEXT stage with the same camera position, same framing, same geometry, same landmarks. Only apply the changes described in the prompt below.]\n\n${prompt}`,
      });
    } else {
      // IMAGE 1 — no previous reference needed
      contentParts.push({
        type: "text",
        text: prompt,
      });
    }

    console.log(`Mode4 image generation: index=${imageIndex}, hasPrevRef=${!!previousImageBase64}, hasRef=${!!referenceImageBase64}`);

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
            return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later.", errorCode: "RATE_LIMITED" }), {
              status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          if (response.status === 402) {
            return new Response(JSON.stringify({ error: "Credits exhausted. Please add credits.", errorCode: "PAYMENT_REQUIRED" }), {
              status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          console.error(`Attempt ${attempt + 1} failed:`, response.status, errText.substring(0, 200));
          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
            continue;
          }
          throw new Error(`Image generation failed (${response.status}): ${errText.substring(0, 300)}`);
        }

        const data = await response.json();
        generatedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (generatedImage) break;

        console.warn(`Attempt ${attempt + 1}: No image in response`);
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
        }
      } catch (err) {
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }
        throw err;
      }
    }

    if (!generatedImage) {
      throw new Error("No image generated after 3 attempts");
    }

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
      return new Response(JSON.stringify({
        imageUrl: generatedImage,
        imageBase64: base64Data,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: publicUrl } = supabase.storage.from("bunker-assets").getPublicUrl(fileName);

    return new Response(JSON.stringify({
      imageUrl: publicUrl.publicUrl,
      imageBase64: base64Data,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("mode4-imagen error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
