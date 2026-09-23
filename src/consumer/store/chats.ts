import { create } from "zustand";
import { persist } from "zustand/middleware";
import { uid } from "../lib/utils";
import type { SourceChip } from "../lib/engine";
import type { Lang } from "../lib/i18n";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  t: number;
  sources?: SourceChip[];
  demo?: boolean; // true when produced by the built-in demo engine
}

export interface Conversation {
  id: string;
  title: string;
  skillId: string;
  lang: Lang;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
}

interface ChatState {
  conversations: Conversation[];
  create: (skillId: string, lang: Lang, firstUserText?: string) => Conversation;
  append: (convId: string, msg: Omit<Message, "id" | "t"> & Partial<Pick<Message, "t">>) => Message;
  updateMessage: (convId: string, msgId: string, patch: Partial<Message>) => void;
  deleteMessage: (convId: string, msgId: string) => void;
  setSkill: (convId: string, skillId: string) => void;
  setLang: (convId: string, lang: Lang) => void;
  rename: (convId: string, title: string) => void;
  remove: (convId: string) => void;
  togglePin: (convId: string) => void;
  clearAll: () => void;
}

const DAYS = 86400000;

/** Demo seed conversations so the history view feels alive on first launch. */
function seeds(): Conversation[] {
  const now = Date.now();
  const mk = (
    title: string,
    skillId: string,
    lang: Lang,
    ageDays: number,
    msgs: [string, string],
  ): Conversation => {
    const createdAt = now - ageDays * DAYS;
    return {
      id: uid(),
      title,
      skillId,
      lang,
      createdAt,
      updatedAt: createdAt + 120000,
      pinned: false,
      messages: [
        { id: uid(), role: "user", content: msgs[0], t: createdAt },
        {
          id: uid(),
          role: "assistant",
          content: msgs[1],
          t: createdAt + 62000,
          demo: true,
        },
      ],
    };
  };
  return [
    mk("Cotton leaf yellowing", "agriculture", "en", 0, [
      "What should I check if my cotton leaves are turning yellow?",
      "## First checks\n\n1. Look at the **older lower leaves** — uniform yellowing usually means nitrogen shortage.\n2. Check the **leaf undersides** for sucking pests like aphids or whiteflies.\n3. See whether **veins stay green** while tissue yellows — that points to a micronutrient gap.\n\nTell me which pattern you see and we can narrow it down.",
    ]),
    mk("LoRA explained simply", "ai-research", "en", 1, [
      "What is LoRA in simple words?",
      "**LoRA (Low-Rank Adaptation)** is a way to teach a large model a new skill by training a tiny adapter instead of the whole model — cheap, small, and removable.",
    ]),
    mk("Recursion basics", "programming", "en", 5, [
      "Explain recursion like I'm a beginner",
      "**Recursion** is a function calling itself with a smaller input until it hits a **base case** it can answer directly. Try `n * factorial(n-1)` in Python — always pair it with a stopping condition.",
    ]),
  ];
}

export const useChats = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: seeds(),

      create: (skillId, lang, firstUserText) => {
        const conv: Conversation = {
          id: uid(),
          title: "New chat",
          skillId,
          lang,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          pinned: false,
        };
        set((s) => ({ conversations: [conv, ...s.conversations] }));
        if (firstUserText) get().append(conv.id, { role: "user", content: firstUserText });
        return conv;
      },

      append: (convId, msg) => {
        const full: Message = { id: uid(), t: msg.t ?? Date.now(), ...msg };
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId
              ? { ...c, messages: [...c.messages, full], updatedAt: Date.now() }
              : c,
          ),
        }));
        return full;
      },

      updateMessage: (convId, msgId, patch) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  updatedAt: Date.now(),
                  messages: c.messages.map((m) => (m.id === msgId ? { ...m, ...patch } : m)),
                }
              : c,
          ),
        })),

      deleteMessage: (convId, msgId) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId ? { ...c, messages: c.messages.filter((m) => m.id !== msgId) } : c,
          ),
        })),

      setSkill: (convId, skillId) =>
        set((s) => ({
          conversations: s.conversations.map((c) => (c.id === convId ? { ...c, skillId } : c)),
        })),

      setLang: (convId, lang) =>
        set((s) => ({
          conversations: s.conversations.map((c) => (c.id === convId ? { ...c, lang } : c)),
        })),

      rename: (convId, title) =>
        set((s) => ({
          conversations: s.conversations.map((c) => (c.id === convId ? { ...c, title } : c)),
        })),

      remove: (convId) =>
        set((s) => ({ conversations: s.conversations.filter((c) => c.id !== convId) })),

      togglePin: (convId) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId ? { ...c, pinned: !c.pinned } : c,
          ),
        })),

      clearAll: () => set({ conversations: [] }),
    }),
    { name: "skillbox.chats", version: 1 },
  ),
);
