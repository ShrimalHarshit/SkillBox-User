import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, ChevronDown, Copy, RefreshCw, Sparkles, BookOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { getSkill, GENERAL_ID } from "../lib/data";
import type { Message } from "../store/chats";
import { useApp } from "../store/app";
import { SkillIcon, StatusDot } from "./core";
import { Badge } from "./ui";
import { toast } from "./toast";
import { translate } from "../lib/i18n";

/* ------------------------------ skill fallback ------------------------------ */
export const skillVisual = (skillId: string) => {
  const s = getSkill(skillId);
  if (s) return { icon: s.icon, tint: s.tint, name: s.name };
  return {
    icon: Sparkles as LucideIcon,
    tint: "bg-stone-500/10 text-stone-600 dark:text-stone-300",
    name: "General AI",
  };
};

export function SkillAvatar({ skillId, size = "sm" }: { skillId: string; size?: "sm" | "md" }) {
  const v = skillVisual(skillId);
  return <SkillIcon icon={v.icon} tint={v.tint} size={size} />;
}

/* --------------------------------- Markdown --------------------------------- */
function textFrom(node: unknown): string {
  if (node == null) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(textFrom).join("");
  const anyNode = node as { props?: { children?: unknown } };
  if (anyNode.props?.children) return textFrom(anyNode.props.children);
  return "";
}

export function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          toast(translate(useApp.getState().lang, "toast.copied"), "success");
          setTimeout(() => setCopied(false), 1600);
        } catch {}
      }}
      aria-label="Copy"
      className={cn(
        "grid h-7 w-7 place-items-center rounded-md text-ink-3 transition-colors hover:bg-black/[0.06] hover:text-ink dark:text-night-ink3 dark:hover:bg-white/[0.08] dark:hover:text-night-ink",
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={copied ? "ok" : "copy"}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ duration: 0.14 }}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-brand-600" /> : <Copy className="h-3.5 w-3.5" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

export function Markdown({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn("markdown text-[15px] leading-[1.65] text-ink dark:text-night-ink", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h1 className="font-display mt-5 mb-2 text-[19px] font-semibold first:mt-0" {...p} />,
          h2: (p) => <h2 className="font-display mt-5 mb-2 text-[17px] font-semibold first:mt-0" {...p} />,
          h3: (p) => <h3 className="mt-4 mb-1.5 text-[15px] font-semibold" {...p} />,
          p: (p) => <p className="my-2.5 first:mt-0 last:mb-0" {...p} />,
          ul: (p) => <ul className="my-2.5 list-disc space-y-1.5 pl-5 marker:text-ink-3" {...p} />,
          ol: (p) => <ol className="my-2.5 list-decimal space-y-1.5 pl-5 marker:text-ink-3" {...p} />,
          li: (p) => <li className="leading-relaxed" {...p} />,
          strong: (p) => <strong className="font-semibold" {...p} />,
          hr: () => <div className="my-4 h-px bg-line" />,
          blockquote: (p) => (
            <blockquote className="my-3 border-l-2 border-brand-500/60 pl-3.5 text-ink-2 dark:text-night-ink2" {...p} />
          ),
          table: (p) => (
            <div className="my-3 overflow-x-auto rounded-xl border border-line">
              <table className="w-full border-collapse text-[13.5px]" {...p} />
            </div>
          ),
          thead: (p) => <thead className="bg-black/[0.035] dark:bg-white/[0.05]" {...p} />,
          th: (p) => <th className="px-3 py-2 text-left font-semibold" {...p} />,
          td: (p) => <td className="border-t border-line px-3 py-2 align-top" {...p} />,
          pre: (p) => {
            const child = (p as any).children;
            const langMatch = /language-(\w+)/.exec(child?.props?.className ?? "");
            const code = textFrom(child);
            return (
              <div className="group/code relative my-3 overflow-hidden rounded-xl border border-line bg-stone-950 dark:bg-black/60">
                <div className="flex items-center justify-between border-b border-white/[0.08] px-3.5 py-1.5">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-stone-400">
                    {langMatch?.[1] ?? "code"}
                  </span>
                  <span className="opacity-0 transition-opacity group-hover/code:opacity-100">
                    <CopyButton text={code} className="text-stone-400 hover:bg-white/[0.08] hover:text-stone-200" />
                  </span>
                </div>
                <pre className="overflow-x-auto p-3.5 text-[13px] leading-relaxed text-stone-100">
                  <code className="font-mono">{code}</code>
                </pre>
              </div>
            );
          },
          code: (p) => {
            const anyP = p as { children?: unknown; className?: string };
            const isBlock = /language-/.test(anyP.className ?? "") || (typeof anyP.children === "string" && anyP.children.includes("\n"));
            if (isBlock) return <code className="font-mono">{anyP.children as any}</code>;
            return (
              <code className="rounded-md bg-black/[0.055] px-1.5 py-0.5 font-mono text-[13px] text-ink dark:bg-white/[0.09] dark:text-night-ink">
                {anyP.children as any}
              </code>
            );
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

/* ------------------------------ thinking indicator ----------------------------- */
export function ThinkingRow({ label, skillId }: { label: string; skillId: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-3"
    >
      <SkillAvatar skillId={skillId} />
      <div className="flex items-center gap-2.5 rounded-2xl bg-black/[0.04] px-4 py-3 dark:bg-white/[0.06]">
        <span className="relative grid h-2.5 w-2.5 place-items-center">
          <motion.span
            className="absolute h-2.5 w-2.5 rounded-full bg-brand-500"
            animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0.15, 0.7] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
        </span>
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1 w-1 rounded-full bg-ink-3 dark:bg-night-ink3"
              animate={{ opacity: [0.25, 1, 0.25] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }}
            />
          ))}
        </span>
        <span className="text-[13.5px] text-ink-2 dark:text-night-ink2">{label}</span>
      </div>
    </motion.div>
  );
}

