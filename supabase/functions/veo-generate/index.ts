import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_URL = "https://generativelanguage.googleapis.com";


serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase config missing");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json();
    const mode = body.mode || "generate";

    if (mode === "poll") {
      return await handlePoll(body.operationName, GOOGLE_AI_API_KEY, supabase, body.projectName, body.pairIndex);
    }

    if (mode === "capabilities") {
      return new Response(JSON.stringify({
        model: body.model || "veo-3.1-generate-preview",
        supportsReferenceImages: true,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return await handleGenerate(body, GOOGLE_AI_API_KEY, supabase);
  } catch (e) {
    console.error("veo-generate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleGenerate(body: any, apiKey: string, supabase: any) {
  const { prompt, model, startImageBase64, endImageBase64, projectName, pairIndex } = body;
  if (!prompt) throw new Error("prompt is required");

  const veoModel = model || "veo-3.1-generate-preview";
  const apiUrl = `${BASE_URL}/v1beta/models/${veoModel}:predictLongRunning?key=${apiKey}`;
  const hasStartImage = !!startImageBase64;
  const hasEndImage = !!endImageBase64;
  const allowPromptOnlyFallback = body.allowPromptOnlyFallback ?? !hasStartImage;

  let generationMode: string;
  const instance: any = { prompt };

  if (hasStartImage) {
    const referenceImages: any[] = [];

    try {
      const startImageRef = await uploadImageToGeminiFile(startImageBase64, apiKey, `start_${pairIndex ?? 0}`);
      referenceImages.push({
        image: startImageRef,
        referenceType: "asset",
      });

      if (hasEndImage) {
        const endImageRef = await uploadImageToGeminiFile(endImageBase64, apiKey, `end_${pairIndex ?? 0}`);
        referenceImages.push({
          image: endImageRef,
          referenceType: "asset",
        });
        generationMode = "reference-uri-start-end";
        console.log(`Using URI referenceImages mode (start+end): model=${veoModel}, pairIndex=${pairIndex}`);
      } else {
        generationMode = "reference-uri-start-only";
        console.log(`Using URI referenceImages mode (start only): model=${veoModel}, pairIndex=${pairIndex}`);
      }
    } catch (uploadError) {
      console.warn("Reference image URI upload failed. Falling back to inlineData references.", uploadError);

      referenceImages.push({
        image: { inlineData: { mimeType: "image/png", data: startImageBase64 } },
        referenceType: "asset",
      });

      if (hasEndImage) {
        referenceImages.push({
          image: { inlineData: { mimeType: "image/png", data: endImageBase64 } },
          referenceType: "asset",
        });
        generationMode = "reference-inline-start-end";
      } else {
        generationMode = "reference-inline-start-only";
      }
    }

    instance.referenceImages = referenceImages;
  } else {
    generationMode = "prompt-only";
  }

  const requestBody = {
    instances: [instance],
    parameters: {
      aspectRatio: "9:16",
      sampleCount: 1,
      durationSeconds: body.durationSeconds || 8,
      negativePrompt: "magical transformation, automatic repair, instant reconstruction, physics-breaking changes, teleporting objects, structure morphing, cinematic camera movement, pan, tilt, zoom, shaky camera",
    },
  };

  console.log(`Starting Veo generation: model=${veoModel}, mode=${generationMode}, pairIndex=${pairIndex}`);

  const sendGenerateRequest = (payload: any) => fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let response = await sendGenerateRequest(requestBody);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Veo API error:", response.status, errorText);

    if (response.status === 429) {
      return new Response(JSON.stringify({
        error: "API quota exceeded. Wait a few minutes and try again.",
        errorCode: "RATE_LIMITED",
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (response.status === 402) {
      return new Response(JSON.stringify({
        error: "Payment required. Please add funds to continue video generation.",
        errorCode: "PAYMENT_REQUIRED",
      }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const canFallbackToPromptOnly =
      generationMode !== "prompt-only" &&
      response.status === 400 &&
      (
        errorText.includes("isn't supported by this model") ||
        errorText.includes("use case is currently not supported") ||
        errorText.includes("INVALID_ARGUMENT")
      );

    if (canFallbackToPromptOnly) {
      console.warn(`Frame-conditioned generation rejected for model=${veoModel}. Retrying prompt-only mode.`);
      const promptOnlyRequestBody = {
        ...requestBody,
        instances: [{ prompt }],
      };

      const fallbackResponse = await sendGenerateRequest(promptOnlyRequestBody);
      if (fallbackResponse.ok) {
        response = fallbackResponse;
        generationMode = "prompt-only-fallback";
      } else {
        const fallbackErrorText = await fallbackResponse.text();
        console.error("Prompt-only fallback failed:", fallbackResponse.status, fallbackErrorText);

        return new Response(JSON.stringify({
          error: `Veo API error (${response.status})`,
          details: errorText.substring(0, 500),
          fallbackError: fallbackErrorText.substring(0, 500),
          generationMode,
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      return new Response(JSON.stringify({
        error: `Veo API error (${response.status})`,
        details: errorText.substring(0, 500),
        generationMode,
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const data = await response.json();

  // Long-running operation
  if (data.name) {
    console.log(`Veo operation started: ${data.name} (mode: ${generationMode})`);
    return new Response(JSON.stringify({
      status: "started",
      operationName: data.name,
      generationMode,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Synchronous result (unlikely for Veo but handle it)
  const videoData = extractVideoData(data);
  if (videoData) {
    return await uploadAndRespond(videoData, apiKey, supabase, projectName, pairIndex, generationMode);
  }

  return new Response(JSON.stringify({
    error: "Unexpected Veo response format",
    details: JSON.stringify(data).substring(0, 500),
    generationMode,
  }), {
    status: 500,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handlePoll(operationName: string, apiKey: string, supabase: any, projectName: string, pairIndex: number) {
  if (!operationName) throw new Error("operationName is required for polling");

  const pollUrl = `${BASE_URL}/v1beta/${operationName}?key=${apiKey}`;
  console.log(`Polling Veo operation: ${operationName}`);

  const response = await fetch(pollUrl);

  if (!response.ok) {
    const errorText = await response.text();
    return new Response(JSON.stringify({
      status: "polling",
      done: false,
      error: `Poll error (${response.status}): ${errorText.substring(0, 200)}`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const data = await response.json();

  if (!data.done) {
    return new Response(JSON.stringify({ status: "polling", done: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (data.error) {
    return new Response(JSON.stringify({
      status: "error",
      done: true,
      error: data.error.message || "Veo generation failed",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Extract video from the response
  const responseData = data.response || data;
  const videoData = extractVideoData(responseData);

  // Check for RAI filtering (safety filter rejection)
  const raiReasons = responseData?.generateVideoResponse?.raiMediaFilteredReasons;
  const raiCount = responseData?.generateVideoResponse?.raiMediaFilteredCount;

  if (raiCount && raiCount > 0 && !videoData) {
    const reason = raiReasons?.[0] || "Content was filtered by safety systems.";
    console.error("Veo RAI filter triggered:", reason);
    return new Response(JSON.stringify({
      status: "error",
      done: true,
      error: `Safety filter: ${reason}`,
      errorCode: "RAI_FILTERED",
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!videoData) {
    console.error("No video in Veo result:", JSON.stringify(data).substring(0, 1000));
    return new Response(JSON.stringify({
      status: "error",
      done: true,
      error: "No video in Veo result",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return await uploadAndRespond(videoData, apiKey, supabase, projectName, pairIndex, "polled", true);
}

/**
 * Extract video data from various Veo response formats.
 */
function extractVideoData(data: any): { uri?: string; bytesBase64Encoded?: string } | null {
  // Format: generateVideoResponse.generatedSamples[0].video (actual observed format)
  const v1 = data?.generateVideoResponse?.generatedSamples?.[0]?.video;
  if (v1?.uri || v1?.bytesBase64Encoded) return v1;

  // Format: generatedVideos[0].video
  const v2 = data?.generatedVideos?.[0]?.video;
  if (v2?.uri || v2?.bytesBase64Encoded) return v2;

  // Format: predictions[0].video
  const v3 = data?.predictions?.[0]?.video;
  if (v3?.uri || v3?.bytesBase64Encoded) return v3;

  // Format: generatedSamples[0].video (without wrapper)
  const v4 = data?.generatedSamples?.[0]?.video;
  if (v4?.uri || v4?.bytesBase64Encoded) return v4;

  return null;
}

/**
 * Download video, upload to storage, and return response.
 */
async function uploadAndRespond(
  videoData: { uri?: string; bytesBase64Encoded?: string },
  apiKey: string,
  supabase: any,
  projectName: string,
  pairIndex: number,
  generationMode: string,
  isDone = false,
) {
  let videoBytes: Uint8Array;

  if (videoData.uri) {
    const dlUrl = videoData.uri.includes("?") ? `${videoData.uri}&key=${apiKey}` : `${videoData.uri}?key=${apiKey}`;
    const dlResponse = await fetch(dlUrl);
    if (!dlResponse.ok) {
      console.warn("Video download failed, returning URI directly");
      return new Response(JSON.stringify({
        status: "complete", done: isDone, videoUrl: videoData.uri, generationMode,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const arrayBuffer = await dlResponse.arrayBuffer();
    videoBytes = new Uint8Array(arrayBuffer);
  } else if (videoData.bytesBase64Encoded) {
    videoBytes = Uint8Array.from(atob(videoData.bytesBase64Encoded), c => c.charCodeAt(0));
  } else {
    return new Response(JSON.stringify({
      status: "error", done: isDone, error: "No video data available", generationMode,
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const safeName = (projectName || "project").replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `${safeName}/transitions/transition_${(pairIndex ?? 0) + 1}_${Date.now()}.mp4`;

  const { error: uploadError } = await supabase.storage
    .from("bunker-assets")
    .upload(fileName, videoBytes, { contentType: "video/mp4", upsert: true });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    return new Response(JSON.stringify({
      status: "complete", done: isDone,
      videoUrl: videoData.uri || `data:video/mp4;base64,${videoData.bytesBase64Encoded?.substring(0, 100)}...`,
      generationMode,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const { data: publicUrl } = supabase.storage.from("bunker-assets").getPublicUrl(fileName);

  return new Response(JSON.stringify({
    status: "complete", done: isDone,
    videoUrl: publicUrl.publicUrl,
    storagePath: fileName,
    generationMode,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
