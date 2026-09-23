/**
 * SkillBox Skills — unified DVD gallery.
 *
 * Flow:
 *   1. Browse the skill DVDs in a gallery
 *   2. Tap a DVD to open the SkillBox Player bottom sheet
 *   3. Watch the insertion animation
 *   4. Hit Play to enter chat with that skill selected
 */
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Sprout, BrainCircuit, Code2, GraduationCap, Sigma, Landmark,
  NotebookPen, Sparkles, Plus, Upload, Play, Info,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useApp, type CustomSkillMeta } from "../store/app";
import { SKILL_CATALOG, skillDesc } from "../lib/data";
import { translate, type Lang } from "../lib/i18n";
import { cn, formatBytes, uid } from "../lib/utils";
import { useStartChat } from "../lib/startChat";
import { LogoMark, StatusDot, EmptyState } from "../components/core";
import { Button, Card, Badge } from "../components/ui";
import { LanguageMenu } from "../components/LanguageMenu";
import { CreateSkillDialog } from "../components/CreateSkill";
import { toast } from "../components/toast";

interface DvdMeta {
  id: string;
  name: string;
  desc: string;
  icon: LucideIcon;
  color: string;
  accent: string;
  spine: string;
  installed: boolean;
  sizeMB: number;
  version?: string;
  updatedAt?: string;
  langs?: Lang[];
}

const PALETTE: Record<string, { color: string; accent: string; spine: string }> = {
  agriculture: { color: "#165c39", accent: "#44d39a", spine: "#d8faea" },
  "ai-research": { color: "#382168", accent: "#a883ff", spine: "#efe6ff" },
  programming: { color: "#0d4d70", accent: "#53c7ff", spine: "#dff4ff" },
  education: { color: "#6f4e0f", accent: "#ffbb42", spine: "#fff0c6" },
  mathematics: { color: "#721d1d", accent: "#ff8a8a", spine: "#ffe1e1" },
  "local-gov": { color: "#2e3178", accent: "#8da1ff", spine: "#e2e7ff" },
  "personal-knowledge": { color: "#3a3a3a", accent: "#bbbbbb", spine: "#ededed" },
  general: { color: "#191919", accent: "#12a06f", spine: "#d9f7eb" },
};

const ICON_MAP: Record<string, LucideIcon> = {
  agriculture: Sprout,
  "ai-research": BrainCircuit,
  programming: Code2,
  education: GraduationCap,
  mathematics: Sigma,
  "local-gov": Landmark,
  "personal-knowledge": NotebookPen,
  general: Sparkles,
};

function buildDvds(installed: string[], customSkills: CustomSkillMeta[], lang: Lang): DvdMeta[] {
  const general: DvdMeta = {
    id: "general",
    name: translate(lang, "chat.general"),
    desc: translate(lang, "app.tagline"),
    icon: Sparkles,
    ...PALETTE.general,
    installed: true,
    sizeMB: 0,
    version: "Base",
    updatedAt: "Ready",
    langs: ["en", "hi", "mr"],
  };

  const catalog = SKILL_CATALOG.map((s): DvdMeta => ({
    id: s.id,
    name: s.name,
    desc: skillDesc(s, lang),
    icon: ICON_MAP[s.id] ?? Sparkles,
    ...(PALETTE[s.id] ?? PALETTE.general),
    installed: installed.includes(s.id),
    sizeMB: s.sizeMB,
    version: s.version,
    updatedAt: s.updatedAt,
    langs: s.langs,
  }));

  const personal = customSkills.map((s): DvdMeta => ({
    id: s.id,
    name: s.name,
    desc: s.desc,
    icon: NotebookPen,
    ...PALETTE["personal-knowledge"],
    installed: true,
    sizeMB: s.sizeMB,
    version: s.version,
    updatedAt: s.updatedAt,
    langs: s.langs,
  }));

  return [general, ...catalog, ...personal];
}

