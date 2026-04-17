import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";

// Royalty-free forest ambience loop
const FOREST_AUDIO =
  "https://cdn.pixabay.com/audio/2022/03/24/audio_d0c6ff1bab.mp3";

const AmbientSoundToggle = () => {
  const [on, setOn] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(FOREST_AUDIO);
    audio.loop = true;
    audio.volume = 0.35;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (on) {
      audio.pause();
      setOn(false);
    } else {
      try {
        await audio.play();
        setOn(true);
      } catch (e) {
        console.warn("Audio play blocked", e);
      }
    }
  };

  return (
    <motion.button
      onClick={toggle}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-full backdrop-blur-xl bg-white/20 border border-white/40 text-white shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
      aria-label={on ? "Mute forest sounds" : "Play forest sounds"}
      title={on ? "Mute forest sounds" : "Play forest sounds"}
    >
      {on ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
      <span className="text-xs font-bold hidden sm:inline">
        {on ? "Forest On" : "Forest Off"}
      </span>
    </motion.button>
  );
};

export default AmbientSoundToggle;
