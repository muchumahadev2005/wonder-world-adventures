import { useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Play, Pause, Square, RotateCcw, 
  HelpCircle, Sparkles, MessageSquareDot 
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface StoryAudioPlayerProps {
  storyTitle: string;
  storyContent: string;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  currentVoice: SpeechSynthesisVoice | null;
  rate: number;
  isPlaying: boolean;
  isPaused: boolean;
  isSpeaking: boolean;
  setRate: (rate: number) => void;
  setVoice: (voice: SpeechSynthesisVoice | null) => void;
  play: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  restart: (text: string) => void;
}

export const StoryAudioPlayer = ({
  storyTitle,
  storyContent,
  isSupported,
  voices,
  currentVoice,
  rate,
  isPlaying,
  isPaused,
  isSpeaking,
  setRate,
  setVoice,
  play,
  pause,
  resume,
  stop,
  restart,
}: StoryAudioPlayerProps) => {
  const isContentEmpty = !storyContent || storyContent.trim().length === 0;

  // Keyboard accessibility: Space to Play/Pause, Escape to Stop
  useEffect(() => {
    if (!isSupported) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in fields or select inputs
      const activeEl = document.activeElement;
      if (
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        activeEl?.tagName === "SELECT" ||
        activeEl?.getAttribute("role") === "combobox"
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault(); // Prevent scrolling down the page
        if (isContentEmpty) return;

        if (isPlaying) {
          pause();
        } else if (isPaused) {
          resume();
        } else {
          play(storyContent);
        }
      } else if (e.code === "Escape") {
        e.preventDefault();
        stop();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSupported, isPlaying, isPaused, isContentEmpty, storyContent, play, pause, resume, stop]);

  // Support Error State
  if (!isSupported) {
    return (
      <div 
        className="rounded-3xl p-6 text-center border font-display"
        style={{ 
          background: "rgba(239, 68, 68, 0.08)", 
          borderColor: "rgba(239, 68, 68, 0.2)" 
        }}
      >
        <HelpCircle className="w-10 h-10 mx-auto mb-2 text-red-400" />
        <h3 className="font-bold text-lg text-white mb-1">Audio Unavailable</h3>
        <p className="text-red-300 text-sm">
          Audio narration is not supported in this browser.
        </p>
      </div>
    );
  }

  // Define speech rates
  const speedRates = [
    { label: "0.5x", value: 0.5 },
    { label: "0.75x", value: 0.75 },
    { label: "1x", value: 1.0 },
    { label: "1.25x", value: 1.25 },
    { label: "1.5x", value: 1.5 },
    { label: "2x", value: 2.0 },
  ];

  return (
    <div 
      className="rounded-3xl p-6 relative overflow-hidden backdrop-blur-md shadow-xl text-white transition-all border flex flex-col justify-between"
      style={{ 
        background: "rgba(255, 255, 255, 0.04)", 
        borderColor: "rgba(255, 255, 255, 0.08)" 
      }}
    >
      {/* Decorative sparkles */}
      <div className="absolute top-3 right-3 opacity-30 animate-pulse">
        <Sparkles className="w-5 h-5 text-violet-300" />
      </div>

      {/* Header with Title and Current Voice */}
      <div className="mb-5 text-center">
        <h3 className="font-display text-lg font-extrabold line-clamp-1 pr-4">
          {storyTitle}
        </h3>
        <p className="text-xs text-white/50 mt-1 flex items-center justify-center gap-1">
          <MessageSquareDot className="w-3.5 h-3.5 text-violet-400" />
          Voice: <span className="text-violet-300 font-medium">{currentVoice?.name || "System Default"}</span>
        </p>
      </div>

      {/* Speaking Status Badge */}
      <div className="flex justify-center mb-5">
        <AnimateStatus isPlaying={isPlaying} isPaused={isPaused} isSpeaking={isSpeaking} />
      </div>

      {/* Main Action Controls */}
      <div className="flex items-center justify-center gap-6 mb-6">
        {/* Restart Button */}
        <motion.button
          onClick={() => !isContentEmpty && restart(storyContent)}
          disabled={isContentEmpty}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          className="w-11 h-11 rounded-full flex items-center justify-center border transition-colors disabled:opacity-40 disabled:pointer-events-none"
          style={{ 
            background: "rgba(255, 255, 255, 0.06)", 
            borderColor: "rgba(255, 255, 255, 0.1)" 
          }}
          title="Restart from beginning"
        >
          <RotateCcw className="w-4.5 h-4.5 text-white/80" />
        </motion.button>

        {/* Play / Pause / Resume Button */}
        {isPaused ? (
          <motion.button
            onClick={resume}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.04 }}
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
            style={{ 
              background: "linear-gradient(135deg, #7c5cbf, #a78bfa)", 
              boxShadow: "0 8px 25px rgba(124, 92, 191, 0.4)" 
            }}
            title="Resume narration"
          >
            <Play className="w-7 h-7 text-white ml-0.5" />
          </motion.button>
        ) : isPlaying ? (
          <motion.button
            onClick={pause}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.04 }}
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
            style={{ 
              background: "linear-gradient(135deg, #7c5cbf, #a78bfa)", 
              boxShadow: "0 8px 25px rgba(124, 92, 191, 0.4)" 
            }}
            title="Pause narration"
          >
            <Pause className="w-7 h-7 text-white" />
          </motion.button>
        ) : (
          <motion.button
            onClick={() => play(storyContent)}
            disabled={isContentEmpty}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.04 }}
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg disabled:opacity-40 disabled:pointer-events-none"
            style={{ 
              background: "linear-gradient(135deg, #7c5cbf, #a78bfa)", 
              boxShadow: "0 8px 25px rgba(124, 92, 191, 0.4)" 
            }}
            title="Play narration"
          >
            <Play className="w-7 h-7 text-white ml-0.5" />
          </motion.button>
        )}

        {/* Stop Button */}
        <motion.button
          onClick={stop}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          className="w-11 h-11 rounded-full flex items-center justify-center border transition-colors"
          style={{ 
            background: "rgba(255, 255, 255, 0.06)", 
            borderColor: "rgba(255, 255, 255, 0.1)" 
          }}
          title="Stop completely"
        >
          <Square className="w-4 h-4 text-white/80 fill-white/10" />
        </motion.button>
      </div>

      {/* Empty Content Notification */}
      {isContentEmpty && (
        <div className="mb-4 p-3 rounded-2xl text-center text-amber-300 text-xs font-semibold bg-amber-500/10 border border-amber-500/20">
          No narration available.
        </div>
      )}

      {/* Voice and Speed Selectors */}
      <div className="grid grid-cols-2 gap-4 mt-2">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-white/60 font-medium">Voice</Label>
          <Select 
            value={currentVoice?.name || ""} 
            onValueChange={(name) => {
              const matched = voices.find(v => v.name === name);
              if (matched) setVoice(matched);
            }}
          >
            <SelectTrigger className="bg-white/5 border-white/10 rounded-2xl text-white focus:ring-violet-400 hover:bg-white/10 transition-colors h-11">
              <SelectValue placeholder="System voice" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10 text-white rounded-2xl max-h-56">
              {voices.map((voice) => (
                <SelectItem 
                  key={voice.name} 
                  value={voice.name}
                  className="focus:bg-violet-600 focus:text-white cursor-pointer rounded-xl"
                >
                  {voice.name} ({voice.lang})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-white/60 font-medium">Speed</Label>
          <Select 
            value={rate.toString()} 
            onValueChange={(val) => setRate(parseFloat(val))}
          >
            <SelectTrigger className="bg-white/5 border-white/10 rounded-2xl text-white focus:ring-violet-400 hover:bg-white/10 transition-colors h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10 text-white rounded-2xl">
              {speedRates.map((speed) => (
                <SelectItem 
                  key={speed.value} 
                  value={speed.value.toString()}
                  className="focus:bg-violet-600 focus:text-white cursor-pointer rounded-xl"
                >
                  {speed.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

// Sub-component for clean status badge
const AnimateStatus = ({ 
  isPlaying, 
  isPaused, 
  isSpeaking 
}: { 
  isPlaying: boolean; 
  isPaused: boolean; 
  isSpeaking: boolean; 
}) => {
  if (isPaused) {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-300">
        <span className="w-2 h-2 rounded-full bg-amber-400" />
        Paused
      </div>
    );
  }

  if (isPlaying) {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        Speaking...
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-white/50">
      <span className="w-2 h-2 rounded-full bg-white/20" />
      Stopped
    </div>
  );
};