/**
 * DVD case visual.
 * Designed to feel like a physical disc box:
 * - transparent outer plastic shell
 * - cover art panel inside
 * - top locking strip
 * - spine bar
 * - tiny disc/ring mark
 */
function DvdCase({
  dvd,
  active,
  onClick,
}: {
  dvd: DvdMeta;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = dvd.icon;
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      className="group relative text-left outline-none"
      style={{ perspective: 1000 }}
      aria-label={`${dvd.name} skill`}
      aria-pressed={active}
    >
      <div
        className={cn(
          "relative h-[204px] w-[146px] overflow-hidden rounded-[14px] border border-white/[0.08] bg-white/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-[1px] transition-all duration-300",
          active ? "ring-2 ring-white/35 shadow-[0_16px_44px_rgba(0,0,0,0.45)]" : "hover:border-white/[0.14]",
        )}
      >
        {/* plastic outer sheen */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.14),transparent_28%,transparent_72%,rgba(255,255,255,0.08))]" />

        {/* top latch strip */}
        <div className="absolute inset-x-0 top-0 h-4 border-b border-white/[0.08] bg-black/15" />

        {/* spine */}
        <div className="absolute inset-y-0 left-0 w-[12px] border-r border-black/15 bg-black/18" />
        <div className="absolute inset-y-2 left-[2px] w-[8px] rounded-full bg-white/[0.04]" />

        {/* cover */}
        <div
          className="absolute inset-x-[10px] inset-y-[12px] overflow-hidden rounded-[10px] border border-white/[0.08]"
          style={{
            background: `linear-gradient(155deg, color-mix(in oklab, ${dvd.color} 76%, white) 0%, ${dvd.color} 36%, color-mix(in oklab, ${dvd.color} 72%, black) 100%)`,
          }}
        >
          {/* printed pattern */}
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35)_0,transparent_25%),linear-gradient(135deg,rgba(255,255,255,0.08)_0,transparent_60%)]" />
          <div className="absolute inset-0 opacity-15 [background-image:repeating-linear-gradient(0deg,transparent_0_8px,rgba(255,255,255,0.06)_8px_9px)]" />

          {/* disc outline */}
          <div className="absolute left-1/2 top-[30%] -translate-x-1/2 -translate-y-1/2">
            <div
              className="grid h-[74px] w-[74px] place-items-center rounded-full border-2 shadow-inner"
              style={{
                borderColor: `${dvd.accent}`,
                boxShadow: `0 0 0 6px ${dvd.accent}12 inset, 0 0 28px ${dvd.accent}16`,
              }}
            >
              <div className="grid h-[20px] w-[20px] place-items-center rounded-full border border-white/20 bg-black/20">
                <Icon className="h-3.5 w-3.5" style={{ color: dvd.accent }} strokeWidth={2.2} />
              </div>
            </div>
          </div>

          {/* status chip */}
          {dvd.installed && (
            <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/35 px-1.5 py-0.5 text-[8px] font-semibold text-white/75 backdrop-blur-sm">
              <StatusDot tone="ok" className="h-1.5 w-1.5" /> Ready
            </div>
          )}

          {/* lower title block */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent px-3 pb-3 pt-10">
            <p className="truncate text-[12px] font-bold uppercase tracking-[0.08em] text-white/95">
              {dvd.name}
            </p>
            <p className="mt-1 line-clamp-2 text-[9px] leading-tight text-white/60">
              {dvd.desc}
            </p>
          </div>

          {/* tiny footer print */}
          <div className="absolute bottom-[52px] left-3 text-[7px] font-semibold uppercase tracking-[0.18em] text-white/30">
            Skill Disc
          </div>
        </div>

        {active && (
          <motion.div
            layoutId="skill-disc-active"
            className="pointer-events-none absolute inset-0 rounded-[14px]"
            style={{ boxShadow: `inset 0 0 34px ${dvd.accent}26` }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
          />
        )}
      </div>
    </motion.button>
  );
}

/**
 * Restored SkillBox Player treatment.
 * This is intentionally close to the earlier good version: tighter chrome,
 * slot groove, sliding disc, and a clear control rail — but shown inside a
 * bottom sheet instead of inline on the page.
 */
