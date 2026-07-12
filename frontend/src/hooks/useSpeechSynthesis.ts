import { useState, useEffect, useCallback, useRef } from "react";

export interface SpeechSynthesisHookOptions {
  storyLanguage?: string;
  storyId?: string;
}

export const useSpeechSynthesis = (options: SpeechSynthesisHookOptions = {}) => {
  const { storyLanguage, storyId } = options;
  
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentVoice, setCurrentVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState<number>(1); // Speed: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x
  const [pitch, setPitch] = useState<number>(1); // Pitch: 0 to 2
  const [volume, setVolume] = useState<number>(1); // Volume: 0 to 1
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check support and load voices
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsSupported(true);
      
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
      };

      loadVoices();
      
      // Chrome/Safari load voices asynchronously, need to listen to onvoiceschanged
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  // Helper to find the best English female voice
  const findDefaultEnglishVoice = useCallback((voiceList: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
    const englishVoices = voiceList.filter(
      (v) => v.lang.toLowerCase().startsWith("en") || v.lang.toLowerCase().includes("en-")
    );
    if (englishVoices.length === 0) return voiceList[0] || null;

    // Search for known English Female voice names
    const femaleKeywords = ["female", "zira", "samantha", "susan", "hazel", "karen", "moira", "tessa", "veena", "victoria", "siri"];
    const femaleVoice = englishVoices.find((v) => {
      const nameLower = v.name.toLowerCase();
      return femaleKeywords.some((keyword) => nameLower.includes(keyword));
    });

    return femaleVoice || englishVoices[0];
  }, []);

  // Helper to find the closest voice matching the specified language
  const findVoiceForLanguage = useCallback((voiceList: SpeechSynthesisVoice[], langCode?: string): SpeechSynthesisVoice | null => {
    if (!langCode) {
      return findDefaultEnglishVoice(voiceList);
    }

    const codeLower = langCode.toLowerCase();
    
    // Find voices matching the language code (e.g. "es" for Spanish, "fr" for French)
    const matches = voiceList.filter(
      (v) =>
        v.lang.toLowerCase() === codeLower ||
        v.lang.toLowerCase().startsWith(codeLower + "-") ||
        v.lang.toLowerCase().split("-")[0] === codeLower
    );

    if (matches.length === 0) {
      // Fallback to default English voice
      return findDefaultEnglishVoice(voiceList);
    }

    // If it's English, try to get the best female english voice
    if (codeLower.startsWith("en")) {
      return findDefaultEnglishVoice(matches);
    }

    // For other languages, try to find a female voice if possible, otherwise first match
    const femaleKeywords = ["female", "zira", "samantha", "susan", "hazel", "karen", "moira", "tessa", "veena", "victoria", "siri", "sabina", "helena", "laura"];
    const femaleVoice = matches.find((v) => {
      const nameLower = v.name.toLowerCase();
      return femaleKeywords.some((keyword) => nameLower.includes(keyword));
    });

    return femaleVoice || matches[0];
  }, [findDefaultEnglishVoice]);

  // Select closest matching voice when storyLanguage or available voices change
  useEffect(() => {
    if (voices.length > 0) {
      const matchingVoice = findVoiceForLanguage(voices, storyLanguage);
      setCurrentVoice(matchingVoice);
    }
  }, [storyLanguage, voices, findVoiceForLanguage]);

  // Stop previous speech if storyId changes
  useEffect(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      setIsSpeaking(false);
    }
  }, [storyId, isSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setIsSpeaking(false);
    utteranceRef.current = null;
  }, [isSupported]);

  const play = useCallback((textToSpeak: string) => {
    if (!isSupported || !textToSpeak) return;

    // Stop any running speech first
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utteranceRef.current = utterance;

    // Configure options
    if (currentVoice) utterance.voice = currentVoice;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    // Setup event handlers
    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setIsSpeaking(false);
    };

    utterance.onerror = (e) => {
      // Don't report "interrupted" since we call cancel() intentionally to start another story
      if (e.error !== "interrupted") {
        console.error("SpeechSynthesis error:", e);
        setIsPlaying(false);
        setIsPaused(false);
        setIsSpeaking(false);
      }
    };

    utterance.onpause = () => {
      setIsPlaying(false);
      setIsPaused(true);
    };

    utterance.onresume = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [isSupported, currentVoice, rate, pitch, volume]);

  const pause = useCallback(() => {
    if (!isSupported) return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      setIsPaused(true);
    }
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
    }
  }, [isSupported]);

  const restart = useCallback((textToSpeak: string) => {
    stop();
    // Use short timeout to ensure cancel finishes before next speak
    setTimeout(() => {
      play(textToSpeak);
    }, 50);
  }, [stop, play]);

  return {
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
    setVoice: setCurrentVoice,
    play,
    pause,
    resume,
    stop,
    restart,
  };
};
