import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Volume2, X } from "lucide-react";

interface VoiceInteractionProps {
  word: string;
  onClose: () => void;
}

type VoiceState = "idle" | "speaking" | "listening" | "result";

const VoiceInteraction = ({ word, onClose }: VoiceInteractionProps) => {
  const [state, setState] = useState<VoiceState>("speaking");
  const [result, setResult] = useState<"great" | "tryagain" | null>(null);

  // Simulate character speaking
  useEffect(() => {
    if (state === "speaking") {
      const t = setTimeout(() => setState("idle"), 2000);
      return () => clearTimeout(t);
    }
  }, [state]);

  const handleRepeat = () => {
    setState("listening");
    const t = setTimeout(() => {
      const success = Math.random() > 0.35;
      setResult(success ? "great" : "tryagain");
      setState("result");
    }, 2200);
    return () => clearTimeout(t);
  };

  const handleReplay = () => {
    setResult(null);
    setState("speaking");
  };

  return (
    <motion.div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-sm rounded-[32px] border border-white/40 p-8 text-center shadow-2xl"
        style={{
          background: "linear-gradient(135deg, rgba(80,30,180,0.85) 0%, rgba(180,60,200,0.85) 100%)",
          boxShadow: "0 30px 80px -10px rgba(120,40,220,0.6), inset 0 1px 0 rgba(255,255,255,0.3)",
        }}
        initial={{ scale: 0.8, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Character with mouth animation */}
        <motion.div
          className="text-7xl mb-4"
          animate={
            state === "speaking"
              ? { scaleY: [1, 1.08, 0.95, 1.1, 1], scaleX: [1, 0.97, 1.03, 0.98, 1] }
              : state === "listening"
              ? { rotate: [-3, 3, -3] }
              : {}
          }
          transition={{ repeat: state === "speaking" ? Infinity : 0, duration: 0.4 }}
        >
          {state === "result" && result === "great" ? "🎉" : state === "listening" ? "👂" : "🦉"}
        </motion.div>

        {/* Word display */}
        <div className="mb-5">
          <p className="text-white/70 text-sm mb-1">Say this word:</p>
          <h2 className="font-display text-3xl font-extrabold text-white drop-shadow-lg">{word}</h2>
        </div>

        {/* State UI */}
        <AnimatePresence mode="wait">
          {state === "speaking" && (
            <motion.div key="speaking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Voice wave */}
              <div className="flex items-end justify-center gap-1 h-10 mb-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-2 rounded-full bg-gradient-to-t from-purple-300 to-pink-300"
                    animate={{ height: [8, 24 + i * 4, 8, 32 - i * 2, 8] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.08 }}
                    style={{ minHeight: 8 }}
                  />
                ))}
              </div>
              <p className="text-white/80 text-sm flex items-center justify-center gap-2">
                <Volume2 className="w-4 h-4" /> Character is speaking...
              </p>
            </motion.div>
          )}

          {state === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <motion.button
                onClick={handleRepeat}
                className="w-full py-3.5 rounded-2xl font-display font-bold text-white flex items-center justify-center gap-2 mb-3"
                style={{
                  background: "linear-gradient(135deg, rgba(255,100,200,0.8), rgba(180,60,255,0.8))",
                  border: "1px solid rgba(255,255,255,0.3)",
                  boxShadow: "0 8px 25px rgba(200,80,255,0.4)",
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Mic className="w-5 h-5" /> Repeat after me!
              </motion.button>
              <button onClick={handleReplay} className="text-white/60 text-sm hover:text-white">
                🔊 Replay
              </button>
            </motion.div>
          )}

          {state === "listening" && (
            <motion.div key="listening" className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Pulse rings */}
              {[1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-pink-400/40"
                  animate={{ scale: [1, 2 + i * 0.5], opacity: [0.6, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                  style={{ width: 60, height: 60 }}
                />
              ))}
              <div className="relative w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow-lg">
                <Mic className="w-7 h-7 text-white" />
              </div>
              <p className="text-white font-bold animate-pulse">Listening...</p>
            </motion.div>
          )}

          {state === "result" && result && (
            <motion.div key="result" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}>
              {result === "great" ? (
                <>
                  <div className="text-5xl mb-2">🌟</div>
                  <p className="text-green-300 font-display font-extrabold text-xl mb-4">Great job!</p>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-2">😊</div>
                  <p className="text-amber-300 font-display font-extrabold text-xl mb-4">Try again!</p>
                </>
              )}
              <div className="flex gap-3 justify-center">
                <motion.button
                  onClick={handleReplay}
                  className="px-5 py-2.5 rounded-2xl font-bold text-white border border-white/30 bg-white/10"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🔊 Try Again
                </motion.button>
                <motion.button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-2xl font-bold text-amber-950"
                  style={{ background: "linear-gradient(135deg, #FFE0A3 0%, #E89A4A 100%)" }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Done ✓
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default VoiceInteraction;
