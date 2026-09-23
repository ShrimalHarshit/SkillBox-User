import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "../lib/i18n";

export type Theme = "light" | "dark" | "system";
export type BackendMode = "demo" | "local";

/** A user-created Skill draft (personal knowledge / imported package). */
export interface CustomSkillMeta {
  id: string;
  name: string;
  desc: string;
  langs: Lang[];
  sizeMB: number;
  version: string;
  updatedAt: string;
  prototype: boolean; // true until the backend actually builds it
  knowledge: string[];
}

interface AppState {
  lang: Lang;
  theme: Theme;
  onboarded: boolean;
  installedSkills: string[]; // skill ids
  defaultSkillId: string;
  responseStyle: "concise" | "balanced" | "detailed";
  voiceSpeed: number;
  lastUsed: Record<string, number>; // skillId -> ts
  customSkills: CustomSkillMeta[];

  setLang: (l: Lang) => void;
  setTheme: (t: Theme) => void;
  completeOnboarding: (lang: Lang, skills: string[]) => void;
  resetOnboarding: () => void;
  installSkill: (id: string) => void;
  removeSkill: (id: string) => void;
  addCustomSkill: (meta: CustomSkillMeta) => void;
  touchSkill: (id: string) => void;
  setDefaultSkill: (id: string) => void;
  setResponseStyle: (s: AppState["responseStyle"]) => void;
  setVoiceSpeed: (v: number) => void;
}

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      lang: "en",
      theme: "system",
      onboarded: false,
      installedSkills: ["agriculture", "ai-research", "programming"],
      defaultSkillId: "agriculture",
      responseStyle: "balanced",
      voiceSpeed: 1,
      lastUsed: {},
      customSkills: [],

      setLang: (lang) => set({ lang }),
      setTheme: (theme) => set({ theme }),
      completeOnboarding: (lang, skills) =>
        set({ onboarded: true, lang, installedSkills: skills.length ? skills : ["agriculture"] }),
      resetOnboarding: () => set({ onboarded: false }),
      installSkill: (id) =>
        set((s) => ({ installedSkills: Array.from(new Set([...s.installedSkills, id])) })),
      removeSkill: (id) =>
        set((s) => ({
          installedSkills: s.installedSkills.filter((x) => x !== id),
          customSkills: s.customSkills.filter((x) => x.id !== id),
          defaultSkillId: s.defaultSkillId === id ? "general" : s.defaultSkillId,
        })),
      addCustomSkill: (meta) =>
        set((s) => ({
          customSkills: [...s.customSkills.filter((x) => x.id !== meta.id), meta],
          installedSkills: Array.from(new Set([...s.installedSkills, meta.id])),
        })),
      touchSkill: (id) => set((s) => ({ lastUsed: { ...s.lastUsed, [id]: Date.now() } })),
      setDefaultSkill: (defaultSkillId) => set({ defaultSkillId }),
      setResponseStyle: (responseStyle) => set({ responseStyle }),
      setVoiceSpeed: (voiceSpeed) => set({ voiceSpeed }),
    }),
    { name: "skillbox.app" },
  ),
);

/* ------- non-persisted runtime state (backend probe, connectivity) ------- */
import type { BackendInfo } from "../api/client";

interface RuntimeState {
  backend: BackendInfo | null;
  probed: boolean;
  online: boolean;
  /** true when a live inference runtime (local backend or on-device runtime) is connected */
  live: boolean;
  setBackend: (b: BackendInfo | null) => void;
  setOnline: (v: boolean) => void;
  setLive: (v: boolean) => void;
}

export const useRuntime = create<RuntimeState>((set) => ({
  backend: null,
  probed: false,
  online: typeof navigator === "undefined" ? true : navigator.onLine,
  live: false,
  setBackend: (backend) => set({ backend, probed: true }),
  setOnline: (online) => set({ online }),
  setLive: (live) => set({ live }),
}));

export const backendMode = (backend: BackendInfo | null): BackendMode =>
  backend ? "local" : "demo";
