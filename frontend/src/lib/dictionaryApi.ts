/**
 * dictionaryApi.ts — Dictionary API client.
 *
 * Calls our own backend proxy at /api/dictionary/:word
 * Audio requests go through /api/dictionary/audio/:word
 */

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL || "https://wonder-world-adventures.onrender.com";

const DICT_API = `${SERVER_URL}/api/dictionary`;

// ── Types ─────────────────────────────────────────────────────────

export interface DictPhonetic {
  text?: string;
  audio?: string;
  sourceUrl?: string;
}

export interface DictDefinition {
  definition: string;
  example?: string;
  synonyms: string[];
  antonyms: string[];
}

export interface DictMeaning {
  partOfSpeech: string;
  definitions: DictDefinition[];
  synonyms: string[];
  antonyms: string[];
}

export interface DictEntry {
  word: string;
  phonetic?: string;
  phonetics: DictPhonetic[];
  meanings: DictMeaning[];
  sourceUrls: string[];
}

export class DictionaryNotFoundError extends Error {
  constructor(word: string) {
    super(`No definition found for "${word}".`);
  }
}

// ── API ───────────────────────────────────────────────────────────

export const dictionaryApi = {
  /**
   * Look up a word via our backend proxy.
   */
  lookup: async (word: string): Promise<DictEntry[]> => {
    const clean = word.trim().toLowerCase();
    if (!clean) throw new Error("Please enter a word.");

    const res = await fetch(`${DICT_API}/${encodeURIComponent(clean)}`);

    if (res.status === 404) throw new DictionaryNotFoundError(clean);

    if (!res.ok) {
      let msg = `Dictionary service error (${res.status})`;
      try { const d = await res.json(); msg = d?.message || msg; } catch { /* ignore */ }
      throw new Error(msg);
    }

    const data: DictEntry[] = await res.json();
    return data;
  },

  /** Get raw audio URL from entry if available */
  getRawAudioUrl: (entry: DictEntry): string | null => {
    for (const p of entry.phonetics) {
      if (p.audio && p.audio.trim()) {
        let url = p.audio.trim();
        if (url.startsWith("//")) url = `https:${url}`;
        return url;
      }
    }
    return null;
  },

  /** Get proxied audio URL from backend (guaranteed 200 OK MP3 stream) */
  getProxiedAudioUrl: (word: string, rawAudioUrl?: string | null): string => {
    const clean = word.trim().toLowerCase();
    let url = `${DICT_API}/audio/${encodeURIComponent(clean)}`;
    if (rawAudioUrl) {
      url += `?url=${encodeURIComponent(rawAudioUrl)}`;
    }
    return url;
  },

  /** Get best phonetic text from entry */
  getBestPhonetic: (entry: DictEntry): string | null => {
    if (entry.phonetic) return entry.phonetic;
    for (const p of entry.phonetics) {
      if (p.text && p.text.trim()) return p.text;
    }
    return null;
  },
};
