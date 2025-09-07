export default {
    async fetch(request, env) {
        const API_KEY = env.API_KEY;
        const url = new URL(request.url);
        const auth = request.headers.get("Authorization");

        // Handle CORS preflight
        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: corsHeaders(),
            });
        }

        // 🔐 Simple API key check (Bearer token)
        if (auth !== `Bearer ${API_KEY}`) {
            return json({ error: "Unauthorized" }, 401);
        }

        // 🚫 Only allow POST requests to /
        if (request.method !== "POST" || url.pathname !== "/") {
            return json({ error: "Not allowed" }, 405);
        }

        try {
            const { prompt, model, width, height, negative_prompt } = await request.json();

            if (!prompt) return json({ error: "Prompt is required" }, 400);

            // Allow only requested Workers AI models
            const allowedModels = new Set([
                // Free tier
                "@cf/stabilityai/stable-diffusion-xl-base-1.0",
                // Premium tier
                "@cf/bytedance/stable-diffusion-xl-lightning",
                "@cf/lykon/dreamshaper-8-lcm",
                "@cf/black-forest-labs/flux-1-schnell",
                "@cf/runwayml/stable-diffusion-v1-5-img2img",
                "@cf/runwayml/stable-diffusion-v1-5-inpainting"
            ]);

            const selectedModel = allowedModels.has(String(model))
                ? model
                : "@cf/stabilityai/stable-diffusion-xl-base-1.0";

            // Supported models documented above

            // 🧠 Generate image from prompt
            const inputs = { prompt };
            if (typeof width === "number") inputs.width = width;
            if (typeof height === "number") inputs.height = height;
            if (typeof negative_prompt === "string" && negative_prompt.trim()) inputs.negative_prompt = negative_prompt;

            const result = await env.AI.run(selectedModel, inputs);

            // Try to infer correct image content-type (PNG/JPEG/GIF/WEBP) and detect JSON errors
            let contentType = 'image/jpeg';
            try {
                const buf = await result.arrayBuffer?.() ? result : new Response(result);
                const ab = await buf.arrayBuffer();
                const sig = new Uint8Array(ab.slice(0, 12));
                const isPNG = sig[0] === 0x89 && sig[1] === 0x50 && sig[2] === 0x4E && sig[3] === 0x47 && sig[4] === 0x0D && sig[5] === 0x0A && sig[6] === 0x1A && sig[7] === 0x0A;
                const isJPEG = sig[0] === 0xFF && sig[1] === 0xD8;
                const isGIF = sig[0] === 0x47 && sig[1] === 0x49 && sig[2] === 0x46;
                const isRIFF = sig[0] === 0x52 && sig[1] === 0x49 && sig[2] === 0x46 && sig[3] === 0x46; // 'RIFF'
                const isWEBP = isRIFF && sig[8] === 0x57 && sig[9] === 0x45 && sig[10] === 0x42 && sig[11] === 0x50; // 'WEBP'

                // JSON detection: if first non-whitespace byte is '{', it's likely JSON
                const firstByte = sig.find(b => b !== 0x20 && b !== 0x0A && b !== 0x0D && b !== 0x09);
                const looksJSON = firstByte === 0x7B; // '{'
                if (looksJSON && !isPNG && !isJPEG && !isGIF && !isWEBP) {
                    let details = '';
                    try { details = new TextDecoder('utf-8').decode(ab); } catch {}
                    return json({ error: 'Model returned JSON instead of image', details }, 502);
                }

                if (isPNG) contentType = 'image/png';
                else if (isGIF) contentType = 'image/gif';
                else if (isWEBP) contentType = 'image/webp';
                else if (isJPEG) contentType = 'image/jpeg';
                return new Response(ab, { headers: { 'Content-Type': contentType, ...corsHeaders() } });
            } catch (_) {
                // Fallback: return as-is, defaulting to jpeg
                return new Response(result, { headers: { 'Content-Type': contentType, ...corsHeaders() } });
            }
        } catch (err) {
            return json({ error: "Failed to generate image", details: err.message }, 500);
        }
    },
};

// 📦 Function to return JSON responses
function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
}

// 🌐 CORS helper
function corsHeaders() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
}