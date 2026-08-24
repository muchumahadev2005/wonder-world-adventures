/**
 * responseSanitizer.js — Robust AI response cleaning & thinking process stripper.
 *
 * Prevents reasoning models or chain-of-thought models from leaking internal
 * thinking, prompt rules, constraint checks, system instructions, or drafts to children.
 */

const logger = require("./logger");

const DEFAULT_FALLBACK_REPLY =
  "Here is a fun learning tip: Curiosity makes your brain super strong! Keep exploring and asking amazing questions! 🌟📚";

// Patterns that indicate leaked system instructions or prompt rules that MUST NOT reach the child
const SYSTEM_LEAK_PATTERNS = [
  /never\s+discuss\s*:/i,
  /safety\s+rules\s*(?:\(never|\:)/i,
  /strict\s+safety\s+rules/i,
  /system\s+prompt/i,
  /developer\s+instructions/i,
  /hidden\s+instructions/i,
  /admin\s+(?:custom\s+)?instructions/i,
  /target\s+audience\s+&\s+difficulty/i,
  /allowed\s+&\s+prioritized\s+educational\s+topics/i,
  /response\s+length\s+&\s+style\s+constraints/i,
  /as\s+kidspal\s+ai\s+with\s+(?:a\s+)?limit\s+of/i,
  /check\s+word\s+count\s*:/i,
  /let['’]?s\s+count\s*:\s*\w+\(\d+\)/i,
  /my\s+instructions\s+are\s+to/i,
  /i\s+am\s+instructed\s+to\s+never/i,
];

// Patterns that indicate internal reasoning or chain-of-thought blocks
const THINKING_BLOCK_PATTERNS = [
  /^(?:here['’]?s\s+(?:a\s+)?(?:thinking\s+process|thought\s+process)|thinking\s+process|thought\s+process|internal\s+reasoning|chain\s+of\s+thought|let['’]?s\s+break\s+this\s+down)/i,
  /(?:\n|^)\s*\d+\.\s*\*\*(?:analyze\s+user\s+input|identify\s+key\s+constraints|brainstorm|formulate|determine)/i,
];

/**
 * Checks whether a piece of text contains system prompt / safety rule leakage.
 *
 * @param {string} str
 * @returns {boolean}
 */
function containsSystemLeak(str) {
  if (!str || typeof str !== "string") return false;
  return SYSTEM_LEAK_PATTERNS.some((pattern) => pattern.test(str));
}

/**
 * Strip thinking and reasoning tags from a string.
 *
 * @param {string} str
 * @returns {string}
 */
function stripThinkingTags(str) {
  if (!str) return "";
  let s = str;
  s = s.replace(/<think>[\s\S]*?<\/think>/gi, "");
  s = s.replace(/<thought>[\s\S]*?<\/thought>/gi, "");
  s = s.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "");
  s = s.replace(/<analysis>[\s\S]*?<\/analysis>/gi, "");
  s = s.replace(/<prompt>[\s\S]*?<\/prompt>/gi, "");
  s = s.replace(/<instructions>[\s\S]*?<\/instructions>/gi, "");
  s = s.replace(/\[thinking:[\s\S]*?\]/gi, "");
  s = s.replace(/\[thought:[\s\S]*?\]/gi, "");
  return s;
}

/**
 * Sanitize and clean an AI completion response before delivering to the user.
 *
 * @param {string} raw - The raw text from the LLM completion
 * @param {object} [options={}]
 * @param {number} [options.maxWords=50] - Maximum word count limit
 * @param {string} [options.fallback] - Custom fallback if output is empty
 * @returns {string}
 */
function sanitizeAiResponse(raw, options = {}) {
  const maxWords = options.maxWords || 50;
  const fallback = options.fallback || DEFAULT_FALLBACK_REPLY;

  if (!raw || typeof raw !== "string" || !raw.trim()) {
    return fallback;
  }

  let text = raw.trim();

  // 1. Check for explicit final answer marker anywhere in mixed content
  // Examples:
  // "Here is my reasoning... <think>...</think> Final answer: Dinosaurs lived millions of years ago."
  // "<think>reasoning... Final answer: Stars are giant glowing balls of gas!"
  const finalAnswerMatch = text.match(
    /(?:final\s+(?:answer|response|tip)|child(?:\s+facing)?\s+answer|message\s+to\s+child)\s*:\s*([\s\S]+)$/i
  );

  if (finalAnswerMatch && finalAnswerMatch[1] && finalAnswerMatch[1].trim().length > 5) {
    const candidateAnswer = stripThinkingTags(finalAnswerMatch[1]).trim();
    if (candidateAnswer && !containsSystemLeak(candidateAnswer)) {
      text = candidateAnswer;
    }
  }

  // 2. Remove standard closed thinking/reasoning tags
  text = stripThinkingTags(text).trim();

  // 3. Remove unclosed leading thinking tags if any remain (e.g. <think>reasoning with no closing tag)
  if (text.startsWith("<think>") || text.startsWith("<thought>") || text.startsWith("<reasoning>")) {
    const doubleNewlineIdx = text.indexOf("\n\n");
    if (doubleNewlineIdx !== -1) {
      text = text.slice(doubleNewlineIdx + 2).trim();
    } else {
      text = "";
    }
  }

  // 4. Check if text starts with or contains thinking/reasoning blocks
  const isThinking = THINKING_BLOCK_PATTERNS.some((pattern) => pattern.test(text));

  if (isThinking) {
    logger.info("[responseSanitizer] Detected internal thinking process in response — extracting clean message");

    // Try extracting drafted tip in quotes
    const quoteMatches = Array.from(
      text.matchAll(
        /(?:draft\s+tip|tip\s+idea|final\s+(?:tip|response|answer)|message|tip|idea)?[:\s]*["“]([^"”\r\n]{10,250})["”]/gi
      )
    );

    let candidate = "";
    if (quoteMatches.length > 0) {
      for (let i = quoteMatches.length - 1; i >= 0; i--) {
        const q = quoteMatches[i][1].trim();
        if (
          q.length > 10 &&
          !/^(?:give\s+me|what\s+is|tell\s+me|user\s+says|max\s+\d+|analyze|user\s+asks)/i.test(q) &&
          !containsSystemLeak(q)
        ) {
          candidate = q;
          break;
        }
      }
    }

    if (candidate) {
      text = candidate;
    } else {
      // Line-by-line cleaner
      const lines = text.split("\n");
      const validLines = [];

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        // Skip any thinking / planning lines
        if (
          /^(?:here['’]?s\s+(?:a\s+)?(?:thinking\s+process|thought\s+process)|thinking\s+process|thought\s+process|internal\s+reasoning|chain\s+of\s+thought)/i.test(
            line
          ) ||
          /^\d+\.\s*\*\*/.test(line) ||
          /^[-*•]\s+/i.test(line) ||
          /^(?:context|role|critical\s+instructions|instructions|rules|must\s+be|target\s+age|tone|check\s+word\s+count|let['’]?s\s+count|draft\s+tip|tip\s+idea|word\s+count)\s*:/i.test(
            line
          ) ||
          /let['’]?s\s+count:|check\s+word\s+count:|word\s+count/i.test(line) ||
          /^(?:analyze|identify|brainstorm|formulate|determine|extract)\b/i.test(line) ||
          containsSystemLeak(line)
        ) {
          continue;
        }

        // Must be a valid, clean sentence
        if (line.length >= 10 && !line.includes("**") && !line.startsWith("-")) {
          validLines.push(line);
        }
      }

      if (validLines.length > 0) {
        text = validLines[validLines.length - 1];
      } else {
        text = "";
      }
    }
  }

  // 5. Remove residual meta-commentary or constraint checking lines
  text = text
    .replace(/(?:^|\n)(?:check\s+word\s+count|word\s+count|let['’]?s\s+count|constraint\s+check)[\s\S]*$/gi, "")
    .replace(/(?:^|\n)(?:admin\s+custom\s+instructions|safety\s+rules|strict\s+safety\s+rules)[\s\S]*$/gi, "")
    .trim();

  // 6. Strip wrapping quotes if present
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith('“') && text.endsWith('”'))
  ) {
    text = text.slice(1, -1).trim();
  }

  // 7. Security Check: If the output still contains leaked rules / system instructions, return fallback
  if (containsSystemLeak(text)) {
    logger.warn("[responseSanitizer] Response contained system prompt or safety rule leakage — substituting fallback");
    return fallback;
  }

  // 8. If everything was stripped or output is too short/empty, return fallback
  if (!text || text.length < 5) {
    return fallback;
  }

  // 9. Word count limiter (truncate cleanly at sentence boundary if model exceeded maxWords)
  const words = text.split(/\s+/);
  if (words.length > maxWords + 5) {
    const truncatedWords = words.slice(0, maxWords);
    const joined = truncatedWords.join(" ");

    const lastPunctuation = Math.max(
      joined.lastIndexOf("."),
      joined.lastIndexOf("!"),
      joined.lastIndexOf("?")
    );

    if (lastPunctuation > 20) {
      text = joined.slice(0, lastPunctuation + 1).trim();
    } else {
      text = joined + "... ✨";
    }
  }

  return text.trim();
}

module.exports = { sanitizeAiResponse };
