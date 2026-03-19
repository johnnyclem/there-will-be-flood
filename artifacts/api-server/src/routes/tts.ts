import { Router, type IRouter, type Request, type Response as ExpressResponse } from "express";

const router: IRouter = Router();

const DEFAULT_VOICE_ID = "pNInz6obpgDQGcFmaJgB";

router.post("/tts", async (req: Request, res: ExpressResponse) => {
  const apiKey = process.env["ELEVEN_LABS_API_KEY"];

  if (!apiKey) {
    res.status(503).json({ error: "TTS service is not configured: missing ELEVEN_LABS_API_KEY" });
    return;
  }

  const { text, voice_id } = req.body as { text?: string; voice_id?: string };

  if (!text || text.trim().length === 0) {
    res.status(400).json({ error: "Request body must include a non-empty 'text' field" });
    return;
  }

  const voiceId = voice_id ?? DEFAULT_VOICE_ID;
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  let elevenResponse: globalThis.Response;
  try {
    elevenResponse = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.8,
          style: 0.4,
        },
      }),
    });
  } catch (err) {
    console.error("[TTS] Network error calling ElevenLabs:", err);
    res.status(500).json({ error: "Failed to reach ElevenLabs API" });
    return;
  }

  if (!elevenResponse.ok) {
    const errorBody = await elevenResponse.text().catch(() => "(unreadable)");
    console.error(`[TTS] ElevenLabs returned ${elevenResponse.status}: ${errorBody}`);
    res.status(500).json({
      error: `ElevenLabs API error: ${elevenResponse.status}`,
      detail: errorBody,
    });
    return;
  }

  res.setHeader("Content-Type", "audio/mpeg");

  const { body } = elevenResponse;
  if (!body) {
    res.status(500).json({ error: "ElevenLabs returned an empty response body" });
    return;
  }

  const reader = body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (err) {
    console.error("[TTS] Error streaming audio from ElevenLabs:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Error streaming audio" });
    } else {
      res.end();
    }
  }
});

export default router;
