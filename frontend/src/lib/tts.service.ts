/**
 * TTS Service — Text-to-Speech with provider abstraction
 *
 * Phase 1: Browser SpeechSynthesis API
 * Phase 2: Google Cloud TTS / Azure Speech / Amazon Polly (provider interface ready)
 */

// ── Language mapping ─────────────────────────────────────────────

const LANG_MAP: Record<string, string> = {
  en: "en-US",
  te: "te-IN",
  hi: "hi-IN",
  ta: "ta-IN",
};

// ── Provider Interface ───────────────────────────────────────────

export interface TTSOptions {
  rate?: number; // 0.5 - 2.0 (default 0.8 for children)
  pitch?: number; // 0 - 2
  volume?: number; // 0 - 1
  voice?: string; // voice name
  onEnd?: () => void;
  onError?: (err: Error) => void;
}

interface TTSProvider {
  speak(text: string, lang: string, options?: TTSOptions): void;
  stop(): void;
  pause(): void;
  resume(): void;
  isSpeaking(): boolean;
}

// ── Browser Provider (Phase 1) ───────────────────────────────────

class BrowserTTSProvider implements TTSProvider {
  private synth: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private defaultRate = 0.8;
  private voiceCache: Map<string, SpeechSynthesisVoice> = new Map();

  constructor() {
    this.synth = window.speechSynthesis;
    // Pre-warm voice list (some browsers load async)
    this.synth.getVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.cacheVoices();
    }
    setTimeout(() => this.cacheVoices(), 200);
  }

  private cacheVoices() {
    const voices = this.synth.getVoices();
    for (const v of voices) {
      if (!this.voiceCache.has(v.lang)) {
        this.voiceCache.set(v.lang, v);
      }
    }
  }

  private findVoice(lang: string, voiceName?: string): SpeechSynthesisVoice | undefined {
    const voices = this.synth.getVoices();
    if (voiceName) {
      const found = voices.find((v) => v.name === voiceName);
      if (found) return found;
    }
    const mappedLang = LANG_MAP[lang] || lang;
    // Prefer Google voices (better quality)
    const google = voices.find((v) => v.lang.startsWith(mappedLang.split("-")[0]) && v.name.includes("Google"));
    if (google) return google;
    return voices.find((v) => v.lang.startsWith(mappedLang.split("-")[0]));
  }

  speak(text: string, lang: string, options: TTSOptions = {}) {
    this.stop();
    const utterance = new SpeechSynthesisUtterance(text);
    const mappedLang = LANG_MAP[lang] || lang;
    utterance.lang = mappedLang;
    utterance.rate = options.rate ?? this.defaultRate;
    utterance.pitch = options.pitch ?? 1;
    utterance.volume = options.volume ?? 1;

    const voice = this.findVoice(lang, options.voice);
    if (voice) utterance.voice = voice;

    if (options.onEnd) utterance.onend = () => options.onEnd!();
    if (options.onError) utterance.onerror = (e) => options.onError!(new Error(e.error));

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  stop() {
    this.synth.cancel();
    this.currentUtterance = null;
  }

  pause() {
    this.synth.pause();
  }

  resume() {
    this.synth.resume();
  }

  isSpeaking() {
    return this.synth.speaking;
  }

  setDefaultRate(rate: number) {
    this.defaultRate = Math.max(0.5, Math.min(2, rate));
  }

  getAvailableVoices(lang?: string): SpeechSynthesisVoice[] {
    const voices = this.synth.getVoices();
    if (!lang) return voices;
    const mappedLang = LANG_MAP[lang] || lang;
    return voices.filter((v) => v.lang.startsWith(mappedLang.split("-")[0]));
  }
}

// ── Provider Factory ─────────────────────────────────────────────

// Phase 2 stubs — implement when cloud TTS is needed
// class GoogleCloudTTSProvider implements TTSProvider { ... }
// class AzureSpeechTTSProvider implements TTSProvider { ... }
// class AmazonPollyTTSProvider implements TTSProvider { ... }

// ── Singleton ────────────────────────────────────────────────────

let _provider: BrowserTTSProvider | null = null;

const getProvider = (): BrowserTTSProvider => {
  if (!_provider) {
    _provider = new BrowserTTSProvider();
  }
  return _provider;
};

// ── Exported Functions ───────────────────────────────────────────

export function speakText(text: string, lang: string, options?: TTSOptions): void {
  getProvider().speak(text, lang, options);
}

export function stopSpeaking(): void {
  getProvider().stop();
}

export function pauseSpeaking(): void {
  getProvider().pause();
}

export function resumeSpeaking(): void {
  getProvider().resume();
}

export function isSpeaking(): boolean {
  return getProvider().isSpeaking();
}

export function getAvailableVoices(lang?: string): SpeechSynthesisVoice[] {
  return getProvider().getAvailableVoices(lang);
}

export function setSpeed(rate: number): void {
  getProvider().setDefaultRate(rate);
}

export const SUPPORTED_LANGUAGES = Object.keys(LANG_MAP);
