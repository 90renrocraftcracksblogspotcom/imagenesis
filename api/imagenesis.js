// Vercel Serverless Function: Proxies image generation to your Cloudflare Worker.
// Uses the Vercel env var API_CLOUDFLARE_VERCEL for the Worker bearer token.

/** @param {import('http').IncomingMessage & { method: string, headers: any, body?: any }} req
 *  @param {import('http').ServerResponse} res
 */
module.exports = async function handler(req, res) {
  const allowOrigin = '*';
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    return res.end();
  }

  if (req.method !== 'POST') {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  // Read JSON body (support both Vercel's parsed req.body and raw stream)
  try {
    let body;
    if (req.body && typeof req.body === 'object') {
      body = req.body;
    } else if (req.body && typeof req.body === 'string') {
      try { body = JSON.parse(req.body); } catch { body = {}; }
    } else {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString('utf8');
      body = raw ? JSON.parse(raw) : {};
    }
    const { prompt, model, width, height, negative_prompt } = body || {};

    if (!prompt || typeof prompt !== 'string') {
      Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Prompt is required' }));
    }

    const WORKER_URL = process.env.WORKER_URL || 'https://imagenesis.renrotechhelp.workers.dev/';
    const API_KEY = process.env.API_CLOUDFLARE_VERCEL;
    if (!API_KEY) {
      Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Server misconfigured: missing API_CLOUDFLARE_VERCEL' }));
    }

    const payload = { prompt, model, width, height, negative_prompt };
    const workerResp = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!workerResp.ok) {
      let details = await workerResp.text().catch(() => '');
      try { details = JSON.parse(details); } catch (_) {}
      Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
      res.statusCode = workerResp.status;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Worker error', details }));
    }

    // Read the upstream bytes
    const arrayBuffer = await workerResp.arrayBuffer();
    let contentType = (workerResp.headers.get('content-type') || '').toLowerCase();

    // Detect JSON error payloads that may come back with 200 or non-image content types
    const head16 = new Uint8Array(arrayBuffer.slice(0, 16));
    const looksJSON = contentType.includes('application/json') || contentType.includes('text/json') || head16[0] === 0x7b; // '{'
    if (looksJSON) {
      let details = '';
      try { details = new TextDecoder('utf-8').decode(arrayBuffer); } catch {}
      try { details = JSON.parse(details); } catch {}
      Object.entries({ ...corsHeaders, 'Content-Type': 'application/json' }).forEach(([k, v]) => res.setHeader(k, v));
      res.statusCode = 502;
      return res.end(JSON.stringify({ error: 'Worker returned JSON instead of image', details }));
    }

    // Sniff image signatures
    try {
      const sig = new Uint8Array(arrayBuffer.slice(0, 12));
      const isPNG = sig[0] === 0x89 && sig[1] === 0x50 && sig[2] === 0x4E && sig[3] === 0x47 && sig[4] === 0x0D && sig[5] === 0x0A && sig[6] === 0x1A && sig[7] === 0x0A;
      const isJPEG = sig[0] === 0xFF && sig[1] === 0xD8;
      const isGIF = sig[0] === 0x47 && sig[1] === 0x49 && sig[2] === 0x46; // GIF87a/89a
      const isRIFF = sig[0] === 0x52 && sig[1] === 0x49 && sig[2] === 0x46 && sig[3] === 0x46; // 'RIFF'
      const isWEBP = isRIFF && sig[8] === 0x57 && sig[9] === 0x45 && sig[10] === 0x42 && sig[11] === 0x50; // 'WEBP'

      if (!contentType || !contentType.startsWith('image/')) {
        contentType = isPNG ? 'image/png' : isJPEG ? 'image/jpeg' : isGIF ? 'image/gif' : isWEBP ? 'image/webp' : 'application/octet-stream';
      }
      // Prefer sniffed type when mismatch
      if (isPNG) contentType = 'image/png';
      else if (isJPEG) contentType = 'image/jpeg';
      else if (isGIF) contentType = 'image/gif';
      else if (isWEBP) contentType = 'image/webp';
    } catch (_) {
      if (!contentType) contentType = 'application/octet-stream';
    }

    // Optional: transcode to PNG for maximum client compatibility
    try {
      let sharp;
      try { sharp = require('sharp'); } catch (_) { sharp = null; }
      if (sharp) {
        const imgBuf = Buffer.from(arrayBuffer);
        const png = await sharp(imgBuf).png().toBuffer();
        Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'no-store');
        res.statusCode = 200;
        return res.end(png);
      }
      // If sharp unavailable, fall through to return original bytes
    } catch (_) {
      // Ignore and fall through
    }

    // Return original bytes
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-store');
    res.statusCode = 200;
    return res.end(Buffer.from(arrayBuffer));
  } catch (err) {
    Object.entries({ ...corsHeaders, 'Content-Type': 'application/json' }).forEach(([k, v]) => res.setHeader(k, v));
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'Proxy failed', details: err.message }));
  }
};
