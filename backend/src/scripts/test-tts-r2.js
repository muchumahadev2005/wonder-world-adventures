/**
 * Quick test: Generate TTS audio for one sentence and upload to R2.
 * Usage: node src/scripts/test-tts-r2.js
 */
require("dotenv").config();
const { generatePageAudio } = require("../utils/tts");
const { uploadAudio } = require("../utils/r2");

const main = async () => {
	console.log("\n=== TTS + R2 End-to-End Test ===\n");

	// 1. Generate audio
	console.log("[1] Generating audio from text...");
	const text = "Once upon a time, there lived a clever little girl who loved to read stories under the big banyan tree.";
	const buffer = await generatePageAudio(text, "English");
	console.log(`    ✅ Generated MP3: ${buffer.length} bytes`);

	// 2. Upload to R2
	console.log("[2] Uploading to Cloudflare R2...");
	const url = await uploadAudio(buffer, "test/tts-test.mp3");
	console.log(`    ✅ Uploaded! Public URL:`);
	console.log(`    ${url}`);

	// 3. Verify
	console.log("\n[3] Open this URL in your browser to hear the audio:");
	console.log(`    ${url}\n`);

	console.log("=== Test Complete ===\n");
};

main().catch((err) => {
	console.error("Test failed:", err.message);
	process.exit(1);
});
