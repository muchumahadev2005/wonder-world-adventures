/**
 * StoryWeaver Service
 *
 * Fetches stories and story pages from the StoryWeaver public API.
 * All requests go through OUR backend — the API token (if required) is
 * never exposed to the frontend.
 *
 * Listing  : GET https://storyweaver.org.in/api/v1/books-search
 * Story pages: GET https://storyweaver.org.in/api/v1/stories/{slug}/read
 */

const https    = require("https");
const redis    = require("../../../utils/redis");
const logger   = require("../../../utils/logger");
const { storyweaverApiToken } = require("../../../config/env");

const SW_BASE   = "https://storyweaver.org.in";
const CACHE_TTL_LIST   = 30 * 60;   // 30 minutes for listing responses
const CACHE_TTL_DETAIL = 60 * 60;   // 1 hour for story detail / pages
// Bump this when normalization logic changes to invalidate stale cache entries
const CACHE_VERSION    = "v4";

// ─── Low-level HTTP helper ───────────────────────────────────────────────────

/**
 * Performs a GET request and resolves with the parsed JSON body.
 * @param {string} url
 * @returns {Promise<unknown>}
 */
const fetchJson = (url) =>
	new Promise((resolve, reject) => {
		const headers = { "Accept": "application/json" };
		if (storyweaverApiToken) {
			headers["Authorization"] = `Bearer ${storyweaverApiToken}`;
		}

		const req = https.get(url, { headers, timeout: 10_000 }, (res) => {
			let raw = "";
			res.on("data", (chunk) => { raw += chunk; });
			res.on("end", () => {
				try {
					const parsed = JSON.parse(raw);
					if (!parsed?.ok && res.statusCode !== 200) {
						return reject(new Error(`StoryWeaver API error ${res.statusCode}`));
					}
					resolve(parsed);
				} catch {
					reject(new Error("Failed to parse StoryWeaver response"));
				}
			});
		});

		req.on("timeout", () => {
			req.destroy();
			reject(new Error("StoryWeaver request timed out"));
		});
		req.on("error", reject);
	});

/**
 * Performs a GET request and resolves with raw text (e.g. for VTT files).
 * @param {string} url
 * @returns {Promise<string>}
 */
const fetchText = (url) =>
	new Promise((resolve, reject) => {
		const req = https.get(url, { timeout: 8000 }, (res) => {
			let raw = "";
			res.on("data", (chunk) => { raw += chunk; });
			res.on("end", () => resolve(raw));
		});
		req.on("timeout", () => {
			req.destroy();
			reject(new Error("VTT request timed out"));
		});
		req.on("error", reject);
	});

/**
 * Parse a WebVTT file to extract start times for each cue.
 * Returns a map of cueId -> startTimeInSeconds.
 */
const parseVttCueTimes = (vttText) => {
	const cueTimes = {};
	const lines = (vttText || "").split(/\r?\n/);
	let currentCueId = null;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();
		if (/^\d+$/.test(line)) {
			currentCueId = line;
		} else if (line.includes("-->") && currentCueId) {
			const startStr = line.split("-->")[0].trim();
			const parts = startStr.split(":");
			let secs = 0;
			if (parts.length === 3) {
				secs = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
			} else if (parts.length === 2) {
				secs = parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
			}
			cueTimes[currentCueId] = secs;
			currentCueId = null;
		}
	}
	return cueTimes;
};

// ─── Normalizers ─────────────────────────────────────────────────────────────

/**
 * Pick the best cover image from the sizes array.
 * Prefers size4 (≈548px) or the largest available.
 */
const pickCoverUrl = (sizes = []) => {
	if (!Array.isArray(sizes) || sizes.length === 0) return null;
	// size4 is index 3 (0-based), otherwise grab the middle/largest
	return (sizes[3] || sizes[sizes.length - 1] || sizes[0])?.url || null;
};

/**
 * Normalize a raw book object from books-search into our clean shape.
 */
