import type { Lang } from "./i18n";
import {
  Sprout, BrainCircuit, Code2, Sigma, GraduationCap, Landmark, NotebookPen,
  type LucideIcon,
} from "lucide-react";
import { useApp } from "../store/app";

export type SkillStatus = "installed" | "available";

export interface SkillSource {
  name: string;
  kind: string;
}

export interface Skill {
  id: string;
  name: string;
  icon: LucideIcon;
  /** soft tint used for icon chip: [bg, text] as tailwind classes */
  tint: string;
  desc: Partial<Record<Lang, string>>;
  detail: Partial<Record<Lang, string>>;
  langs: Lang[];
  sizeMB: number;
  version: string;
  updatedAt: string;
  recommended?: boolean;
  demoIncluded?: boolean; // ships with the demo catalogue
  capabilities: string[];
  knowledge: string[];
  sources?: SkillSource[];
}

export const skillDesc = (s: Skill, lang: Lang) => s.desc[lang] ?? s.desc.en ?? "";
export const skillDetail = (s: Skill, lang: Lang) => s.detail[lang] ?? s.detail.en ?? s.desc.en ?? "";

export const GENERAL_ID = "general";

/** Resolve custom (user-created) skills alongside the catalogue. */
function customToSkill(m: import("../store/app").CustomSkillMeta): Skill {
  return {
    id: m.id,
    name: m.name,
    icon: NotebookPen,
    tint: "bg-stone-500/10 text-stone-600 dark:text-stone-300",
    desc: { en: m.desc },
    detail: { en: m.prototype ? `${m.desc} — created as a draft in this prototype; connect the SkillBox backend to build its knowledge.` : m.desc },
    langs: m.langs,
    sizeMB: m.sizeMB,
    version: m.version,
    updatedAt: m.updatedAt,
    capabilities: m.prototype
      ? ["Draft created in the app", "Knowledge build requires the SkillBox backend"]
      : ["Answer from personal knowledge", "Work offline"],
    knowledge: m.knowledge.length ? m.knowledge : ["Your documents"],
  };
}

export const SKILL_CATALOG: Skill[] = [
  {
    id: "agriculture",
    name: "Agriculture",
    icon: Sprout,
    tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    desc: {
      en: "Crop guidance, farming practices and agricultural knowledge",
      hi: "फसल मार्गदर्शन, खेती के तरीके और कृषि ज्ञान",
      mr: "पीक मार्गदर्शन, शेती पद्धती आणि कृषी ज्ञान",
    },
    detail: {
      en: "Practical, field-ready agricultural knowledge for crops, soil, pests and watering — built from public agricultural research and government advisories, and available completely offline.",
      hi: "फसलों, मिटटी, कीटों और सिंचाई के लिए व्यावहारिक कृषि ज्ञान — सार्वजनिक कृषि अनुसंधान और सरकारी सलाहों से तैयार, पूरी तरह ऑफ़लाइन।",
      mr: "पिके, माती, कीड आणि पाण्याच्या व्यवस्थापनासाठी व्यवहारी कृषी ज्ञान — सार्वजनिक कृषी संशोधन आणि शासकीय सूचनांवर आधारित, पूर्णपणे ऑफलाइन.",
    },
    langs: ["en", "hi", "mr"],
    sizeMB: 186,
    version: "1.4.2",
    updatedAt: "Jan 2026",
    recommended: true,
    demoIncluded: true,
    capabilities: [
      "Answer crop and farming questions",
      "Explain farming practices step by step",
      "Diagnose common crop problems",
      "Suggest seasonal sowing options",
      "Search local farming knowledge offline",
    ],
    knowledge: ["Crop care", "Soil & manure", "Pest management", "Irrigation", "Seasonal planning"],
    sources: [
      { name: "ICAR advisories", kind: "Research body" },
      { name: "State agricultural universities", kind: "Publications" },
      { name: "FAO field guides", kind: "International" },
      { name: "Government crop advisories", kind: "Public sector" },
    ],
  },
  {
    id: "ai-research",
    name: "AI Researcher",
    icon: BrainCircuit,
    tint: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    desc: {
      en: "Research papers, ML concepts and AI development",
      hi: "रिसर्च पेपर, ML अवधारणाएँ और AI विकास",
      mr: "संशोधन पेपर, ML संकल्पना आणि AI विकास",
    },
    detail: {
      en: "A reading companion for machine learning and AI — it explains paper ideas in plain language, summarizes concepts and helps you reason about architectures, training and evaluation.",
    },
    langs: ["en"],
    sizeMB: 244,
    version: "0.9.1",
    updatedAt: "Feb 2026",
    recommended: true,
    demoIncluded: true,
    capabilities: [
      "Explain ML concepts in plain language",
      "Summarize research ideas",
      "Compare methods and trade-offs",
      "Help reason about experiments",
      "Work offline",
    ],
    knowledge: ["ML fundamentals", "Fine-tuning methods", "LLMs", "Evaluation"],
    sources: [
      { name: "arXiv paper abstracts", kind: "Open corpus" },
      { name: "Open ML textbooks", kind: "Educational" },
    ],
  },
  {
    id: "programming",
    name: "Programming",
    icon: Code2,
    tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    desc: {
      en: "Programming concepts and coding assistance",
      hi: "प्रोग्रामिंग अवधारणाएँ और कोडिंग मदद",
      mr: "प्रोग्रॅमिंग संकल्पना आणि कोडिंग मदत",
    },
    detail: {
      en: "A pair-programmer that runs locally: explains errors, walks through code, and teaches concepts from beginner level upward — without sending your code anywhere.",
    },
    langs: ["en"],
    sizeMB: 218,
    version: "1.1.0",
    updatedAt: "Jan 2026",
    demoIncluded: true,
    capabilities: [
      "Explain concepts from beginner level",
      "Explain error messages and stack traces",
      "Walk through code line by line",
      "Write and review small examples",
      "Work offline",
    ],
    knowledge: ["Python", "Java", "JavaScript", "Data structures", "Debugging"],
    sources: [{ name: "Language documentation", kind: "Official docs" }],
  },
  {
    id: "education",
    name: "Education",
    icon: GraduationCap,
    tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    desc: {
      en: "Study help, practice questions and clear explanations",
    },
    detail: {
      en: "A patient tutor for school and self-study — explanations, practice questions and step-by-step problem solving.",
    },
    langs: ["en", "hi", "mr"],
    sizeMB: 160,
    version: "1.0.0",
    updatedAt: "Dec 2025",
    capabilities: ["Explain topics simply", "Generate practice questions", "Step-by-step solutions"],
    knowledge: ["School subjects", "Exam practice"],
  },
  {
    id: "mathematics",
    name: "Mathematics",
    icon: Sigma,
    tint: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    desc: { en: "Step-by-step math from school level to calculus" },
    detail: { en: "Clear, step-by-step mathematics — arithmetic to calculus, with reasoning shown, not just answers." },
    langs: ["en"],
    sizeMB: 148,
    version: "1.2.3",
    updatedAt: "Nov 2025",
    capabilities: ["Step-by-step solutions", "Show reasoning", "Practice problems"],
    knowledge: ["Algebra", "Geometry", "Calculus", "Statistics"],
  },
  {
    id: "local-gov",
    name: "Local Government Info",
    icon: Landmark,
    tint: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    desc: { en: "Schemes, documents and local services, in your language" },
    detail: { en: "Find public schemes, required documents and office procedures without hunting through portals." },
    langs: ["en", "hi", "mr"],
    sizeMB: 120,
    version: "0.4.0",
    updatedAt: "Jan 2026",
    capabilities: ["Explain schemes", "List required documents", "Guide to local services"],
    knowledge: ["State schemes", "Certificates", "Local offices"],
  },
  {
    id: "personal-knowledge",
    name: "Personal Knowledge",
    icon: NotebookPen,
    tint: "bg-stone-500/10 text-stone-600 dark:text-stone-400",
    desc: { en: "Ask questions about your own documents — notes, research, business records" },
    detail: { en: "Create a private Skill from your own PDFs, notes and docs. Nothing leaves the device." },
    langs: ["en", "hi", "mr"],
    sizeMB: 40,
    version: "0.2.0",
    updatedAt: "Feb 2026",
    recommended: true,
    capabilities: ["Answer from your documents", "Search personal notes offline"],
    knowledge: ["Your files"],
  },
];

