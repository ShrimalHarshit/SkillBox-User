import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowDown, ArrowUp, Mic, Plus, Square, FileUp, Image as ImageIcon,
} from "lucide-react";
import { useApp, useRuntime } from "../store/app";
import { useChats } from "../store/chats";
import { translate } from "../lib/i18n";
import { suggestionsFor } from "../lib/data";
import { generateReply, streamReply } from "../lib/engine";
import { streamChat } from "../api/client";
import { buildMessages } from "../lib/skillPrompts";
import { titleFrom } from "../lib/utils";
import { StatusDot } from "../components/core";
import { Button, Card, Badge } from "../components/ui";
import { Menu, MenuItem, Tip } from "../components/overlay";
import { LanguageMenu } from "../components/LanguageMenu";
import { ChatMessage, ThinkingRow, SkillSwitcher, skillVisual } from "../components/chat";

type Phase = "idle" | "thinking" | "streaming";

export default function Conversation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const conv = useChats((s) => s.conversations.find((c) => c.id === id));
  const { append, updateMessage, deleteMessage, remove, setSkill } = useChats();
  const lang = useApp((s) => s.lang);
  const responseStyle = useApp((s) => s.responseStyle);
  const installed = useApp((s) => s.installedSkills);
  const touchSkill = useApp((s) => s.touchSkill);
  const live = useRuntime((s) => s.live);
  const t = useCallback((k: string, v?: Record<string, string>) => translate(lang, k, v), [lang]);

  const [phase, setPhase] = useState<Phase>("idle");
  const [failed, setFailed] = useState(false);
  const abort = useRef<{ aborted: boolean; controller?: AbortController }>({ aborted: false });
  const handledAuto = useRef<string | null>(null);

  /* ------------------------------ generation core ----------------------------- */
  const runGeneration = useCallback(
    (userText: string) => {
      if (!id) return;
      const skillId = conv?.skillId ?? "general";
      const history =
        conv?.messages
          .filter((m) => m.content.trim())
          .map((m) => ({ role: m.role, content: m.content })) ?? [];
      abort.current = { aborted: false, controller: new AbortController() };
      setFailed(false);
      setPhase("thinking");

      const thinkingMs = live ? 260 + Math.random() * 300 : 450 + Math.random() * 500;
      setTimeout(() => {
        if (abort.current.aborted) { setPhase("idle"); return; }
        const placeholder = append(id, { role: "assistant", content: "", demo: !live ? true : undefined });
        setPhase("streaming");

        const demoFallback = () => {
          updateMessage(id, placeholder.id, { content: "", demo: true });
          const reply = generateReply(userText, skillId, lang);
          streamReply(
            reply,
            (acc, done) => {
              updateMessage(id, placeholder.id, { content: acc, demo: true });
              if (done) {
                updateMessage(id, placeholder.id, { sources: reply.sources, demo: true });
                setPhase("idle");
              }
            },
            abort.current,
          );
        };

        if (!live) {
          demoFallback();
          return;
        }

        const messages = buildMessages({
          skillId,
          lang,
          style: responseStyle,
          history,
          userText,
        });
        streamChat(messages, (acc) => updateMessage(id, placeholder.id, { content: acc, demo: false }), abort.current.controller!.signal)
          .then((final) => {
            if (abort.current.aborted) return;
            if (!final.trim()) { demoFallback(); return; }
            setPhase("idle");
            touchSkill(skillId);
          })
          .catch(() => {
            if (abort.current.aborted) return;
            demoFallback();
          });
      }, thinkingMs);
    },
    [id, conv, append, updateMessage, lang, responseStyle, live, touchSkill],
  );

  const send = useCallback(
    (userText: string) => {
      const text = userText.trim();
      if (!text || phase !== "idle" || !conv || !id) return;
      const msg = append(id, { role: "user", content: text });
      handledAuto.current = msg.id; // don't double-fire from the auto-reply effect
      if (conv.title === "New chat" && conv.messages.length === 0) {
        useChats.getState().rename(id, titleFrom(text));
      }
      runGeneration(text);
    },
    [append, conv, id, phase, runGeneration],
  );

  /* auto-answer a first message created from Home / Suggestions */
  const lastMsg = conv?.messages[conv.messages.length - 1];
  useEffect(() => {
    if (!conv || phase !== "idle" || !lastMsg || lastMsg.role !== "user") return;
    if (handledAuto.current === lastMsg.id) return;
    handledAuto.current = lastMsg.id;
    runGeneration(lastMsg.content);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conv?.id, lastMsg?.id, phase, runGeneration]);

  const stop = () => {
    abort.current.aborted = true;
    abort.current.controller?.abort();
    setPhase("idle");
  };

  const regenerate = () => {
    if (!conv || !id || phase !== "idle") return;
    const lastUser = [...conv.messages].reverse().find((m) => m.role === "user");
    const lastAssistant = [...conv.messages].reverse().find((m) => m.role === "assistant");
    if (!lastUser) return;
    if (lastAssistant) deleteMessage(id, lastAssistant.id);
    runGeneration(lastUser.content);
  };

  /* ------------------------------ scroll behavior ----------------------------- */
  const scrollRef = useRef<HTMLDivElement>(null);
  const followRef = useRef(true);
  const [showJump, setShowJump] = useState(false);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 90;
    followRef.current = nearBottom;
    setShowJump(!nearBottom && phase !== "idle");
  };

  useEffect(() => {
    if (followRef.current) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }
  }, [conv?.messages, phase]);

  const jumpToLatest = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    followRef.current = true;
    setShowJump(false);
  };

  /* --------------------------------- composer -------------------------------- */
  const [text, setText] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const grow = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(160, el.scrollHeight) + "px";
  };

  const suggestions = useMemo(
    () => suggestionsFor(conv?.skillId ?? "general", lang).slice(0, 3),
    [conv?.skillId, lang],
  );

  if (!conv) {
    return (
      <div className="grid min-h-dvh place-items-center p-6">
        <Card className="max-w-sm p-8 text-center">
          <p className="font-display font-semibold">Conversation not found</p>
          <Button className="mt-4" variant="primary" onClick={() => navigate("/chat")}>
            {t("nav.chat")}
          </Button>
        </Card>
      </div>
    );
  }

  const v = skillVisual(conv.skillId);
  const isEmpty = conv.messages.length === 0;

  return (
    <div className="flex h-dvh flex-col">
      {/* header */}
      <header className="relative z-20 flex items-center gap-2 border-b border-line bg-paper/90 px-2.5 py-2 backdrop-blur dark:bg-night/90 sm:px-4">
        <Tip label={t("onboard.back")}>
          <Button variant="ghost" size="icon" aria-label={t("onboard.back")} onClick={() => navigate("/chat")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Tip>

        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={conv.skillId}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-2.5"
            >
              <SkillSwitcher
                value={conv.skillId}
                installedIds={installed}
                onChange={(sid) => setSkill(conv.id, sid)}
              />
              <span className="flex items-center gap-1.5 text-[12px] text-ink-3 dark:text-night-ink3">
                <StatusDot tone={live ? "ok" : "warn"} />
                {live ? t("app.offline") : t("app.demo")}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        <LanguageMenu />
        <Menu
          trigger={
            <Button variant="ghost" size="icon" aria-label="More">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" />
              </svg>
            </Button>
          }
        >
          <MenuItem icon={<FileUp />} onSelect={() => navigate("/skills?create=1")}>
            Add knowledge
          </MenuItem>
          <MenuItem icon={<ImageIcon />} disabled>
            Share photo (coming soon)
          </MenuItem>
          <MenuItem
            danger
            onSelect={() => {
              remove(conv.id);
              navigate("/chat");
            }}
          >
            {t("chat.delete")}
          </MenuItem>
        </Menu>
      </header>

      {/* messages */}
      <div ref={scrollRef} onScroll={onScroll} className="relative flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl space-y-7 px-4 py-6 sm:px-6">
          {isEmpty && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-10 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-dashed border-line text-ink-3">
                {(() => { const Icon = v.icon; return <Icon className="h-6 w-6" />; })()}
              </div>
              <h2 className="mt-4 font-display text-lg font-semibold">
                {t("chat.placeholder", { skill: conv.skillId === "general" ? t("chat.general") : v.name })}
              </h2>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {suggestions.map((s, i) => (
                  <motion.button
                    key={s}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => send(s)}
                    className="rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-ink-2 transition-colors hover:border-brand-500/40 hover:text-ink dark:bg-night-1 dark:text-night-ink2"
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {conv.messages.map((m, i) => (
            <ChatMessage
              key={m.id}
              msg={m}
              skillId={conv.skillId}
              streaming={phase === "streaming" && i === conv.messages.length - 1 && m.role === "assistant"}
              isLast={i === conv.messages.length - 1}
              onRegenerate={phase === "idle" ? regenerate : undefined}
            />
          ))}

          <AnimatePresence>
            {phase === "thinking" && (
              <ThinkingRow label={t("chat.thinking")} skillId={conv.skillId} />
            )}
          </AnimatePresence>

          <div className="h-2" />
        </div>
      </div>

      {/* jump to latest */}
      <AnimatePresence>
        {showJump && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={jumpToLatest}
            className="absolute left-1/2 bottom-28 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-medium shadow-[var(--shadow-pop)] dark:bg-night-2"
          >
            <ArrowDown className="h-4 w-4" /> {t("chat.newResponse")}
          </motion.button>
        )}
      </AnimatePresence>

      {/* composer */}
      <div className="border-t border-line bg-paper/90 px-3 pb-[max(env(safe-area-inset-bottom),10px)] pt-2.5 backdrop-blur dark:bg-night/90 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-[24px] border border-line bg-surface p-1.5 pl-1.5 shadow-[var(--shadow-card)] transition-shadow focus-within:border-brand-500/40 focus-within:ring-4 focus-within:ring-brand-500/10 dark:bg-night-1">
            <div className="flex items-end gap-1">
              <Menu
                trigger={
                  <Button variant="ghost" size="icon" className="shrink-0 rounded-full" aria-label="Add">
                    <Plus className="h-5 w-5" />
                  </Button>
                }
              >
                <MenuItem icon={<FileUp />} onSelect={() => navigate("/skills?create=1")}>
                  Add your knowledge
                </MenuItem>
                <MenuItem icon={<ImageIcon />} disabled>
                  Photo (coming soon)
                </MenuItem>
              </Menu>
              <textarea
                ref={taRef}
                rows={1}
                value={text}
                onChange={(e) => { setText(e.target.value); grow(); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(text);
                    setText("");
                    requestAnimationFrame(grow);
                  }
                }}
                placeholder={t("chat.placeholder", { skill: conv.skillId === "general" ? t("chat.general") : v.name })}
                className="max-h-[160px] min-h-10 w-full resize-none bg-transparent py-2.5 text-[15.5px] outline-none placeholder:text-ink-3 dark:placeholder:text-night-ink3"
                aria-label={t("chat.send")}
              />
              <Tip label={t("home.talk")}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-full"
                  aria-label={t("home.talk")}
                  onClick={() => navigate(`/voice?skill=${conv.skillId}`)}
                >
                  <Mic className="h-5 w-5" />
                </Button>
              </Tip>
              {phase === "idle" ? (
                <motion.span animate={{ opacity: text.trim() ? 1 : 0.55, scale: text.trim() ? 1 : 0.96 }}>
                  <Button
                    variant="primary"
                    size="icon"
                    className="shrink-0 rounded-full"
                    aria-label={t("chat.send")}
                    disabled={!text.trim()}
                    onClick={() => { send(text); setText(""); requestAnimationFrame(grow); }}
                  >
                    <ArrowUp className="h-5 w-5" />
                  </Button>
                </motion.span>
              ) : (
                <Button variant="secondary" size="icon" className="shrink-0 rounded-full" aria-label={t("chat.stop")} onClick={stop}>
                  <Square className="h-4 w-4 fill-current" />
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 pb-1 pt-1.5">
            {!live && (
              <Badge tone="amber" className="font-normal">
                {t("app.demo.note")}
              </Badge>
            )}
            {failed && (
              <Badge tone="amber" className="font-normal">
                Response paused — try again
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
