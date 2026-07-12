import { useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Play, Pause, Square, RotateCcw, Volume2, 
  VolumeX, HelpCircle, Sparkles, MessageSquareDot 
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface StoryAudioPlayerProps {
  storyTitle: string;
  storyContent: string;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  currentVoice: SpeechSynthesisVoice | null;
  rate: number;
  pitch: number;
  volume: number;
  isPlaying: boolean;
  isPaused: boolean;
  isSpeaking: boolean;
  setRate: (rate: number) => void;
  setPitch: (pitch: number) => void;
  setVolume: (volume: number) => void;
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
        className="rounded-3xl p-6 text-center border"
        style={{ 
          background: "rgba(239, 68, 68, 0.08)", 
          borderColor: "rgba(239, 68, 68, 0.2)" 
        }}
      >
        <HelpCircle className="w-10 h-10 mx-auto mb-2 text-red-400" />
        <h3 className="font-display font-bold text-lg text-white mb-1">Audio Unavailable</h3>
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
      className="rounded-3xl p-6 relative overflow-hidden backdrop-blur-md shadow-xl text-white transition-all border"
      style={{ 
        background: "rgba(255, 255, 255, 0.05)", 
        borderColor: "rgba(255, 255, 255, 0.08)" 
      }}
    >
      {/* Decorative sparkles */}
      <div className="absolute top-3 right-3 opacity-30 animate-pulse">
        <Sparkles className="w-5 h-5 text-violet-300" />
      </div>

      {/* Header with Title and Current Voice */}
      <div className="mb-6 text-center">
        <h3 className="font-display text-lg font-extrabold line-clamp-1 pr-4">
          {storyTitle}
        </h3>
        <p className="text-xs text-white/50 mt-1 flex items-center justify-center gap-1">
          <MessageSquareDot className="w-3.5 h-3.5 text-violet-400" />
          Voice: <span className="text-violet-300 font-medium">{currentVoice?.name || "System Default"}</span>
        </p>
      </div>

      {/* Speaking Status Badge */}
      <div className="flex justify-center mb-6">
        <AnimateStatus isPlaying={isPlaying} isPaused={isPaused} isSpeaking={isSpeaking} />
      </div>

      {/* Main Action Controls */}
      <div className="flex items-center justify-center gap-6 mb-8">
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
        <div className="mb-6 p-3 rounded-2xl text-center text-amber-300 text-xs font-semibold bg-amber-500/10 border border-amber-500/20">
          No narration available.
        </div>
      )}

      {/* Voice and Speed Selectors */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <Label className="text-xs text-white/60 mb-1.5 block">Voice</Label>
          <Select 
            value={currentVoice?.name || ""} 
            onValueChange={(name) => {
              const matched = voices.find(v => v.name === name);
              if (matched) setVoice(matched);
            }}
          >
            <SelectTrigger className="bg-white/5 border-white/10 rounded-xl text-white focus:ring-violet-400">
              <SelectValue placeholder="System voice" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10 text-white rounded-xl max-h-56">
              {voices.map((voice) => (
                <SelectItem 
                  key={voice.name} 
                  value={voice.name}
                  className="focus:bg-violet-600 focus:text-white cursor-pointer"
                >
                  {voice.name} ({voice.lang})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-white/60 mb-1.5 block">Speed</Label>
          <Select 
            value={rate.toString()} 
            onValueChange={(val) => setRate(parseFloat(val))}
          >
            <SelectTrigger className="bg-white/5 border-white/10 rounded-xl text-white focus:ring-violet-400">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10 text-white rounded-xl">
              {speedRates.map((speed) => (
                <SelectItem 
                  key={speed.value} 
                  value={speed.value.toString()}
                  className="focus:bg-violet-600 focus:text-white cursor-pointer"
                >
                  {speed.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pitch and Volume Sliders */}
      <div className="space-y-4">
        {/* Volume Slider */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-white/60 flex items-center gap-1.5">
              {volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-white/40" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-white/70" />
              )}
              Volume
            </span>
            <span className="text-white/40 font-mono">{Math.round(volume * 100)}%</span>
          </div>
          <Slider
            defaultValue={[1]}
            min={0}
            max={1}
            step={0.05}
            value={[volume]}
            onValueChange={([val]) => setVolume(val)}
            className="[&_[role=slider]]:bg-violet-400 [&_[role=slider]]:border-violet-400 [&_span]:bg-violet-500/20"
          />
        </div>

        {/* Pitch Slider */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-white/60">Pitch (Tone)</span>
            <span className="text-white/40 font-mono">{pitch.toFixed(1)}</span>
          </div>
          <Slider
            defaultValue={[1]}
            min={0.5}
            max={2.0}
            step={0.1}
            value={[pitch]}
            onValueChange={([val]) => setPitch(val)}
            className="[&_[role=slider]]:bg-violet-400 [&_[role=slider]]:border-violet-400 [&_span]:bg-violet-500/20"
          />
        </div>
      </div>
    </div>
  );
};

// Sub-component for clean status badge with indicator light
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