/* --------------------------------- sources --------------------------------- */
function SourceChips({ sources }: { sources: NonNullable<Message["sources"]> }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2.5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex flex-wrap items-center gap-1.5 rounded-full text-left transition-opacity hover:opacity-80"
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5 text-[12px] font-medium text-ink-3 dark:text-night-ink3">
          <BookOpen className="h-3.5 w-3.5" />
        </span>
        {sources.map((s) => (
          <Badge key={s.name} tone="brand">
            {s.name}
          </Badge>
        ))}
        <ChevronDown className={cn("h-3.5 w-3.5 text-ink-3 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-1.5">
              {sources.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between rounded-xl border border-line bg-black/[0.02] px-3 py-2 text-[12.5px] dark:bg-white/[0.03]"
                >
                  <span className="font-medium">{s.name}</span>
                  <span className="text-ink-3 dark:text-night-ink3">{s.kind}</span>
                </div>
              ))}
              <p className="pt-0.5 text-[11px] text-ink-3 dark:text-night-ink3">
                Sample provenance shown for demonstration in Demo Mode.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* --------------------------------- message row -------------------------------- */
export function ChatMessage({
  msg,
  skillId,
  streaming,
  isLast,
  onRegenerate,
}: {
  msg: Message;
  skillId: string;
  streaming?: boolean;
  isLast?: boolean;
  onRegenerate?: () => void;
}) {
  const lang = useApp((s) => s.lang);
  if (msg.role === "user") {
    return (
      <motion.div
        variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }}
        initial="hidden"
        animate="show"
        className="flex justify-end pl-10"
      >
        <div className="max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-br-lg bg-ink px-4 py-2.5 text-[15px] leading-relaxed text-paper dark:bg-night-2 dark:text-night-ink sm:max-w-[75%]">
          {msg.content}
        </div>
      </motion.div>
    );
  }
  const v = skillVisual(skillId);
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.22 } } }}
      initial="hidden"
      animate="show"
      className="space-y-2"
    >
      <div className="flex items-center gap-2">
        <SkillAvatar skillId={skillId} />
        <span className="text-[13px] font-semibold">{v.name}</span>
        {msg.demo && <Badge tone="amber">Demo</Badge>}
      </div>
      <div className="pl-[42px]">
        <Markdown text={msg.content} />
        {streaming && <span className="ml-0.5 inline-block h-[1.05em] w-[3px] translate-y-[3px] rounded-sm bg-brand-500 animate-cursor" />}
      </div>
      {!streaming && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1 pl-[38px]"
        >
          <CopyButton text={msg.content} />
          {isLast && onRegenerate && (
            <button
              onClick={onRegenerate}
              aria-label={translate(lang, "chat.regenerate")}
              className="grid h-7 w-7 place-items-center rounded-md text-ink-3 transition-colors hover:bg-black/[0.06] hover:text-ink dark:text-night-ink3 dark:hover:bg-white/[0.08] dark:hover:text-night-ink"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
        </motion.div>
      )}
      {msg.sources && msg.sources.length > 0 && (
        <div className="pl-[42px]">
          <SourceChips sources={msg.sources} />
        </div>
      )}
    </motion.div>
  );
}

/* -------------------------------- skill switcher -------------------------------- */
export function SkillSwitcher({
  value,
  onChange,
  installedIds,
}: {
  value: string;
  onChange: (id: string) => void;
  installedIds: string[];
}) {
  const v = skillVisual(value);
  const lang = useApp((s) => s.lang);
  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <button className="flex min-w-0 items-center gap-2 rounded-full py-1 pl-1 pr-2 text-left transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.07]">
          <SkillIcon icon={v.icon} tint={v.tint} size="sm" />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-[14.5px] font-semibold">{value === GENERAL_ID ? translate(lang, "chat.general") : v.name}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-ink-3" />
            </span>
          </span>
        </button>
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          align="start"
          sideOffset={8}
          className="z-[70] w-64 rounded-2xl border border-line bg-surface p-1.5 shadow-[var(--shadow-pop)] dark:bg-night-1"
        >
          <Dropdown.Label className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-3 dark:text-night-ink3">
            Switch Skill
          </Dropdown.Label>
          {[GENERAL_ID, ...installedIds].map((id) => {
            const sv = skillVisual(id);
            const active = id === value;
            return (
              <Dropdown.Item
                key={id}
                onSelect={() => onChange(id)}
                className={cn(
                  "flex cursor-pointer select-none items-center gap-2.5 rounded-xl px-2.5 py-2.5 outline-none",
                  active
                    ? "bg-brand-500/10"
                    : "data-[highlighted]:bg-black/[0.05] dark:data-[highlighted]:bg-white/[0.07]",
                )}
              >
                <SkillIcon icon={sv.icon} tint={sv.tint} size="sm" />
                <span className="flex-1 truncate text-sm font-medium">
                  {id === GENERAL_ID ? translate(lang, "chat.general") : sv.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <StatusDot tone="ok" />
                  {active && (
                    <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 500, damping: 24 }}>
                      <Check className="h-4 w-4 text-brand-600" />
                    </motion.span>
                  )}
                </span>
              </Dropdown.Item>
            );
          })}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
