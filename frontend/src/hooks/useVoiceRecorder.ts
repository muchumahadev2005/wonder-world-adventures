/**
 * useVoiceRecorder — Custom hook wrapping the Web Speech API (SpeechRecognition).
 *
 * Returns:
 *  - isSupported     : boolean — browser has SpeechRecognition
 *  - isListening     : boolean — currently recording
 *  - transcript      : string  — latest recognized text
 *  - startListening  : () => void
 *  - stopListening   : () => void
 *  - error           : string | null
 *
 * Auto-stops after ~4 s of silence.
 * Future-ready: swap Web Speech for a cloud STT provider without UI changes.
 */

import { useState, useRef, useCallback, useEffect } from "react";

// ── Speech Recognition Type Declarations ──────────────────────────

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

// Browser vendor-prefix check
const getSpeechRecognition = (): (new () => SpeechRecognition) | null => {
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as
    | (new () => SpeechRecognition)
    | null;
};

export interface UseVoiceRecorderResult {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  error: string | null;
}

export function useVoiceRecorder(lang = "en-US"): UseVoiceRecorderResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSupported = typeof window !== "undefined" && !!getSpeechRecognition();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const startListening = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) {
      setError("Speech recognition is not supported in this browser. Please use Chrome.");
      return;
    }

    // Reset state
    setTranscript("");
    setError(null);

    const recognition = new SR();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = false;      // auto-stop after one utterance
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Reset silence timer on every partial result
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        recognition.stop();
      }, 4000); // 4 s silence → auto-stop

      let finalText = "";
      let interimText = "";
      for (let i = 0; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) {
          finalText += r[0].transcript;
        } else {
          interimText += r[0].transcript;
        }
      }
      setTranscript(finalText || interimText);
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech") {
        setError("No speech detected. Tap the microphone and try again.");
      } else if (event.error === "not-allowed") {
        setError("Microphone permission denied. Please allow microphone access.");
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [lang]);

  return { isSupported, isListening, transcript, startListening, stopListening, error };
}
