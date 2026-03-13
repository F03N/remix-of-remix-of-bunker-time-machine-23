import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY is not configured");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase config missing");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const { action, prompt, sceneIndex, projectName, referenceImageBase64, previousImageBase64 } = body;

    // Midpoint image generation action
    if (action === 'midpoint') {
      return await handleMidpoint(body, LOVABLE_API_KEY, supabase);
    }

    if (!prompt) throw new Error("prompt is required");

    const idx = sceneIndex ?? 0;
    // Scene 1 (index 0): no workers. Scene 8 (index 7): workers minimal/absent
    const noWorkerScenes = [0];
    const personGeneration = noWorkerScenes.includes(idx) ? "DONT_ALLOW" : "ALLOW_ADULT";
    const hasPrevRef = !!previousImageBase64;
    const hasOrigRef = !!referenceImageBase64;

    console.log(`Mode2 Scene ${idx + 1}: personGeneration=${personGeneration}, hasPrevRef=${hasPrevRef}, hasOrigRef=${hasOrigRef}`);

    let imageBase64: string;

    if (hasPrevRef) {
      // Scenes 2-8: use Gemini image model with previous scene + original reference
      const contentParts: any[] = [];

      const instruction = buildMode2Instruction(prompt, idx, hasOrigRef);
      contentParts.push({ type: "text", text: instruction });

      // Add original reference image
      if (hasOrigRef) {
        const cleanOrig = referenceImageBase64.includes(",") ? referenceImageBase64.split(",")[1] : referenceImageBase64;
        contentParts.push({ type: "text", text: "[ORIGINAL REFERENCE — This is the target completed state. Preserve all materials, colors, positions, and camera angle from this image throughout the renovation sequence.]" });
        contentParts.push({
          type: "image_url",
          image_url: { url: `data:image/png;base64,${cleanOrig}` },
        });
      }

      // Add previous scene image
      const cleanPrev = previousImageBase64.includes(",") ? previousImageBase64.split(",")[1] : previousImageBase64;
      contentParts.push({ type: "text", text: `[PREVIOUS SCENE — Scene ${idx}. The new image must continue directly from this state. Preserve camera angle and composition exactly. Only apply the changes described in the prompt.]` });
      contentParts.push({
        type: "image_url",
        image_url: { url: `data:image/png;base64,${cleanPrev}` },
      });

      console.log(`Using Gemini image model for Mode2 scene ${idx + 1}`);

      const maxAttempts = 3;
      let generatedImage: string | undefined;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const geminiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

        if (!geminiResponse.ok) {
          const errText = await geminiResponse.text();
          console.error(`Gemini error (attempt ${attempt}):`, geminiResponse.status, errText);
          if (geminiResponse.status === 429) {
            return new Response(JSON.stringify({ error: "Rate limit exceeded.", errorCode: "RATE_LIMITED" }), {
              status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          if (geminiResponse.status === 402) {
            return new Response(JSON.stringify({ error: "Credits exhausted.", errorCode: "PAYMENT_REQUIRED" }), {
              status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          if (attempt < maxAttempts) {
            console.log(`Retrying in 3s... (attempt ${attempt}/${maxAttempts})`);
            await new Promise(r => setTimeout(r, 3000));
            continue;
          }
          throw new Error(`Gemini error (${geminiResponse.status})`);
        }

        const geminiData = await geminiResponse.json();
        generatedImage = geminiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (generatedImage) break;

        const textContent = geminiData.choices?.[0]?.message?.content || '';
        console.warn(`Gemini attempt ${attempt}: no image returned. Text: ${textContent.substring(0, 200)}`);

        if (attempt < maxAttempts) {
          console.log(`Retrying in 3s... (attempt ${attempt}/${maxAttempts})`);
          await new Promise(r => setTimeout(r, 3000));
        }
      }

      if (!generatedImage) throw new Error("No image generated by Gemini after 3 attempts. The model may have refused due to content policy. Try simplifying the scene prompt.");

      imageBase64 = generatedImage.includes(",") ? generatedImage.split(",")[1] : generatedImage;
      console.log(`Mode2 Scene ${idx + 1} generated via Gemini (sequential chain)`);

    } else {
      // Scene 1: use Imagen 4 directly
      const imagenModel = "imagen-4.0-generate-001";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${imagenModel}:predict?key=${GOOGLE_AI_API_KEY}`;

      const requestBody = {
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: "9:16",
          personGeneration,
          safetyFilterLevel: "BLOCK_MEDIUM_AND_ABOVE",
        },
      };

      console.log(`Using Imagen 4 for Mode2 scene 1`);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "API quota exceeded.", errorCode: "RATE_LIMITED" }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`Imagen 4 error (${response.status}): ${errorText.substring(0, 300)}`);
      }

      const data = await response.json();
      const prediction = data.predictions?.[0];
      if (!prediction?.bytesBase64Encoded) throw new Error("No image generated by Imagen 4");

      imageBase64 = prediction.bytesBase64Encoded;
      console.log(`Mode2 Scene 1 generated via Imagen 4`);
    }

    // Upload to storage
    const safeName = (projectName || "mode2-project").replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = `mode2/${safeName}/scenes/scene_${idx + 1}_${Date.now()}.png`;
    const imageBytes = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));

    const { error: uploadError } = await supabase.storage
      .from("bunker-assets")
      .upload(fileName, imageBytes, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return new Response(JSON.stringify({
        imageUrl: `data:image/png;base64,${imageBase64}`,
        imageBase64,
        storageError: uploadError.message,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: publicUrl } = supabase.storage.from("bunker-assets").getPublicUrl(fileName);

    return new Response(JSON.stringify({
      imageUrl: publicUrl.publicUrl,
      imageBase64,
      storagePath: fileName,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("mode2-imagen error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildMode2Instruction(prompt: string, sceneIndex: number, hasOrigRef: boolean): string {
  const isFirstScene = sceneIndex === 0;
  const isLastScene = sceneIndex === 7;

  const cameraLock = [
    'CAMERA LOCK: The camera angle, position, height, framing, perspective, and composition must remain EXACTLY identical to the previous scene and the original reference image.',
    'Do NOT change the camera in any way. Do NOT reframe. Do NOT zoom. Do NOT shift perspective.',
  ].join(' ');

  const layoutLock = [
    'LAYOUT LOCK: All walls, windows, doors, and architectural elements must remain in their exact original positions.',
    'Do NOT move, add, remove, or resize any structural element. Do NOT redesign the space.',
    'The same room/building must remain the same room/building with no proportion changes.',
    'Room dimensions, wall locations, window count, window positions, door positions, and ceiling structure must be IDENTICAL to the reference.',
  ].join(' ');

  const qualityRules = [
    'Generate an ultra-realistic, hyper-detailed, cinematic photograph.',
    'Vertical 9:16 aspect ratio. Professional construction documentation style.',
    'No text, no labels, no watermarks, no written words anywhere in the image.',
    'No fantasy, no magical effects, no unrealistic lighting.',
  ].join(' ');

  // Step isolation: what this step changes and what must NOT change
  const stepIsolation = getStepIsolationRule(sceneIndex);

  // Floor opening continuity
  const floorRule = getFloorOpeningRule(sceneIndex);

  // Ceiling progression
  const ceilingRule = getCeilingProgressionRule(sceneIndex);

  // Restoration not redesign
  const restorationRule = 'RESTORATION NOT REDESIGN: The output must restore the original space, NOT redesign it. Do NOT make the room bigger, taller, wider, more premium, more elegant, or more modern than the reference allows. Preserve original structural character, proportions, and architectural rhythm. The final result must look like the same restored room, not a luxury showroom.';

  let workerRules: string;
  if (isFirstScene) {
    workerRules = 'WORKERS: No workers present in this image. The scene is completely empty and abandoned.';
  } else if (isLastScene) {
    workerRules = 'WORKERS: Workers may be minimal, subtle, distant, or absent in this final completed image. If present, a man in yellow work clothing and a woman in black work clothing perform final inspection or minimal finishing touches.';
  } else {
    workerRules = [
      'MANDATORY WORKERS: Two workers MUST be clearly visible in this image performing the renovation work described.',
      'Worker 1: A man wearing yellow work clothing.',
      'Worker 2: A woman wearing black work clothing.',
      'They MUST be actively performing realistic professional renovation tasks with proper tools and materials.',
      'They must be clearly visible, not hidden, not blurred, not cut off.',
      'Their task must match the renovation step: if repairing walls they use plaster and paint tools, if installing floors they use flooring tools, etc.',
      'Without visible workers, this image is INVALID.',
    ].join(' ');
  }

  const completionRule = [
    'IMAGE COMPLETION RULE: All renovation work for this specific step must be depicted as FULLY COMPLETED.',
    'The work shown in the prompt must look finished and professional for this stage.',
    'Previous steps remain completed. Future steps remain untouched.',
  ].join(' ');

  const parts = [
    qualityRules,
    cameraLock,
    layoutLock,
    stepIsolation,
    floorRule,
    ceilingRule,
    restorationRule,
    workerRules,
    completionRule,
    '',
    'SCENE PROMPT:',
    prompt,
  ].filter(Boolean);

  if (hasOrigRef) {
    parts.unshift('Use the ORIGINAL REFERENCE image to preserve exact materials, colors, textures, and architectural identity throughout the renovation sequence.');
  }

  return parts.join('\n\n');
}

function getStepIsolationRule(sceneIndex: number): string {
  const rules: Record<number, string> = {
    0: 'STEP ISOLATION: This is the original abandoned state. Show all damage as-is. No repairs, no cleaning, no changes.',
    1: 'STEP ISOLATION — CLEANING ONLY: Remove ONLY dirt, debris, bushes, and grass. Do NOT repair walls. Do NOT repair ceiling. Do NOT repair floor. Do NOT improve windows. Do NOT improve doors. All structural damage (cracks, holes, broken elements) must remain fully visible and unchanged.',
    2: 'STEP ISOLATION — WALLS ONLY: Repair ONLY wall plaster and paint. The floor must remain exactly as in the previous image (including any holes or damage). The ceiling must remain exactly as in the previous image (including any damage). Windows and doors must remain exactly as in the previous image. Only walls change.',
    3: 'STEP ISOLATION — CEILING ONLY: Repair ONLY the ceiling. Walls remain exactly as repaired in the previous step. The floor must remain exactly as in the previous image (including any holes or damage). Windows and doors must remain exactly as in the previous image. Only the ceiling changes.',
    4: 'STEP ISOLATION — WINDOWS AND DOORS ONLY: Install or repair ONLY windows and doors. The ceiling remains exactly as in the previous image. The floor remains exactly as in the previous image (including any holes or damage). Walls remain exactly as in the previous image. Only windows and doors change.',
    5: 'STEP ISOLATION — FLOORING ONLY: Install or repair ONLY the floor and floor structure. This is the FIRST step where floor holes/openings may be repaired. No other element changes. Walls, ceiling, windows, and doors remain exactly as in the previous image.',
    6: 'STEP ISOLATION — FURNITURE/FINISHING ONLY: Place ONLY furniture and decor. Do NOT make any structural changes. All walls, ceiling, floor, windows, and doors remain exactly as in the previous image. No architectural redesign allowed.',
    7: 'STEP ISOLATION — FINAL POLISH: This is the same room with the same layout and same architecture. Only apply final cleaning and presentation polish. No structural changes. No redesign.',
  };
  return rules[sceneIndex] || '';
}

function getFloorOpeningRule(sceneIndex: number): string {
  if (sceneIndex <= 4) {
    return 'FLOOR OPENING CONTINUITY: If the reference image contains a floor opening, hole, gap, or structural floor damage, it MUST remain in its EXACT original position, shape, scale, and perspective in this image. The floor opening must NOT move, shrink, change geometry, or disappear. It is a critical identity marker of the room.';
  }
  if (sceneIndex === 5) {
    return 'FLOOR OPENING REPAIR: This is the FIRST step where the floor opening/hole may be repaired. Show realistic floor preparation and installation process. The opening may begin to be structurally repaired with visible construction materials and methods.';
  }
  if (sceneIndex === 6) {
    return 'FLOOR CONTINUITY: The floor opening may be fully covered only if flooring was logically completed in the previous step. The finished floor must match the original room proportions.';
  }
  return 'FLOOR CONTINUITY: The final floor is finished. It must match the original room proportions and not extend beyond the original room boundaries.';
}

function getCeilingProgressionRule(sceneIndex: number): string {
  if (sceneIndex < 3) {
    return 'CEILING STATE: The ceiling must remain in its current damaged state. No ceiling repair is allowed in this step.';
  }
  if (sceneIndex === 3) {
    return 'CEILING PROGRESSION: If the ceiling started heavily destroyed, show a believable repair state proportional to the damage level. Do NOT jump from destroyed to pristine. For major damage: show stabilization and near-completion. The pace of ceiling repair must be proportional to the overall renovation pace.';
  }
  return '';
}

async function handleMidpoint(body: any, lovableApiKey: string, supabase: any) {
  const { startImageBase64, endImageBase64, transitionIndex, projectName, motionPrompt } = body;
  if (!startImageBase64 || !endImageBase64) throw new Error("startImageBase64 and endImageBase64 are required for midpoint");

  const cleanStart = startImageBase64.includes(",") ? startImageBase64.split(",")[1] : startImageBase64;
  const cleanEnd = endImageBase64.includes(",") ? endImageBase64.split(",")[1] : endImageBase64;

  const contentParts: any[] = [
    {
      type: "text",
      text: [
        "Generate a single image that represents the EXACT MIDPOINT (50% progress) between these two renovation states.",
        "This image must look like a real photograph taken halfway through the work shown in the transition.",
        "",
        "RULES:",
        "1. Camera angle, position, and composition must be IDENTICAL to both reference images.",
        "2. The renovation progress should be exactly halfway between the start and end states.",
        "3. Include the same two workers: a man in yellow work clothing and a woman in black work clothing, actively performing the renovation task.",
        "4. Hyper-realistic, cinematic quality. Vertical 9:16 format.",
        "5. No text, labels, watermarks, or written words.",
        "6. Materials, colors, and architectural details must match both reference images.",
        "",
        motionPrompt ? `Transition context: ${motionPrompt}` : "",
        "",
        "The image should feel like a natural in-between frame where work is visibly in progress but not yet complete.",
      ].filter(Boolean).join("\n"),
    },
    { type: "text", text: "[START STATE — The renovation begins from this state]" },
    { type: "image_url", image_url: { url: `data:image/png;base64,${cleanStart}` } },
    { type: "text", text: "[END STATE — The renovation will reach this state when complete]" },
    { type: "image_url", image_url: { url: `data:image/png;base64,${cleanEnd}` } },
  ];

  console.log(`Generating midpoint image for transition ${(transitionIndex ?? 0) + 1}`);

  const geminiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-pro-image-preview",
      messages: [{ role: "user", content: contentParts }],
      modalities: ["image", "text"],
    }),
  });

  if (!geminiResponse.ok) {
    const errText = await geminiResponse.text();
    console.error("Gemini midpoint error:", geminiResponse.status, errText);
    if (geminiResponse.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded.", errorCode: "RATE_LIMITED" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (geminiResponse.status === 402) {
      return new Response(JSON.stringify({ error: "Credits exhausted.", errorCode: "PAYMENT_REQUIRED" }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    throw new Error(`Gemini midpoint error (${geminiResponse.status})`);
  }

  const geminiData = await geminiResponse.json();
  const generatedImage = geminiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!generatedImage) throw new Error("No midpoint image generated");

  const imageBase64 = generatedImage.includes(",") ? generatedImage.split(",")[1] : generatedImage;

  // Upload to storage
  const safeName = (projectName || "mode2-project").replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `mode2/${safeName}/midpoints/midpoint_${(transitionIndex ?? 0) + 1}_${Date.now()}.png`;
  const imageBytes = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));

  const { error: uploadError } = await supabase.storage
    .from("bunker-assets")
    .upload(fileName, imageBytes, { contentType: "image/png", upsert: true });

  if (uploadError) {
    console.error("Midpoint storage upload error:", uploadError);
    return new Response(JSON.stringify({
      imageUrl: `data:image/png;base64,${imageBase64}`,
      imageBase64,
      storageError: uploadError.message,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const { data: publicUrl } = supabase.storage.from("bunker-assets").getPublicUrl(fileName);

  return new Response(JSON.stringify({
    imageUrl: publicUrl.publicUrl,
    imageBase64,
    storagePath: fileName,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
