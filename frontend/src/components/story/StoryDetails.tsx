import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Headphones, BookOpen, ChevronRight, Star } from "lucide-react";
import { QuizQuestion } from "@/components/QuizScreen";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { StoryAudioPlayer } from "./StoryAudioPlayer";

export type StoryDetailsItem = {
  id: string;
  title: string;
  author: string;
  tags: string[];
  coverEmoji: string;
  coverGradient: string;
  duration: string;
  description: string;
  content: string;
  language?: {
    id: string;
    code: string;
    name: string;
    native?: string | null;
  } | null;
  premium: boolean;
  stars: number;
  pages: string[];
  quiz: QuizQuestion[];
};

interface StoryDetailsProps {
  activeStory: StoryDetailsItem;
  onBack: () => void;
  goToQuiz: () => void;
}

export const StoryDetails = ({ activeStory, onBack, goToQuiz }: StoryDetailsProps) => {
  const [tab, setTab] = useState<"audio" | "read">("audio");
  const [readPage, setReadPage] = useState(0);
  const [liked, setLiked] = useState(false);

  // Initialize SpeechSynthesis hook with story language and ID context
  const {
    isSupported,
    voices,
    currentVoice,
    rate,
    pitch,
    volume,
    isPlaying,
    isPaused,
    isSpeaking,
    setRate,
    setPitch,
    setVolume,
    setVoice,
    play,
    pause,
    resume,
    stop,
    restart,
  } = useSpeechSynthesis({
    storyLanguage: activeStory.language?.code,
    storyId: activeStory.id,
  });

  return (
    <motion.div
      key="detail"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
      className="absolute inset-0 z-50 pb-28 overflow-y-auto"
      style={{ background: "linear-gradient(180deg, #0d0720 0%, #1a0f3a 50%, #0d0720 100%)" }}
    >
      {/* Cover hero */}
      <div className="relative h-72 overflow-hidden" style={{ background: activeStory.coverGradient }}>
        {/* Firefly particles */}
        {Array.from({ length: 18 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-amber-200"
            style={{ left: `${((i * 37) % 90) + 5}%`, top: `${((i * 23) % 85) + 5}%` }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.3, 0.5] }}
            transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.2 }}
          />
        ))}

        {/* Cover art */}
        <div className="absolute inset-0 flex items-center justify-center text-8xl">
          {activeStory.coverEmoji}
        </div>

        {/* Gradient overlay */}
        <div 
          className="absolute inset-0" 
          style={{ background: "linear-gradient(0deg, rgba(13,7,32,0.95) 0%, transparent 60%)" }} 
        />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-10">
          <motion.button
            onClick={onBack}
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)" }}
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <motion.button
            onClick={() => setLiked(l => !l)}
            whileTap={{ scale: 0.85 }}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)" }}
          >
            <Heart className={`w-5 h-5 ${liked ? "text-red-400 fill-red-400" : "text-white"}`} />
          </motion.button>
        </div>

        {/* Title area */}
        <div className="absolute bottom-4 left-5 right-5">
          <h2 className="font-display text-2xl font-extrabold text-white drop-shadow-lg">
            {activeStory.title}
          </h2>
          <p className="text-white/50 text-sm">by {activeStory.author}</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {activeStory.tags.map(tag => (
              <span
                key={tag}
                className="px-3 py-0.5 rounded-full text-xs font-bold text-white/70"
                style={{ 
                  background: "rgba(255,255,255,0.12)", 
                  border: "1px solid rgba(255,255,255,0.18)" 
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pt-5 space-y-4">
        {/* Audio / Read tabs */}
        <div className="flex gap-2 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.07)" }}>
          {(["audio", "read"] as const).map(t => (
            <motion.button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors"
              style={
                tab === t
                  ? { background: "linear-gradient(135deg,#7c5cbf,#a78bfa)", color: "#fff" }
                  : { color: "rgba(255,255,255,0.4)" }
              }
              whileTap={{ scale: 0.97 }}
            >
              {t === "audio" ? <Headphones className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
              {t === "audio" ? "Audio" : "Read"}
            </motion.button>
          ))}
        </div>

        {/* Audio tab */}
        {tab === "audio" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <StoryAudioPlayer
              storyTitle={activeStory.title}
              storyContent={activeStory.content}
              isSupported={isSupported}
              voices={voices}
              currentVoice={currentVoice}
              rate={rate}
              pitch={pitch}
              volume={volume}
              isPlaying={isPlaying}
              isPaused={isPaused}
              isSpeaking={isSpeaking}
              setRate={setRate}
              setPitch={setPitch}
              setVolume={setVolume}
              setVoice={setVoice}
              play={play}
              pause={pause}
              resume={resume}
              stop={stop}
              restart={restart}
            />
            
            <motion.button
              onClick={goToQuiz}
              className="w-full py-3.5 rounded-2xl font-display font-bold text-white flex items-center justify-center gap-2"
              style={{ 
                background: "linear-gradient(135deg,#7c5cbf,#a78bfa)", 
                boxShadow: "0 8px 25px rgba(124,92,191,0.4)" 
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <Star className="w-5 h-5 text-amber-300 fill-amber-300" /> Start Quiz!
            </motion.button>
          </motion.div>
        )}

        {/* Read tab */}
        {tab === "read" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-5 space-y-4"
            style={{ 
              background: "rgba(255,255,255,0.05)", 
              border: "1px solid rgba(255,255,255,0.08)" 
            }}
          >
            {/* Read progress */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg,#7c5cbf,#a78bfa)" }}
                  animate={{ width: `${((readPage + 1) / activeStory.pages.length) * 100}%` }}
                />
              </div>
              <span className="text-xs text-white/40">
                {readPage + 1}/{activeStory.pages.length}
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={readPage}
                className="text-white/80 leading-relaxed text-base font-body min-h-[120px]"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {activeStory.pages[readPage]}
              </motion.p>
            </AnimatePresence>

            <div className="flex gap-3">
              <button
                onClick={() => setReadPage(p => Math.max(0, p - 1))}
                disabled={readPage === 0}
                className="flex-1 py-2.5 rounded-xl font-bold text-white/60 disabled:opacity-30 bg-white/5 border border-white/10"
              >
                ← Back
              </button>
              {readPage < activeStory.pages.length - 1 ? (
                <motion.button
                  onClick={() => setReadPage(p => p + 1)}
                  whileTap={{ scale: 0.96 }}
                  className="flex-1 py-2.5 rounded-xl font-bold text-white flex items-center justify-center gap-1"
                  style={{ background: "linear-gradient(135deg,#7c5cbf,#a78bfa)" }}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </motion.button>
              ) : (
                <motion.button
                  onClick={goToQuiz}
                  className="flex-1 py-2.5 rounded-xl font-display font-bold text-white flex items-center justify-center gap-1"
                  style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)" }}
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <Star className="w-4 h-4 fill-white" /> Take Quiz!
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {/* About */}
        <div 
          className="rounded-2xl p-5" 
          style={{ 
            background: "rgba(255,255,255,0.05)", 
            border: "1px solid rgba(255,255,255,0.08)" 
          }}
        >
          <h3 className="text-white font-bold mb-2">About this story</h3>
          <p className="text-white/60 text-sm leading-relaxed">{activeStory.description}</p>
        </div>
      </div>
    </motion.div>
  );
};
