/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TTS (Text-to-Speech) Utility — msedge-tts
 *
 * Generates MP3 audio buffers from text using Microsoft Edge's free neural
 * TTS voices. Supports multiple languages with child-friendly voice selection.
 *
 * Usage:
 *   const { generatePageAudio } = require("../utils/tts");
 *   const mp3Buffer = await generatePageAudio("Hello world", "English");
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");
const logger = require("./logger");

// ── Language → Voice mapping ─────────────────────────────────────────────────
// Using warm, natural-sounding female voices that work well for children's stories
const VOICE_MAP = {
	"English":    "en-US-AriaNeural",
	"Hindi":      "hi-IN-SwaraNeural",
	"Gujarati":   "gu-IN-DhwaniNeural",
	"Marathi":    "mr-IN-AarohiNeural",
	"Urdu":       "ur-PK-UzmaNeural",
	"Kannada":    "kn-IN-SapnaNeural",
	"Tamil":      "ta-IN-PallaviNeural",
	"Arabic":     "ar-SA-ZariyahNeural",
	"Telugu":     "te-IN-ShrutiNeural",
	"Bengali":    "bn-IN-TanishaaNeural",
	"Malayalam":  "ml-IN-SobhanaNeural",
	"Punjabi":    "pa-IN-GurpreetNeural",
	"Odia":       "or-IN-SubhasiniNeural",
	"Assamese":   "as-IN-PriyomNeural",
	"French":     "fr-FR-DeniseNeural",
	"Spanish":    "es-ES-ElviraNeural",
	"Portuguese": "pt-BR-FranciscaNeural",
};

const DEFAULT_VOICE = "en-US-AriaNeural";

/**
 * Select the best voice for a given language.
 * @param {string} language — e.g. "English", "Hindi", "Gujarati"
 * @returns {string} — msedge-tts voice name
 */
const pickVoice = (language) => {
	if (!language) return DEFAULT_VOICE;

	// Exact match first
	if (VOICE_MAP[language]) return VOICE_MAP[language];

	// Case-insensitive match
	const key = Object.keys(VOICE_MAP).find(
		(k) => k.toLowerCase() === language.toLowerCase()
	);
	if (key) return VOICE_MAP[key];

	// Partial match (e.g. "English - India" → "English")
	const partial = Object.keys(VOICE_MAP).find(
		(k) => language.toLowerCase().includes(k.toLowerCase())
	);
	if (partial) return VOICE_MAP[partial];

	return DEFAULT_VOICE;
};

/**
 * Generate MP3 audio from text using msedge-tts.
 *
 * @param {string} text     — The text to speak
 * @param {string} language — Story language for voice selection
 * @returns {Promise<Buffer>} — MP3 audio buffer
 */
const generatePageAudio = async (text, language = "English") => {
	if (!text || text.trim().length === 0) {
		return null;
	}

	// Clean the text for better TTS output
	const cleanText = text
		.replace(/\s+/g, " ")
		.replace(/[""]/g, '"')
		.replace(/['']/g, "'")
		.trim();

	if (cleanText.length < 2) return null;

	const voice = pickVoice(language);
	logger.info("[tts] Generating audio", { language, voice, textLength: cleanText.length });

	const tts = new MsEdgeTTS();
	await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

	const { audioStream } = tts.toStream(cleanText);

	return new Promise((resolve, reject) => {
		const chunks = [];
		audioStream.on("data", (chunk) => {
			if (chunk && chunk.audio) {
				chunks.push(chunk.audio);
			} else if (Buffer.isBuffer(chunk)) {
				chunks.push(chunk);
			}
		});
		audioStream.on("end", () => {
			const buffer = Buffer.concat(chunks);
			if (buffer.length === 0) {
				reject(new Error("TTS produced empty audio"));
			} else {
				logger.info("[tts] Audio generated", { size: buffer.length, voice });
				resolve(buffer);
			}
		});
		audioStream.on("error", (err) => {
			logger.error("[tts] Generation failed", { error: err.message });
			reject(err);
		});
	});
};

module.exports = {
	generatePageAudio,
	pickVoice,
	VOICE_MAP,
};
