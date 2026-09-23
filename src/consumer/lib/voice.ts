/**
 * On-device voice loop: browser-provided speech recognition + on-device
 * speech synthesis, wrapped cleanly so the backend STT/TTS can take over
 * later without touching the UI.
 */
import type { Lang } from "./i18n";

const LOCALE: Record<Lang, string> = { en: "en-IN", hi: "hi-IN", mr: "mr-IN" };

/* ------------------------------ speech → text ------------------------------ */
type SR = typeof window extends never ? never : any;

export function isSTTSupported(): boolean {
  return typeof window !== "undefined" && !!(window as any).SpeechRecognition || !!(window as any)?.webkitSpeechRecognition;
}

export interface ListenHandle {
  stop: () => void;
}

export function startListening(opts: {
  lang: Lang;
  onInterim?: (text: string) => void;
  onFinal: (text: string) => void;
  onError?: (kind: string) => void;
  onEnd?: () => void;
}): ListenHandle | null {
  const SR: SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) return null;
  const rec = new SR();
  rec.lang = LOCALE[opts.lang];
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;

  let stopped = false;
  let gotFinal = false;

  rec.onresult = (e: any) => {
    let interim = "";
    let final = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const tr = e.results[i][0]?.transcript ?? "";
      if (e.results[i].isFinal) final += tr;
      else interim += tr;
    }
    if (interim) opts.onInterim?.(interim);
    if (final.trim() && !gotFinal) {
      gotFinal = true;
      stopped = true;
      try { rec.stop(); } catch {}
      opts.onFinal(final.trim());
    }
  };
  rec.onerror = (e: any) => {
    if (!stopped) {
      stopped = true;
      opts.onError?.(e?.error ?? "error");
    }
  };
  rec.onend = () => {
    if (!stopped) {
      stopped = true;
      opts.onEnd?.();
    }
  };
  try {
    rec.start();
  } catch {
    return null;
  }
  return {
    stop: () => {
      stopped = true;
      try { rec.stop(); } catch {}
      try { rec.abort(); } catch {}
    },
  };
}

/* ------------------------------ text → speech ------------------------------ */
export function isTTSSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let pendingVoices: Promise<SpeechSynthesisVoice[]> | null = null;
function getVoicesOnce(): Promise<SpeechSynthesisVoice[]> {
  if (!isTTSSupported()) return Promise.resolve([]);
  const v = window.speechSynthesis.getVoices();
  if (v.length) return Promise.resolve(v);
  if (!pendingVoices) {
    pendingVoices = new Promise((resolve) => {
      const t = setTimeout(() => resolve(window.speechSynthesis.getVoices()), 400);
      window.speechSynthesis.onvoiceschanged = () => {
        clearTimeout(t);
        resolve(window.speechSynthesis.getVoices());
      };
    });
  }
  return pendingVoices;
}

function pickVoice(voices: SpeechSynthesisVoice[], lang: Lang): SpeechSynthesisVoice | null {
  const prefixed = [LOCALE[lang], LOCALE[lang].split("-")[0]];
  // Marathi often falls back to Hindi voices — acceptable, still Devanagari
  if (lang === "mr") prefixed.push("hi-IN", "hi");
  if (lang === "en") prefixed.push("en-GB", "en-US", "en");
  for (const p of prefixed) {
    const hit = voices.find((v) => v.lang.toLowerCase().startsWith(p.toLowerCase()));
    if (hit) return hit;
  }
  return voices[0] ?? null;
}

export interface SpeakHandle {
  cancel: () => void;
}

/** Speak `text`; reports synthesized amplitude via onBoundary so the orb can dance. */
export async function speakText(opts: {
  text: string;
  lang: Lang;
  rate: number;
  onBoundary?: (charIndex: number) => void;
  onEnd?: () => void;
}): Promise<SpeakHandle> {
  if (!isTTSSupported()) {
    opts.onEnd?.();
    return { cancel: () => {} };
  }
  const { text, lang, rate } = opts;
  const synth = window.speechSynthesis;
  try { synth.cancel(); } catch {}
  const voices = await getVoicesOnce();

  const utter = new SpeechSynthesisUtterance(text);
  const voice = pickVoice(voices, lang);
  if (voice) {
    utter.voice = voice;
    utter.lang = voice.lang;
  } else {
    utter.lang = LOCALE[lang];
  }
  utter.rate = rate;
  utter.pitch = 1;

  let done = false;
  const finish = () => {
    if (!done) {
      done = true;
      opts.onEnd?.();
    }
  };
  utter.onend = finish;
  utter.onerror = finish;
  utter.onboundary = (e) => {
    if (typeof e.charIndex === "number") opts.onBoundary?.(e.charIndex);
  };
  synth.speak(utter);

  // safety: some engines never fire onend for short strings
  const guard = setTimeout(finish, Math.max(4000, text.length * 120 / rate));

  return {
    cancel: () => {
      clearTimeout(guard);
      done = true;
      try { synth.cancel(); } catch {}
    },
  };
}
