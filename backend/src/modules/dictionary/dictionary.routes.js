/**
 * dictionary.routes.js
 *
 * Proxies requests to the free Dictionary API and provides a rock-solid,
 * fallback-enabled audio endpoint for word pronunciations.
 *
 * GET /api/dictionary/:word        → JSON dictionary entry
 * GET /api/dictionary/audio/:word  → Reliable MP3 audio stream for pronunciation
 */

const express = require("express");
const router = express.Router();

const DICT_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en";

// ── GET /api/dictionary/audio/:word ─────────────────────────────
// Streams high-quality MP3 audio for word pronunciation.
// Tries Dictionary API mp3 first, falls back to Google TTS audio stream.
router.get("/audio/:word", async (req, res) => {
  const { word } = req.params;
  const cleanWord = (word || "").trim().toLowerCase();

  if (!cleanWord) {
    return res.status(400).json({ success: false, message: "Word is required." });
  }

  const customMp3Url = req.query.url ? String(req.query.url) : null;

  // Function to stream from a target URL
  const tryStreamUrl = async (targetUrl) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3s max timeout

    try {
      const response = await fetch(targetUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok && response.headers.get("content-type")?.includes("audio")) {
        const buffer = await response.arrayBuffer();
        res.setHeader("Content-Type", "audio/mpeg");
        res.setHeader("Cache-Control", "public, max-age=86400");
        return res.send(Buffer.from(buffer));
      }
    } catch {
      clearTimeout(timeout);
    }
    return false;
  };

  try {
    // 1. Try provided dictionary mp3 URL if passed as query param
    if (customMp3Url && customMp3Url.startsWith("http")) {
      const success = await tryStreamUrl(customMp3Url);
      if (success !== false) return;
    }

    // 2. Fallback: Google Translate TTS stream (100% reliable, fast, zero Cloudflare 522 errors)
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanWord)}&tl=en&client=tw-ob`;
    const ttsSuccess = await tryStreamUrl(ttsUrl);
    if (ttsSuccess !== false) return;

    return res.status(500).json({ success: false, message: "Audio unavailable." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/dictionary/:word ─────────────────────────────────────
router.get("/:word", async (req, res) => {
  const { word } = req.params;

  if (!word || !word.trim()) {
    return res.status(400).json({ success: false, message: "Word is required." });
  }

  try {
    const upstream = await fetch(`${DICT_BASE}/${encodeURIComponent(word.trim().toLowerCase())}`, {
      headers: { Accept: "application/json" },
    });

    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(502).json({
      success: false,
      message: "Could not reach dictionary service.",
    });
  }
});

module.exports = router;
