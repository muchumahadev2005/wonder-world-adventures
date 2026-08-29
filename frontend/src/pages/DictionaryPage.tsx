/**
 * DictionaryPage — "Word Wonder" section
 *
 * Features:
 * - Word search with animated input
 * - Pronunciation audio button (plays .mp3 from Dictionary API)
 * - Phonetic text display
 * - Parts of speech tabs
 * - Definitions with examples highlighted in a quote style
 * - Synonyms & antonyms chips (clickable — lookup that word)
 * - "Word of the Day" suggestions to get started
 * - Fully offline-capable (no backend — calls Free Dictionary API directly)
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import NavBar from "@/components/NavBar";
import { speakText, stopSpeaking } from "@/lib/tts.service";
import {
  dictionaryApi,
  DictionaryNotFoundError,
  type DictEntry,
  type DictMeaning,
} from "@/lib/dictionaryApi";
import {
  Search,
  Volume2,
  BookOpen,
  ChevronRight,
  Sparkles,
  RefreshCw,
  AlertCircle,
  X,
} from "lucide-react";

// ── Word of the Day seeds ─────────────────────────────────────────

const SEED_WORDS = [
  "adventure", "curious", "brilliant", "journey", "imagine",
  "discover", "wonder", "courage", "kindness", "creative",
  "mystery", "friendship", "explore", "dazzle", "enchant",
];

// ── Part-of-speech colour map ─────────────────────────────────────

const POS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  noun:        { bg: "rgba(99,102,241,0.15)",  text: "#818CF8", border: "rgba(99,102,241,0.4)"  },
  verb:        { bg: "rgba(16,185,129,0.15)",  text: "#34D399", border: "rgba(16,185,129,0.4)"  },
  adjective:   { bg: "rgba(245,158,11,0.15)",  text: "#FCD34D", border: "rgba(245,158,11,0.4)"  },
  adverb:      { bg: "rgba(236,72,153,0.15)",  text: "#F9A8D4", border: "rgba(236,72,153,0.4)"  },
  exclamation: { bg: "rgba(239,68,68,0.15)",   text: "#FCA5A5", border: "rgba(239,68,68,0.4)"   },
  interjection:{ bg: "rgba(239,68,68,0.15)",   text: "#FCA5A5", border: "rgba(239,68,68,0.4)"   },
  pronoun:     { bg: "rgba(14,165,233,0.15)",  text: "#7DD3FC", border: "rgba(14,165,233,0.4)"  },
  preposition: { bg: "rgba(168,85,247,0.15)",  text: "#D8B4FE", border: "rgba(168,85,247,0.4)"  },
  conjunction: { bg: "rgba(234,179,8,0.15)",   text: "#FDE047", border: "rgba(234,179,8,0.4)"   },
  default:     { bg: "rgba(255,255,255,0.08)", text: "rgba(255,255,255,0.7)", border: "rgba(255,255,255,0.2)" },
};

const posColor = (pos: string) => POS_COLORS[pos.toLowerCase()] ?? POS_COLORS.default;

// ── Animations ────────────────────────────────────────────────────

const cardVariants = {
  hidden: { y: 30, opacity: 0, scale: 0.96 },
  show:   { y: 0,  opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 200, damping: 24 } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

// ── Chip component ────────────────────────────────────────────────

const WordChip = ({ word, onClick }: { word: string; onClick: (w: string) => void }) => (
  <motion.button
    whileHover={{ scale: 1.07, y: -1 }}
    whileTap={{ scale: 0.95 }}
    onClick={() => onClick(word)}
    className="px-3 py-1 rounded-full text-xs font-semibold border transition-all"
    style={{ background: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.75)" }}
  >
    {word}
  </motion.button>
);

// ── Meaning card ──────────────────────────────────────────────────

const MeaningCard = ({ meaning, onWordClick }: { meaning: DictMeaning; onWordClick: (w: string) => void }) => {
  const col = posColor(meaning.partOfSpeech);
  return (
    <motion.div variants={cardVariants} className="rounded-2xl p-5 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)" }}>
      {/* Part of speech badge */}
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border mb-4"
        style={{ background: col.bg, color: col.text, borderColor: col.border }}>
        {meaning.partOfSpeech}
      </span>

      {/* Definitions */}
      <ol className="space-y-4">
        {meaning.definitions.slice(0, 4).map((def, i) => (
          <li key={i} className="flex gap-3">
            <span className="font-bold text-white/30 text-sm pt-0.5 flex-shrink-0 w-5">{i + 1}.</span>
            <div className="flex-1 min-w-0">
              <p className="text-white/90 text-sm leading-relaxed">{def.definition}</p>
              {def.example && (
                <blockquote className="mt-2 pl-3 border-l-2 text-white/45 italic text-xs leading-relaxed"
                  style={{ borderColor: col.border }}>
                  "{def.example}"
                </blockquote>
              )}
              {/* Inline synonyms */}
              {def.synonyms.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">syn:</span>
                  {def.synonyms.slice(0, 5).map((s) => (
                    <WordChip key={s} word={s} onClick={onWordClick} />
                  ))}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>

      {/* Meaning-level synonyms & antonyms */}
      {(meaning.synonyms.length > 0 || meaning.antonyms.length > 0) && (
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-4">
          {meaning.synonyms.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-emerald-400/70 font-bold uppercase tracking-wider">Synonyms:</span>
              {meaning.synonyms.slice(0, 6).map((s) => (
                <WordChip key={s} word={s} onClick={onWordClick} />
              ))}
            </div>
          )}
          {meaning.antonyms.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-rose-400/70 font-bold uppercase tracking-wider">Antonyms:</span>
              {meaning.antonyms.slice(0, 6).map((a) => (
                <WordChip key={a} word={a} onClick={onWordClick} />
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────

export default function DictionaryPage() {
  const [inputValue, setInputValue] = useState("");
  const [searchWord, setSearchWord] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [wordOfDay] = useState(() => SEED_WORDS[Math.floor(Math.random() * SEED_WORDS.length)]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Lookup query ───────────────────────────────────────────────
  const { data: entries, isLoading, isError, error, isFetching } = useQuery<DictEntry[], Error>({
    queryKey: ["dictionary", searchWord],
    queryFn: () => dictionaryApi.lookup(searchWord),
    enabled: !!searchWord,
    retry: false,
    staleTime: 10 * 60 * 1000,
  });

  const entry = entries?.[0];
  const rawAudioUrl = entry ? dictionaryApi.getRawAudioUrl(entry) : null;
  const phonetic = entry ? dictionaryApi.getBestPhonetic(entry) : null;

  // ── Stop audio on word change ──────────────────────────────────
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
    }
  }, [searchWord]);

  // ── Search handlers ────────────────────────────────────────────
  const handleSearch = useCallback((word?: string) => {
    const w = (word ?? inputValue).trim().toLowerCase();
    if (!w) return;
    setInputValue(w);
    setSearchWord(w);
    setTimeout(() => inputRef.current?.blur(), 50);
  }, [inputValue]);

  const handleWordClick = useCallback((word: string) => {
    setInputValue(word);
    setSearchWord(word);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleClear = useCallback(() => {
    setInputValue("");
    setSearchWord("");
    setIsPlaying(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // ── Audio playback (Backend MP3 Stream + Browser TTS Fallback) ───
  const handlePlayAudio = useCallback(() => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      stopSpeaking();
      setIsPlaying(false);
      return;
    }

    const wordToSpeak = entry?.word || searchWord;
    if (!wordToSpeak) return;

    setIsPlaying(true);

    const playFallbackTTS = () => {
      speakText(wordToSpeak, "en", {
        rate: 0.85,
        onEnd: () => setIsPlaying(false),
        onError: () => setIsPlaying(false),
      });
    };

    // Use backend proxied audio stream URL (guaranteed 200 OK mp3 stream)
    const streamUrl = dictionaryApi.getProxiedAudioUrl(wordToSpeak, rawAudioUrl);
    const audio = new Audio(streamUrl);
    audioRef.current = audio;

    audio.play().then(() => {
      audio.onended = () => {
        setIsPlaying(false);
        audioRef.current = null;
      };
    }).catch((err) => {
      console.warn("[Dictionary] Audio stream playback failed, using Web Speech TTS fallback:", err);
      audioRef.current = null;
      playFallbackTTS();
    });

    audio.onerror = () => {
      console.warn("[Dictionary] Audio stream error, using Web Speech TTS fallback");
      audioRef.current = null;
      playFallbackTTS();
    };
  }, [isPlaying, rawAudioUrl, entry, searchWord]);

  const notFound = isError && error instanceof DictionaryNotFoundError;

  return (
    <div className="min-h-screen relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0F1B3D 0%, #1A2A5E 40%, #2D1B4E 100%)" }}>
      
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[60vw] h-[60vw] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #4A6FD9 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #A855F7 0%, transparent 70%)", filter: "blur(80px)" }} />
      </div>

      <NavBar />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-24">

        {/* ── Header ── */}
        <motion.div className="mb-8" initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center border border-white/25"
              style={{ background: "linear-gradient(135deg, #4A6FD9 0%, #A855F7 100%)", boxShadow: "0 8px 24px rgba(74,111,217,0.45)" }}>
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-white drop-shadow">Word Wonder</h1>
              <p className="text-white/50 text-sm">Tap any word to explore its meaning 🔍</p>
            </div>
          </div>
        </motion.div>

        {/* ── Search bar ── */}
        <motion.div
          className="mb-6 relative"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div
            className="flex items-center gap-3 p-2 pl-4 rounded-2xl border border-white/20 focus-within:border-indigo-400/60 transition-all"
            style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(20px)", boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}
          >
            {isFetching
              ? <RefreshCw className="w-5 h-5 text-white/40 animate-spin flex-shrink-0" />
              : <Search className="w-5 h-5 text-white/40 flex-shrink-0" />
            }
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Type any English word…"
              autoComplete="off"
              spellCheck={false}
              className="flex-1 bg-transparent outline-none text-white placeholder:text-white/30 text-lg font-semibold"
            />
            {inputValue && (
              <motion.button
                onClick={handleClear}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white/70 transition-all"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
            <motion.button
              onClick={() => handleSearch()}
              disabled={!inputValue.trim() || isFetching}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white border border-white/20 disabled:opacity-40 transition-all"
              style={{ background: "linear-gradient(135deg, #4A6FD9 0%, #A855F7 100%)", boxShadow: "0 4px 14px rgba(74,111,217,0.4)" }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              Search
            </motion.button>
          </div>
        </motion.div>

        {/* ── Seed suggestions ── */}
        {!searchWord && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
          >
            {/* Word of the day */}
            <motion.button
              onClick={() => handleSearch(wordOfDay)}
              className="w-full mb-4 p-5 rounded-2xl border border-indigo-400/30 text-left relative overflow-hidden group"
              style={{ background: "linear-gradient(135deg, rgba(74,111,217,0.2), rgba(168,85,247,0.15))", backdropFilter: "blur(12px)" }}
              whileHover={{ scale: 1.015 }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400/90 text-xs font-bold uppercase tracking-wider">Word of the Day</span>
                  </div>
                  <p className="text-white font-display font-bold text-2xl capitalize">{wordOfDay}</p>
                  <p className="text-white/50 text-sm mt-0.5">Tap to discover its meaning!</p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white/70 group-hover:translate-x-1 transition-all mt-1" />
              </div>
            </motion.button>

            {/* Quick suggestions */}
            <p className="text-white/40 text-xs uppercase tracking-wider mb-2.5 font-semibold">Try these words</p>
            <div className="flex flex-wrap gap-2">
              {["brave", "ocean", "galaxy", "echo", "wizard", "forest", "dream", "swift"].map((w) => (
                <motion.button
                  key={w}
                  onClick={() => handleSearch(w)}
                  className="px-4 py-1.5 rounded-full border text-sm font-semibold text-white/70 hover:text-white hover:border-white/40 transition-all"
                  style={{ background: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.18)" }}
                  whileHover={{ scale: 1.06, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {w}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Loading skeleton ── */}
        {isLoading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-28 rounded-2xl" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="h-48 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)" }} />
            <div className="h-40 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }} />
          </div>
        )}

        {/* ── Not found ── */}
        {notFound && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-6xl mb-4">🤔</div>
            <h3 className="font-display text-white text-xl font-bold mb-2">Hmm, "{searchWord}" is a mystery!</h3>
            <p className="text-white/50 text-sm">We couldn't find a definition. Try checking the spelling!</p>
            <motion.button
              onClick={handleClear}
              className="mt-6 px-6 py-2.5 rounded-xl border border-white/20 text-white/70 hover:text-white text-sm font-semibold transition-all"
              style={{ background: "rgba(255,255,255,0.07)" }}
              whileHover={{ scale: 1.04 }}
            >
              Try another word
            </motion.button>
          </motion.div>
        )}

        {/* ── API error ── */}
        {isError && !notFound && (
          <div className="p-4 rounded-xl border border-red-400/30 bg-red-500/10 text-red-300 flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error?.message ?? "Something went wrong. Please try again."}
          </div>
        )}

        {/* ── Results ── */}
        <AnimatePresence>
          {entry && !isLoading && (
            <motion.div
              key={entry.word}
              variants={stagger}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {/* Word header card */}
              <motion.div
                variants={cardVariants}
                className="p-6 rounded-3xl border border-white/15 relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, rgba(74,111,217,0.25) 0%, rgba(168,85,247,0.18) 100%)", backdropFilter: "blur(16px)", boxShadow: "0 16px 48px rgba(0,0,0,0.3)" }}
              >
                {/* Decorative glow */}
                <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20"
                  style={{ background: "radial-gradient(circle, #A855F7 0%, transparent 70%)" }} />

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-1 capitalize">
                      {entry.word}
                    </h2>
                    {phonetic && (
                      <p className="text-indigo-300/80 text-lg font-mono">{phonetic}</p>
                    )}
                  </div>

                  {/* Audio button (always available, uses MP3 or SpeechSynthesis fallback) */}
                  <motion.button
                    onClick={handlePlayAudio}
                    className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/25 flex-shrink-0 transition-all cursor-pointer"
                    style={{
                      background: isPlaying
                        ? "linear-gradient(135deg, #3B82F6, #2563EB)"
                        : "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.06))",
                      boxShadow: isPlaying ? "0 0 24px rgba(59,130,246,0.6)" : "none",
                    }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    title="Play pronunciation"
                  >
                    <motion.div
                      animate={isPlaying ? { scale: [1, 1.2, 1], opacity: [1, 0.7, 1] } : {}}
                      transition={{ duration: 0.6, repeat: Infinity }}
                    >
                      <Volume2 className="w-6 h-6 text-white" />
                    </motion.div>
                  </motion.button>
                </div>

                {/* Part of speech count */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {entry.meanings.map((m, i) => {
                    const col = posColor(m.partOfSpeech);
                    return (
                      <span key={i} className="px-2.5 py-0.5 rounded-full text-xs font-bold border"
                        style={{ background: col.bg, color: col.text, borderColor: col.border }}>
                        {m.partOfSpeech}
                      </span>
                    );
                  })}
                </div>
              </motion.div>

              {/* Meanings */}
              {entry.meanings.map((m, i) => (
                <MeaningCard key={i} meaning={m} onWordClick={handleWordClick} />
              ))}

              {/* Source */}
              {entry.sourceUrls?.length > 0 && (
                <motion.p variants={cardVariants} className="text-center text-white/25 text-xs">
                  Source:{" "}
                  <a href={entry.sourceUrls[0]} target="_blank" rel="noopener noreferrer"
                    className="underline hover:text-white/50 transition-colors">
                    {entry.sourceUrls[0].replace("https://", "")}
                  </a>
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