export const getSkill = (id: string): Skill | undefined => {
  const catalog = SKILL_CATALOG.find((s) => s.id === id);
  if (catalog) return catalog;
  const meta = useApp.getState().customSkills.find((s) => s.id === id);
  return meta ? customToSkill(meta) : undefined;
};

export const SUGGESTIONS: Partial<Record<string, Partial<Record<Lang, string[]>>>> = {
  agriculture: {
    en: [
      "What can I grow this month?",
      "Why are my cotton leaves turning yellow?",
      "How often should I water soybean?",
    ],
    hi: ["इस महीने क्या उगा सकता हूँ?", "कपास के पत्ते पीले क्यों हो रहे हैं?", "सोयाबीन में पानी कितनी बार दें?"],
    mr: ["या महिन्यात काय घालू शकतो?", "कापसाची पाने पिवळी का पडत आहेत?", "सोयाबीनला पाणी किती वेळा द्यावे?"],
  },
  "ai-research": {
    en: ["What is LoRA in simple words?", "Summarize this concept", "How do transformers learn?"],
    hi: ["LoRA क्या है, आसान भाषा में समझाएँ", "इस कॉन्सेप्ट को सारांशित करें"],
    mr: ["LoRA म्हणजे काय, सोप्या भाषेत सांगा", "ही संकल्पना सारांशित करा"],
  },
  programming: {
    en: ["Explain recursion like I'm a beginner", "Explain this Java error", "Teach me Python"],
    hi: ["रिकर्सन सरल भाषा में समझाएँ", "इस Java एरर को समझाएँ"],
    mr: ["रिकर्षन सोप्या भाषेत समजावून सांगा", "हा Java एरर समजावून सांगा"],
  },
  general: {
    en: [
      "Explain recursion simply",
      "What is LoRA?",
      "What should I check if cotton leaves turn yellow?",
      "Help me plan my study",
      "Explain quantum computing",
    ],
    hi: ["रिकर्सन सरलता से समझाएँ", "LoRA क्या है?", "कपास के पीले पत्तों की जाँच कैसे करें", "मेरी पढाई की योजना बनाएँ"],
    mr: ["रिकर्षन सोप्या भाषेत सांगा", "LoRA म्हणजे काय?", "कापसाची पाने पिवळी पडत असतील तर काय तपासावे", "माझ्या अभ्यासाची योजना कर"],
  },
};

export const suggestionsFor = (skillId: string, lang: Lang): string[] => {
  const by = SUGGESTIONS[skillId] ?? SUGGESTIONS.general!;
  return by[lang] ?? by.en ?? [];
};
