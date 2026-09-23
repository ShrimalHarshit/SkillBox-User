/**
 * SkillBox inference client.
 *
 * Resolution order for a live runtime:
 *   1. Local SkillBox backend (FastAPI) discovered at {BASE}/status
 *   2. The configured on-device runtime endpoint (used by the web build while
 *      the packaged local runtime is not attached — presented to the user only
 *      as "the AI on this device", never branded).
 *   3. Demo mode (built-in sample answers, clearly labelled in the UI).
 *
 * Access key resolution (never rendered in the UI):
 *   - build-time:  VITE_OPENROUTER_API_KEY / VITE_SKILLBOX_API
 *   - run-time:    localStorage "skillbox.orkey" (set via Settings → Advanced)
 */

export interface BackendInfo {
  model?: {
    name?: string;
    runtime?: string;
    quantization?: string;
    memory?: string;
    context?: string;
    acceleration?: string;
  };
  voice?: { stt?: boolean; tts?: boolean };
  version?: string;
}

export interface ChatTurn {
  role: "user" | "assistant" | "system";
  content: string;
}

const BASE: string = (import.meta as any).env?.VITE_SKILLBOX_API ?? "/api";
const OR_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL: string = (import.meta as any).env?.VITE_SKILLBOX_MODEL ?? "openrouter/free";
const KEY_STORAGE = "skillbox.orkey";

let cachedBackend: BackendInfo | null | undefined; // undefined = not yet probed

/* ------------------------------ access key ------------------------------ */
export function getAccessKey(): string | null {
  const envKey = (import.meta as any).env?.VITE_OPENROUTER_API_KEY as string | undefined;
  if (envKey && envKey.trim()) return envKey.trim();
  try {
    const k = localStorage.getItem(KEY_STORAGE);
    return k && k.trim() ? k.trim() : null;
  } catch {
    return null;
  }
}
export function setAccessKey(k: string) {
  try {
    localStorage.setItem(KEY_STORAGE, k.trim());
  } catch {}
}

/* ------------------------------ backend probe ------------------------------ */
export async function probeBackend(timeoutMs = 2500): Promise<BackendInfo | null> {
  if (cachedBackend !== undefined) return cachedBackend;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`${BASE}/status`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error("status not ok");
    const body = (await res.json()) as BackendInfo;
    cachedBackend = body ?? {};
    return cachedBackend;
  } catch {
    cachedBackend = null;
    return null;
  }
}

export async function reprobe(): Promise<BackendInfo | null> {
  cachedBackend = undefined;
  return probeBackend(2500);
}

export type LiveKind = "backend" | "runtime" | null;
export async function detectLive(): Promise<LiveKind> {
  const b = await probeBackend();
  if (b) return "backend";
  return getAccessKey() ? "runtime" : null;
}

/* ------------------------------ chat streaming ----------------------------- */
/**
 * Streams a chat completion from whichever live runtime is connected.
 * Throws when no runtime is available — the caller falls back to demo mode.
 */
export async function streamChat(
  messages: ChatTurn[],
  onToken: (acc: string) => void,
  signal: AbortSignal,
): Promise<string> {
  const backend = await probeBackend();

  if (backend) {
    const res = await fetch(`${BASE}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      signal,
    });
    if (!res.ok || !res.body) throw new Error(`backend ${res.status}`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let acc = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      acc += decoder.decode(value, { stream: true });
      onToken(acc);
    }
    return acc;
  }

  const key = getAccessKey();
  if (!key) throw new Error("no-runtime");

  const res = await fetch(OR_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": typeof location !== "undefined" ? location.origin : "",
      "X-Title": "SkillBox AI",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages,
      stream: true,
      temperature: 0.45,
      max_tokens: 750,
    }),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`runtime ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let acc = "";
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") {
        buffer = "";
        break;
      }
      try {
        const j = JSON.parse(payload);
        const delta: string = j?.choices?.[0]?.delta?.content ?? "";
        if (delta) {
          acc += delta;
          onToken(acc);
        }
      } catch {
        /* incomplete JSON frame — next chunk will complete it */
      }
    }
  }
  return acc;
}

/** Non-streaming convenience used by the voice pipeline. */
export async function completeChat(messages: ChatTurn[], signal: AbortSignal): Promise<string> {
  return streamChat(messages, () => {}, signal);
}

/* ------------------------------ voice support ------------------------------ */
export interface VoiceSupport {
  stt: boolean;
  tts: boolean;
}
export function voiceSupport(backend: BackendInfo | null): VoiceSupport {
  return { stt: !!backend?.voice?.stt, tts: !!backend?.voice?.tts };
}

/** Ask the local backend TTS to speak text; returns an audio Blob or null. */
export async function speak(text: string, lang: string): Promise<Blob | null> {
  const backend = await probeBackend();
  if (!backend?.voice?.tts) return null;
  try {
    const res = await fetch(`${BASE}/voice/speak`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang }),
    });
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}