type DiscPhase = "waiting" | "inserting" | "ready";

function PlayerCard({
  dvd,
  discPhase,
  installing,
  onPlay,
  onInstall,
  onDetails,
}: {
  dvd: DvdMeta;
  discPhase: DiscPhase;
  installing: boolean;
  onPlay: () => void;
  onInstall: () => void;
  onDetails: () => void;
}) {
  const Icon = dvd.icon;
  const isInstalled = dvd.installed;
  return (
    <div className="overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#141414] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
      <div className="flex items-center justify-between border-b border-white/[0.05] bg-white/[0.02] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <LogoMark className="h-4 w-4" />
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/42">
            SkillBox Player
          </span>
        </div>
        <div className="flex items-center gap-2">
          <StatusDot tone={isInstalled ? "ok" : "warn"} className="h-1.5 w-1.5" />
          <span className="text-[10px] font-medium text-white/42">
            {isInstalled ? "Ready" : "Not installed"}
          </span>
        </div>
      </div>

      <div className="relative flex flex-col items-center gap-6 px-6 py-8">
        {/* slot + insertion */}
        <div className="relative flex h-24 w-full items-center justify-center">
          {/* slot groove; lights up as the disc arrives */}
          <motion.div
            className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-white/[0.05]"
            animate={{
              boxShadow:
                discPhase === "ready"
                  ? `0 0 18px 2px ${dvd.accent}66`
                  : discPhase === "inserting"
                    ? `0 0 26px 5px ${dvd.accent}44`
                    : "0 0 0px 0px transparent",
              backgroundColor:
                discPhase === "waiting" ? "rgba(255,255,255,0.05)" : `${dvd.accent}55`,
            }}
            transition={{ duration: 0.35 }}
          />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={dvd.id}
              initial={false}
              animate={
                discPhase === "waiting"
                  ? { x: 170, opacity: 0, rotateY: -22, scale: 0.96 }
                  : discPhase === "inserting"
                    ? { x: 0, opacity: 1, rotateY: 0, scale: 1 }
                    : { x: 0, opacity: 1, rotateY: 0, scale: [1, 1.035, 1] }
              }
              exit={{ x: -130, opacity: 0, rotateY: 14 }}
              transition={
                discPhase === "ready"
                  ? { scale: { duration: 0.4, ease: "easeOut" } }
                  : { type: "spring", stiffness: 150, damping: 17 }
              }
              style={{ perspective: 700 }}
              className="relative z-10"
            >
              <div
                className="flex h-[78px] w-[178px] items-center gap-3 rounded-xl border px-3.5 shadow-2xl"
                style={{
                  background: `linear-gradient(145deg, color-mix(in oklab, ${dvd.color} 82%, white), ${dvd.color} 45%, color-mix(in oklab, ${dvd.color} 68%, black))`,
                  borderColor: `${dvd.accent}44`,
                }}
              >
                <div className="absolute inset-y-0 left-0 w-[14px] rounded-l-xl bg-black/15" />
                <div
                  className="ml-4 grid h-12 w-12 shrink-0 place-items-center rounded-full border"
                  style={{
                    borderColor: dvd.accent,
                    background: `radial-gradient(circle, ${dvd.accent}50, ${dvd.color})`,
                  }}
                >
                  <Icon className="h-5 w-5 text-white" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-bold uppercase tracking-[0.08em] text-white/92">
                    {dvd.name}
                  </p>
                  <p className="mt-0.5 text-[8px] font-medium uppercase tracking-[0.18em] text-white/45">
                    Skill Disc
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="text-center">
          <h2 className="text-[22px] font-bold tracking-tight text-white">{dvd.name}</h2>
          <p className="mx-auto mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-white/52">
            {dvd.desc}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <Badge tone="neutral" className="bg-white/5 text-white/42">
              {isInstalled ? "OFFLINE READY" : formatBytes(dvd.sizeMB)}
            </Badge>
            {dvd.version && (
              <Badge tone="neutral" className="bg-white/5 text-white/42">
                v{dvd.version}
              </Badge>
            )}
            {dvd.langs?.slice(0, 2).map((l) => (
              <Badge key={l} tone="neutral" className="bg-white/5 text-white/42">
                {({ en: "English", hi: "हिन्दी", mr: "मराठी" } as Record<Lang, string>)[l]}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/[0.05] px-5 py-4">
        <button
          onClick={onDetails}
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand-400 transition-colors hover:text-brand-300"
        >
          <Info className="h-3.5 w-3.5" /> View details
        </button>
        {isInstalled ? (
          <motion.button
            onClick={onPlay}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[13px] font-bold text-black shadow-xl"
          >
            <Play className="h-4 w-4 fill-current" /> Use Skill
          </motion.button>
        ) : (
          <Button
            variant="accent"
            size="lg"
            disabled={installing}
            onClick={onInstall}
            className="min-w-[164px]"
          >
            {installing ? "Installing…" : "Install Skill"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function Skills() {
  const navigate = useNavigate();
  const lang = useApp((s) => s.lang);
  const installed = useApp((s) => s.installedSkills);
  const customSkills = useApp((s) => s.customSkills);
  const touchSkill = useApp((s) => s.touchSkill);
  const installSkill = useApp((s) => s.installSkill);
  const addCustomSkill = useApp((s) => s.addCustomSkill);
  const startChat = useStartChat();
  const t = (k: string) => translate(lang, k);

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [discPhase, setDiscPhase] = useState<DiscPhase>("waiting");
  const [installing, setInstalling] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  /** Ready timer helper for reuse after install completes. */
  const scheduleReady = () => {
    clearTimers();
    timersRef.current.push(window.setTimeout(() => setDiscPhase("ready"), 620));
  };

  const dvds = useMemo(() => buildDvds(installed, customSkills, lang), [installed, customSkills, lang]);
  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () => (q ? dvds.filter((d) => d.name.toLowerCase().includes(q) || d.desc.toLowerCase().includes(q)) : dvds),
    [dvds, q],
  );

  const activeDvd = useMemo(
    () => (selectedId ? dvds.find((d) => d.id === selectedId) ?? null : null),
    [dvds, selectedId],
  );

  const openPlayer = (id: string) => {
    clearTimers();
    setSelectedId(id);
    // keep the disc hidden while the sheet slides up; insertion starts on settle
    setDiscPhase("waiting");
    setSheetOpen(true);
  };

  const closePlayer = () => {
    clearTimers();
    setSheetOpen(false);
    setDiscPhase("waiting");
  };

  const handleInstall = () => {
    if (!selectedId) return;
    setInstalling(true);
    setTimeout(() => {
      installSkill(selectedId);
      setInstalling(false);
      toast(t("toast.skillInstalled"), "success");
    }, 1500);
  };

  const handlePlay = () => {
    if (!selectedId) return;
    setLeaving(true);
    if (selectedId !== "general") touchSkill(selectedId);
    setTimeout(() => startChat(selectedId), 540);
  };

  const onImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const pkg = JSON.parse(text);
      const meta: CustomSkillMeta = {
        id: pkg.id && typeof pkg.id === "string" ? pkg.id : `custom-${uid()}`,
        name: typeof pkg.name === "string" ? pkg.name : "Imported Skill",
        desc: typeof pkg.desc === "string" ? pkg.desc : "Personal skill",
        langs: Array.isArray(pkg.langs) ? pkg.langs : [lang],
        sizeMB: typeof pkg.sizeMB === "number" ? pkg.sizeMB : 1,
        version: typeof pkg.version === "string" ? pkg.version : "0.1.0",
        updatedAt: new Date().toLocaleDateString(undefined, { month: "short", year: "numeric" }),
        prototype: true,
        knowledge: Array.isArray(pkg.knowledge) ? pkg.knowledge : [],
      };
      addCustomSkill(meta);
      toast(t("toast.skillInstalled"), "success");
      openPlayer(meta.id);
    } catch {
      toast("That file doesn't look like a Skill package", "offline");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-dvh bg-[#0a0a0a] text-white"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(15,133,95,0.08) 0%, transparent 60%)",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
        {/* header */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[26px] font-semibold tracking-tight">{t("skills.title")}</h1>
            <p className="mt-1 text-[14px] text-white/45">Give your AI new capabilities.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hover:bg-white/5 text-white/70" onClick={() => setCreateOpen(true)}>
              <Plus className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-white/5 text-white/70" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" />
            </Button>
            <LanguageMenu prominent className="border-white/10 bg-white/5 text-white/70 hover:bg-white/8 hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/8 dark:hover:text-white" />
            <input
              ref={fileRef}
              type="file"
              accept=".skill,.json,application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImportFile(f);
                e.target.value = "";
              }}
            />
          </div>
        </header>

        {/* search */}
        <div className="mt-6">
          <div className="relative mx-auto max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/24" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("skills.search")}
              className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-[14px] text-white placeholder:text-white/26 outline-none transition-colors focus:border-brand-500/50 focus:bg-white/[0.06]"
            />
          </div>
        </div>

        {/* stats row */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-center sm:justify-start">
          <Badge tone="neutral" className="bg-white/6 text-white/45">
            {dvds.filter((d) => d.installed).length} installed
          </Badge>
          <Badge tone="neutral" className="bg-white/6 text-white/45">
            {dvds.length} total
          </Badge>
          <Badge tone="neutral" className="bg-white/6 text-white/45">
            DVD Skill Library
          </Badge>
        </div>

        {/* gallery */}
        {filtered.length === 0 ? (
          <Card className="mt-10 border-white/10 bg-white/[0.03] text-white">
            <EmptyState
              icon={Search}
              title="No matching skills"
              body="Try a different search term, or import your own Skill package."
            />
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          >
            {filtered.map((dvd) => (
              <DvdCase
                key={dvd.id}
                dvd={dvd}
                active={selectedId === dvd.id && sheetOpen}
                onClick={() => openPlayer(dvd.id)}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* bottom sheet player */}
      <AnimatePresence>
        {sheetOpen && activeDvd && (
          <>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePlayer}
              className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-[2px]"
              aria-label="Close player"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 240, damping: 28 }}
              onAnimationComplete={(def) => {
                // only start insertion after the sheet has fully slid into place
                if (
                  (def as { y?: number | string } | undefined)?.y === 0 &&
                  discPhase === "waiting"
                ) {
                  setDiscPhase("inserting");
                  scheduleReady();
                }
              }}
              className="fixed inset-x-0 bottom-0 z-[71] px-4 pb-[max(env(safe-area-inset-bottom),16px)] sm:px-6"
            >
              <div className="mx-auto max-w-xl">
                <button
                  onClick={closePlayer}
                  className="mx-auto mb-3 flex h-5 w-14 items-center justify-center rounded-full"
                  aria-label="Close player"
                >
                  <div className="h-1.5 w-14 rounded-full bg-white/20" />
                </button>
                <PlayerCard
                  dvd={activeDvd}
                  discPhase={discPhase}
                  installing={installing}
                  onInstall={handleInstall}
                  onPlay={handlePlay}
                  onDetails={() => navigate(`/skills/${activeDvd.id}`)}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* leaving overlay */}
      <AnimatePresence>
        {leaving && activeDvd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
              className="mb-6 grid h-24 w-24 place-items-center rounded-full border-4 border-brand-500/20 border-t-brand-500"
            >
              <LogoMark className="h-8 w-8" />
            </motion.div>
            <h2 className="text-xl font-bold">Initializing {activeDvd.name}</h2>
            <p className="mt-2 text-sm text-white/40">Loading skill knowledge from disc…</p>
          </motion.div>
        )}
      </AnimatePresence>

      <CreateSkillDialog open={createOpen} onOpenChange={setCreateOpen} />
    </motion.div>
  );
}