const normalizeBook = (book) => ({
	id:          String(book.id),
	title:       book.title || "Untitled",
	language:    book.language || "English",
	level:       String(book.level || ""),
	slug:        book.slug || String(book.id),
	recommended: Boolean(book.recommended),
	editorsPick: Boolean(book.editorsPick),
	coverImage:  pickCoverUrl(book.coverImage?.sizes),
	authors:     (book.authors || []).map((a) => a.name).filter(Boolean),
	illustrators:(book.illustrators || []).map((a) => a.name).filter(Boolean),
	description: book.description || book.synopsis || "",
	synopsis:    book.synopsis || book.description || "",
	publisher:   book.publisher?.name || "",
	readsCount:  book.readsCount  || 0,
	likesCount:  book.likesCount  || 0,
	isAudio:     Boolean(book.isAudio && book.audioStatus === "audio_published"),
	isGif:       Boolean(book.isGif),
	awards:      (book.awardsDetails || []).map((a) => a.description).filter(Boolean),
	raw:         book,
});

/**
 * Normalize a single page from the /read response.
 * Extracts image URL and clean story text from the html field.
 */
const normalizePage = (page) => {
	// ── Image URL ──────────────────────────────────────────────────────────────
	// Primary: coverImage.sizes array (pre-cropped)
	let imageUrl = pickCoverUrl(page.coverImage?.sizes) || null;

	// Fallback: parse data-size4-src from the <img> inside the html
	if (!imageUrl && page.html) {
		const m = page.html.match(/data-size4-src="([^"]+)"/);
		if (m) imageUrl = m[1];
	}
	// Last resort: any data-sizeN-src
	if (!imageUrl && page.html) {
		const m = page.html.match(/data-size\d-src="([^"]+)"/);
		if (m) imageUrl = m[1];
	}

	// ── Text extraction ────────────────────────────────────────────────────────
	let text = "";
	if (page.html) {
		let html = page.html;

		// 1. Remove <script>…</script> and <style>…</style> and <svg>…</svg>
		html = html.replace(/<script[\s\S]*?<\/script>/gi, "");
		html = html.replace(/<style[\s\S]*?<\/style>/gi, "");
		html = html.replace(/<svg[\s\S]*?<\/svg>/gi, "");

		// 2. Remove page number divs
		html = html.replace(/<div class="page_number[^"]*">[^<]*<\/div>/gi, "");

		// 3. Try extracting text from data-cue spans (these are the actual story words)
		const cueMatches = [...html.matchAll(/<span[^>]+data-cue="[^"]*"[^>]*>([\s\S]*?)<\/span>/gi)];
		if (cueMatches.length > 0) {
			text = cueMatches
				.map((m) => m[1].replace(/<[^>]+>/g, "").trim())
				.filter(Boolean)
				.join(" ")
				.replace(/\s+/g, " ")
				.trim();
		} else {
			// Fallback: strip all remaining HTML tags
			text = html
				.replace(/<[^>]+>/g, " ")
				.replace(/&amp;/g, "&")
				.replace(/&lt;/g, "<")
				.replace(/&gt;/g, ">")
				.replace(/&quot;/g, '"')
				.replace(/&#39;/g, "'")
				.replace(/\s+/g, " ")
				.trim();
		}

		// 4. Decode common HTML entities in final text
		text = text
			.replace(/&amp;/g, "&")
			.replace(/&lt;/g, "<")
			.replace(/&gt;/g, ">")
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			.replace(/\s+/g, " ")
			.trim();
	}

	return {
		pageId:     page.pageId,
		position:   page.pagePostion || page.position || 0,
		pageType:   page.pageType || "StoryPage",
		isLastPage: Boolean(page.isLastStoryPage),
		imageUrl,
		text,
	};
};


// ─── Service methods ──────────────────────────────────────────────────────────

/**
 * Fetch a paginated list of stories from StoryWeaver.
 * @param {{ page?: number, limit?: number, language?: string, level?: number, query?: string }} params
 */
const listStories = async (params = {}) => {
	const { page = 1, limit = 12, language, level, query, category } = params;

	// Build cache key
	const cacheKey = `storyweaver:${CACHE_VERSION}:stories:${page}:${limit}:${language || ""}:${level || ""}:${query || ""}:${category || ""}`;

	const cached = await redis.get(cacheKey);
	if (cached) {
		try { return JSON.parse(cached); } catch { /* fall through */ }
	}

	// Build StoryWeaver URL
	const qs = new URLSearchParams({
		page:     String(page),
		per_page: String(limit),
	});
	if (language) qs.set("language",      language);
	if (level)    qs.set("reading_level", String(level));
	if (query)    qs.set("query",         query);
	if (category) qs.set("category",      category);

	const url = `${SW_BASE}/api/v1/books-search?${qs.toString()}`;
	logger.info("[storyweaver] listStories", { url });

	const raw = await fetchJson(url);

	let books = Array.isArray(raw?.data) ? raw.data.map(normalizeBook) : [];

	// StoryWeaver's reading_level param is a soft hint — post-filter for accuracy
	if (level) {
		books = books.filter((b) => b.level === String(level));
	}

	const meta   = raw?.metadata || {};
	const result = {
		stories:     books,
		total:       level ? books.length : (meta.hits || books.length),
		page:        Number(meta.page) || page,
		totalPages:  level ? 1 : (Number(meta.totalPages) || 1),
		perPage:     Number(meta.perPage) || limit,
	};


	await redis.set(cacheKey, JSON.stringify(result), CACHE_TTL_LIST);
	return result;
};

/**
 * Fetch a story's pages (for the in-app reader).
 * @param {string} id — numeric ID or full slug
 */
const getStory = async (id) => {
	const cacheKey = `storyweaver:${CACHE_VERSION}:story:${id}`;

	const cached   = await redis.get(cacheKey);
	if (cached) {
		try { return JSON.parse(cached); } catch { /* fall through */ }
	}

	// The /read endpoint accepts either the numeric id or the full slug
	const url = `${SW_BASE}/api/v1/stories/${encodeURIComponent(id)}/read`;
	logger.info("[storyweaver] getStory", { url });

	let raw;
	try {
		raw = await fetchJson(url);
	} catch (err) {
		// If the slug-based URL fails, try numeric id only (first segment of slug)
		const numericId = id.split("-")[0];
		if (numericId !== id) {
			const fallbackUrl = `${SW_BASE}/api/v1/stories/${numericId}/read`;
			logger.info("[storyweaver] getStory fallback", { fallbackUrl });
			raw = await fetchJson(fallbackUrl);
		} else {
			throw err;
		}
	}

	if (!raw?.ok || !raw?.data) {
		const err = new Error("Story not found");
		err.status = 404;
		throw err;
	}

	const data  = raw.data;

	// Parse VTT cue timestamps if available
	let cueTimes = {};
	if (data.vttFilePath) {
		try {
			const vttText = await fetchText(data.vttFilePath);
			cueTimes = parseVttCueTimes(vttText);
		} catch (e) {
			logger.warn("[storyweaver] Failed to fetch/parse VTT file", { error: e.message });
		}
	}

	const pages = (Array.isArray(data.pages) ? data.pages : []).map((page, idx) => {
		const norm = normalizePage(page);
		const match = (page.html || "").match(/data-cue="([^"]+)"/);
		let startTime = null;
		if (match && cueTimes[match[1]] !== undefined) {
			startTime = cueTimes[match[1]];
		} else if (idx === 0) {
			startTime = 0;
		}
		return {
			...norm,
			startTime,
		};
	});

	// Monotonic page timestamps array (seconds) for auto-advancing according to audio
	let lastTime = 0;
	const pageTimestamps = pages.map((p) => {
		if (p.startTime !== null && p.startTime !== undefined) {
			lastTime = p.startTime;
		}
		return lastTime;
	});

	const result = {
		id:             id,
		slug:           data.slug        || id,
		title:          data.title       || "",
		language:       data.language    || "English",
		level:          String(data.level || ""),
		orientation:    data.orientation || "landscape",
		isAudio:        Boolean(data.isAudio),
		audioPath:      data.audioPath   || null,
		vttFilePath:    data.vttFilePath || null,
		pages,
		pageTimestamps,
		totalPages:     pages.length,
	};

	await redis.set(cacheKey, JSON.stringify(result), CACHE_TTL_DETAIL);
	return result;
};

module.exports = { listStories, getStory };
