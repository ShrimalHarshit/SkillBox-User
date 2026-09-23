import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Phone, Keyboard, X, Send } from "lucide-react";
import { useApp, useRuntime } from "../store/app";
import { translate } from "../lib/i18n";
import { skillVisual } from "../components/chat";
import { SkillIcon } from "../components/core";
import { Badge } from "../components/ui";
import { LanguageMenu } from "../components/LanguageMenu";
import { Markdown } from "../components/chat";
import { generateReply } from "../lib/engine";
import { completeChat } from "../api/client";
import { buildMessages, speakable } from "../lib/skillPrompts";
import { startListening, speakText, isSTTSupported, isTTSSupported, type ListenHandle } from "../lib/voice";
import { cn } from "../lib/utils";

type VoiceState = "idle" | "listening" | "thinking" | "speaking";

/* ------------------------------ voice orb canvas ------------------------------ */
const BRAND = "#1B9E73";
const BRAND_LIGHT = "#3FBB8C";

function VoiceOrb({ state, getLevel }: { state: VoiceState; getLevel: () => number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const levelRef = useRef(getLevel);
  levelRef.current = getLevel;
  const smooth = useRef(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const particles = Array.from({ length: 14 }, (_, i) => ({
      a: (i / 14) * Math.PI * 2,
      r: 1 + Math.random(),
      s: 0.6 + Math.random() * 0.8,
    }));

    const draw = (t: number) => {
      const size = canvas.clientWidth;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (canvas.width !== size * dpr || canvas.height !== size * dpr) {
        canvas.width = size * dpr;
        canvas.height = size * dpr;
      }
      const S = size * dpr;
      const cx = S / 2;
      const cy = S / 2;
      const st = stateRef.current;
      const dark = document.documentElement.classList.contains("dark");

      const target = Math.min(1, levelRef.current());
      smooth.current += (target - smooth.current) * 0.14;
      const level = reduced ? 0 : smooth.current;

      ctx.clearRect(0, 0, S, S);
      const base = S * 0.21;

      const breath = st === "idle" ? 1 + Math.sin(t / 1600) * 0.022 : 1 + Math.sin(t / 1200) * 0.013;
      const thinkingPulse = st === "thinking" ? 0.06 + 0.05 * Math.sin(t / 500) : 0;
      const energy = st === "listening" || st === "speaking" ? level : thinkingPulse;
      const R = base * breath * (1 + energy * 0.55);

      for (let i = 1; i <= 3; i++) {
        const wave = energy * (S * 0.028) * i + Math.sin(t / 900 + i * 1.7) * (S * 0.006);
        const rr = R + i * (S * 0.045) + wave;
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        const alpha = Math.max(0.04, (0.16 - i * 0.035) * (0.5 + energy * 1.7));
        ctx.strokeStyle = dark
          ? `rgba(120, 222, 182, ${alpha})`
          : `rgba(27, 158, 115, ${alpha})`;
        ctx.lineWidth = S * 0.004;
        ctx.stroke();
      }

      if (st === "thinking" || st === "idle") {
        const speed = st === "thinking" ? t / 2400 : t / 7000;
        const alpha = st === "thinking" ? 0.5 : 0.22;
        for (const p of particles) {
          const a = p.a + speed * p.s;
          const rr = R + S * 0.05 * p.r;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, S * 0.006, 0, Math.PI * 2);
          ctx.fillStyle = dark
            ? `rgba(140, 225, 190, ${alpha * (0.5 + 0.5 * Math.sin(t / 400 + p.a * 7))})`
            : `rgba(20, 140, 100, ${alpha * (0.5 + 0.5 * Math.sin(t / 400 + p.a * 7))})`;
          ctx.fill();
        }
      }

      const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
      g.addColorStop(0, BRAND_LIGHT);
      g.addColorStop(1, dark ? "#0B6B4C" : BRAND);
      ctx.shadowColor = dark ? "rgba(60, 200, 150, 0.35)" : "rgba(27, 158, 115, 0.36)";
      ctx.shadowBlur = S * 0.06 * (0.5 + energy * 1.6);
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(cx - R * 0.28, cy - R * 0.32, R * 0.36, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      ctx.fill();

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} className="h-[240px] w-[240px]" aria-hidden />;
}

/* ------------------------------- transcript turn ------------------------------ */
interface Turn {
  role: "user" | "assistant";
  text: string;
}

export default function Voice() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const lang = useApp((s) => s.lang);
  const defaultSkillId = useApp((s) => s.defaultSkillId);
  const responseStyle = useApp((s) => s.responseStyle);
  const voiceSpeed = useApp((s) => s.voiceSpeed);
  const live = useRuntime((s) => s.live);
  const skillId = params.get("skill") || defaultSkillId;
  const v = skillVisual(skillId);
  const t = (k: string) => translate(lang, k);

  const [state, setState] = useState<VoiceState>("idle");
  const stateRef = useRef<VoiceState>("idle");
  const setPhase = (s: VoiceState) => { stateRef.current = s; setState(s); };

  const [turns, setTurns] = useState<Turn[]>([]);
  const turnsRef = useRef<Turn[]>([]);
  const pushTurn = (turn: Turn) => {
    turnsRef.current = [...turnsRef.current, turn];
    setTurns(turnsRef.current);
  };
  const patchLastAssistant = (text: string) => {
    const list = [...turnsRef.current];
    const i = list.length - 1;
    if (i >= 0 && list[i].role === "assistant") list[i] = { role: "assistant", text };
    else list.push({ role: "assistant", text });
    turnsRef.current = list;
    setTurns(list);
  };

  const [showInput, setShowInput] = useState(false);
  const [draft, setDraft] = useState("");
  const [interim, setInterim] = useState("");
  const [muted, setMuted] = useState(false);
  const [micDenied, setMicDenied] = useState(false);

  const micLevel = useRef(0);
  const speakLevel = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const recogRef = useRef<ListenHandle | null>(null);
  const speechRef = useRef<{ cancel: () => void } | null>(null);
  const busyRef = useRef(false);
  const unmountedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const langRef = useRef(lang);
  langRef.current = lang;

  const sttOk = isSTTSupported();
  const ttsOk = isTTSSupported();

  /* -------------------------- mic amplitude (orb input) -------------------------- */
  useEffect(() => {
    let ctx: AudioContext | null = null;
    let raf = 0;
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ audio: true })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((tr) => tr.stop()); return; }
        streamRef.current = stream;
        ctx = new AudioContext();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        const data = new Float32Array(analyser.fftSize);
        const poll = () => {
          analyser.getFloatTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
          micLevel.current = Math.min(1, Math.sqrt(sum / data.length) * 3.2);
          raf = requestAnimationFrame(poll);
        };
        poll();
      })
      .catch(() => setMicDenied(true));
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      ctx?.close().catch(() => {});
    };
  }, []);

  /* orb level: mic while listening, speech-driven pulse while speaking */
  const getLevel = useCallback(() => {
    if (stateRef.current === "listening") return micLevel.current;
    if (stateRef.current === "speaking") {
      speakLevel.current *= 0.965;
      const wave = 0.35 + 0.3 * Math.abs(Math.sin(Date.now() / 150)) + speakLevel.current;
      return Math.min(1, wave);
    }
    return 0;
  }, []);

  /* ------------------------------ listening control ----------------------------- */
  const beginListening = useCallback(() => {
    if (unmountedRef.current || busyRef.current) return;
    if (!sttOk || micDenied) {
      if (stateRef.current === "listening") setShowInput(true);
      return;
    }
    recogRef.current?.stop();
    const handle = startListening({
      lang: langRef.current,
      onInterim: (txt) => setInterim(txt),
      onFinal: (txt) => {
        setInterim("");
        busyRef.current = true;
        respondRef.current(txt);
      },
      onError: (kind) => {
        if (kind === "not-allowed" || kind === "service-not-allowed") {
          setMicDenied(true);
          setShowInput(true);
        } else if (stateRef.current === "listening" && !busyRef.current) {
          // no-speech / network hiccup → quietly re-arm
          setTimeout(() => {
            if (!unmountedRef.current && stateRef.current === "listening" && !busyRef.current) beginListening();
          }, 400);
        }
      },
      onEnd: () => {
        if (stateRef.current === "listening" && !busyRef.current && !unmountedRef.current) {
          setTimeout(() => {
            if (!unmountedRef.current && stateRef.current === "listening" && !busyRef.current) beginListening();
          }, 350);
        }
      },
    });
    recogRef.current = handle;
  }, [sttOk, micDenied]);

  /* ------------------------------ respond + speak ------------------------------ */
  const respond = useCallback(
    async (userText: string) => {
      if (unmountedRef.current) return;
      recogRef.current?.stop();

      /* history BEFORE appending the current turn (buildMessages adds userText itself) */
      const history = turnsRef.current
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.text } as const));

      pushTurn({ role: "user", text: userText });
      setPhase("thinking");
      abortRef.current = new AbortController();

      let answer = "";
      try {
        if (!live) throw new Error("demo");
        const messages = buildMessages({ skillId, lang, style: responseStyle, history, userText });
        answer = await completeChat(messages, abortRef.current.signal);
        if (!answer.trim()) throw new Error("empty");
      } catch {
        answer = generateReply(userText, skillId, lang).text;
      }
      if (unmountedRef.current) return;

      setPhase("speaking");
      const spoken = speakable(answer, lang);
      patchLastAssistant("");

      /* reveal markdown in sync-ish with the spoken voice */
      const total = answer.length;
      const revealTo = (spokenIdx: number) => {
        const ratio = Math.min(1, spokenIdx / Math.max(1, spoken.length));
        patchLastAssistant(answer.slice(0, Math.max(8, Math.round(total * ratio))));
      };

      const finishSpeaking = () => {
        patchLastAssistant(answer);
        speakLevel.current = 0;
        if (unmountedRef.current) return;
        setPhase("listening");
        busyRef.current = false;
        setTimeout(() => beginListening(), 350);
      };

      if (muted || !ttsOk) {
        /* no voice out — timed reveal while the 'speaking' state runs */
        const words = answer.split(/(\s+)/);
        let acc = "";
        for (let i = 0; i < words.length; i++) {
          if (unmountedRef.current) return;
          acc += words[i];
          if (/\S/.test(words[i])) {
            patchLastAssistant(acc);
            speakLevel.current = 0.45 + Math.random() * 0.35;
            await new Promise((r) => setTimeout(r, 40 / Math.max(0.5, voiceSpeed)));
          }
        }
        finishSpeaking();
        return;
      }

      /* fallback timed reveal so text progresses even if boundary events don't fire */
      let timerIdx = 0;
      const timer = setInterval(() => {
        timerIdx += Math.ceil(spoken.length / 90);
        revealTo(timerIdx);
      }, 120);

      const speech = await speakText({
        text: spoken,
        lang,
        rate: voiceSpeed,
        onBoundary: (idx) => {
          speakLevel.current = 0.5 + Math.random() * 0.3;
          revealTo(idx);
        },
        onEnd: () => {
          clearInterval(timer);
          finishSpeaking();
        },
      });
      speechRef.current = speech;
    },
    [lang, skillId, responseStyle, voiceSpeed, live, muted, ttsOk, beginListening],
  );
  const respondRef = useRef(respond);
  respondRef.current = respond;

  /* auto-enter listening shortly after mount */
  useEffect(() => {
    const tm = setTimeout(() => {
      if (!unmountedRef.current && stateRef.current === "idle") {
        setPhase("listening");
        beginListening();
      }
    }, 800);
    return () => clearTimeout(tm);
  }, [beginListening]);

  /* cleanup everything on unmount */
  useEffect(() => {
    return () => {
      unmountedRef.current = true;
      recogRef.current?.stop();
      speechRef.current?.cancel();
      abortRef.current?.abort();
      try { window.speechSynthesis?.cancel(); } catch {}
    };
  }, []);

  const endConversation = () => {
    recogRef.current?.stop();
    speechRef.current?.cancel();
    abortRef.current?.abort();
    try { window.speechSynthesis?.cancel(); } catch {}
    navigate(-1);
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    streamRef.current?.getAudioTracks().forEach((tr) => (tr.enabled = !next));
    if (next) {
      speechRef.current?.cancel();
      try { window.speechSynthesis?.cancel(); } catch {}
      if (stateRef.current === "speaking") {
        setPhase("listening");
        busyRef.current = false;
        setTimeout(() => beginListening(), 250);
      }
    }
  };

  const statusLabel: Record<VoiceState, string> = {
    idle: t("chat.idle"),
    listening: t("chat.listening"),
    thinking: t("voice.thinking"),
    speaking: t("chat.speaking"),
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.99 }}
      transition={{ duration: 0.28, ease: [0.22, 0.61, 0.21, 1] }}
      className="flex h-dvh flex-col bg-paper dark:bg-night"
    >
      {/* header */}
      <header className="flex items-center gap-2 px-3 py-3 sm:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={skillId}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2.5"
            >
              <SkillIcon icon={v.icon} tint={v.tint} />
              <div>
                <p className="text-[15px] font-semibold leading-tight">{skillId === "general" ? t("chat.general") : v.name}</p>
                <p className="text-[11.5px] text-ink-3 dark:text-night-ink3">{t("app.offline")}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        {!live && <Badge tone="amber" className="mr-1">{t("app.demo")}</Badge>}
        <LanguageMenu />
        <button
          onClick={endConversation}
          aria-label="Close"
          className="grid h-9 w-9 place-items-center rounded-full text-ink-2 transition-colors hover:bg-black/[0.05] dark:text-night-ink2 dark:hover:bg-white/[0.08]"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {/* orb + status */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
        >
          <VoiceOrb state={state} getLevel={getLevel} />
        </motion.div>

        <div className="flex h-7 items-center gap-2">
          <AnimatePresence mode="wait">
            <motion.span
              key={state}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="text-[15px] font-medium text-ink-2 dark:text-night-ink2"
            >
              {statusLabel[state]}
            </motion.span>
          </AnimatePresence>
          {(state === "listening" || state === "thinking") && (
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1 w-1 rounded-full bg-ink-3 dark:bg-night-ink3"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
                />
              ))}
            </span>
          )}
        </div>

        {micDenied && (
          <p className="-mt-3 text-[12px] text-amber-600 dark:text-amber-400">{t("voice.micDenied")}</p>
        )}

        {/* transcript */}
        <div className="flex min-h-24 w-full max-w-md flex-col justify-end gap-2.5">
          <AnimatePresence>
            {turns.slice(-2).map((turn, i, arr) => (
              <motion.div
                key={`${turns.length - arr.length + i}-${turn.role}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "max-h-32 overflow-y-auto rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed",
                  turn.role === "user"
                    ? "self-end bg-ink text-paper dark:bg-night-2 dark:text-night-ink"
                    : "self-start bg-black/[0.045] text-ink dark:bg-white/[0.07] dark:text-night-ink",
                )}
              >
                {turn.role === "assistant" ? (
                  <Markdown text={turn.text} className="text-[14px] [&_*]:first:mt-0 [&_*]:last:mb-0" />
                ) : (
                  turn.text
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <AnimatePresence>
            {interim && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 0.75, y: 0 }}
                exit={{ opacity: 0 }}
                className="self-end rounded-2xl border border-dashed border-ink/20 bg-ink/[0.05] px-4 py-2.5 text-[14px] text-ink-2 dark:border-white/20 dark:bg-white/[0.05] dark:text-night-ink2"
              >
                {interim}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* typed input — always available, essential when STT is unavailable */}
      <AnimatePresence>
        {showInput && (
          <motion.form
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            className="mx-auto w-full max-w-md px-6"
            onSubmit={(e) => {
              e.preventDefault();
              const q = draft.trim();
              if (!q || busyRef.current) return;
              setDraft("");
              busyRef.current = true;
              respond(q);
            }}
          >
            <div className="flex items-center gap-2 rounded-full border border-line bg-surface p-1.5 pl-4 shadow-[var(--shadow-card)] focus-within:border-brand-500/40 dark:bg-night-1">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t("voice.type")}
                className="w-full bg-transparent text-[14.5px] outline-none placeholder:text-ink-3 dark:placeholder:text-night-ink3"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                aria-label={t("chat.send")}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-paper transition-opacity disabled:opacity-40 dark:bg-white dark:text-black"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* controls */}
      <div className="flex items-center justify-center gap-4 pb-[max(env(safe-area-inset-bottom),28px)] pt-6">
        <ControlButton
          label={muted ? t("voice.unmute") : t("voice.mute")}
          active={muted}
          onClick={toggleMute}
          icon={muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        />
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
          onClick={endConversation}
          aria-label={t("voice.end")}
          className="grid h-16 w-16 place-items-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/25"
        >
          <Phone className="h-6 w-6 rotate-[135deg]" />
        </motion.button>
        <ControlButton
          label={t("voice.type")}
          active={showInput}
          onClick={() => setShowInput((v) => !v)}
          icon={<Keyboard className="h-5 w-5" />}
        />
      </div>
    </motion.div>
  );
}

function ControlButton({
  label,
  icon,
  onClick,
  active,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.93 }}
        onClick={onClick}
        aria-label={label}
        aria-pressed={active}
        className={cn(
          "grid h-12 w-12 place-items-center rounded-full border transition-colors",
          active
            ? "border-brand-500/50 bg-brand-500/12 text-brand-700 dark:text-brand-300"
            : "border-line bg-surface text-ink-2 hover:bg-black/[0.03] dark:bg-night-1 dark:text-night-ink2 dark:hover:bg-white/[0.05]",
        )}
      >
        {icon}
      </motion.button>
      <span className="text-[11px] font-medium text-ink-3 dark:text-night-ink3">{label}</span>
    </div>
  );
}
