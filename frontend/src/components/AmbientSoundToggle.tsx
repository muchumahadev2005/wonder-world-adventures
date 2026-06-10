import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX, Loader2 } from "lucide-react";

// Multiple fallback sources for the forest ambient sound
const AUDIO_SOURCES = [
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // reliable fallback
  "https://assets.mixkit.co/sfx/preview/mixkit-forest-birds-ambience-1211.mp3",
  "https://cdn.pixabay.com/audio/2022/03/24/audio_d0c6ff1bab.mp3",
];

const AmbientSoundToggle = () => {
  const [on, setOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sourceIndexRef = useRef(0);

  const createAudio = (srcIndex = 0) => {
    if (srcIndex >= AUDIO_SOURCES.length) {
      setFailed(true);
      setLoading(false);
      return null;
    }
    const audio = new Audio(AUDIO_SOURCES[srcIndex]);
    audio.loop = true;
    audio.volume = 0.35;
    audio.preload = "none";

    audio.addEventListener("error", () => {
      // Try next source on error
      const next = srcIndex + 1;
      sourceIndexRef.current = next;
      const fallback = createAudio(next);
      if (fallback) {
        audioRef.current = fallback;
      }
    });

    return audio;
  };

  useEffect(() => {
    const audio = createAudio(0);
    if (audio) audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (on) {
      audio.pause();
      setOn(false);
      return;
    }

    setLoading(true);
    setFailed(false);

    // Try each source until one works
    const tryPlay = async (srcIndex: number): Promise<boolean> => {
      if (srcIndex >= AUDIO_SOURCES.length) return false;

      const src = AUDIO_SOURCES[srcIndex];
      try {
        audio.src = src;
        audio.load();
        await audio.play();
        return true;
      } catch {
        // Try next source
        return tryPlay(srcIndex + 1);
      }
    };

    const success = await tryPlay(sourceIndexRef.current);

    if (success) {
      setOn(true);
      setFailed(false);
    } else {
      // Last resort: use Web Audio API to generate nature-like tones
      playGeneratedAmbience();
    }
    setLoading(false);
  };

  // Web Audio API fallback — generates a gentle ambient hum
  const oscillatorNodesRef = useRef<OscillatorNode[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playGeneratedAmbience = () => {
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const nodes: OscillatorNode[] = [];

      // Create soft nature-like tones (birds / wind simulation)
      const frequencies = [220, 330, 440, 165, 110];
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i % 2 === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // Gentle LFO modulation for natural feel
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.1 + i * 0.05, ctx.currentTime);
        lfoGain.gain.setValueAtTime(5, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();

        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        nodes.push(osc);
      });

      oscillatorNodesRef.current = nodes;
      setOn(true);
    } catch {
      setFailed(true);
    }
  };

  const stopGeneratedAmbience = () => {
    oscillatorNodesRef.current.forEach((osc) => {
      try { osc.stop(); } catch { /* already stopped */ }
    });
    oscillatorNodesRef.current = [];
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  };

  const handleToggle = async () => {
    if (on) {
      // Stop everything
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      stopGeneratedAmbience();
      setOn(false);
    } else {
      await toggle();
    }
  };

  const label = failed
    ? "Sound unavailable"
    : loading
    ? "Loading…"
    : on
    ? "Forest On"
    : "Forest Off";

  return (
    <motion.button
      onClick={handleToggle}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      disabled={loading}
      className={`fixed bottom-24 right-4 md:bottom-5 md:right-5 z-[60] flex items-center gap-2 px-3 py-2.5 md:px-4 md:py-3 rounded-full backdrop-blur-xl border text-white shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-all ${
        failed
          ? "bg-red-500/30 border-red-400/40"
          : on
          ? "bg-green-500/30 border-green-400/50"
          : "bg-white/20 border-white/40"
      }`}
      aria-label={on ? "Mute forest sounds" : "Play forest sounds"}
      title={on ? "Mute forest sounds" : "Play forest sounds"}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : on ? (
        <Volume2 className="w-5 h-5" />
      ) : (
        <VolumeX className="w-5 h-5" />
      )}
      <span className="text-xs font-bold hidden sm:inline">{label}</span>
    </motion.button>
  );
};

export default AmbientSoundToggle;
