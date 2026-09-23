import { motion } from "framer-motion";
import { Cpu, Mic, BookMarked, Wifi, WifiOff, Boxes, HardDrive, Trash2, RefreshCw } from "lucide-react";
import { useApp, useRuntime } from "../store/app";
import { getSkill } from "../lib/data";
import { translate } from "../lib/i18n";
import { isSTTSupported, isTTSSupported } from "../lib/voice";
import { formatBytes } from "../lib/utils";
import { Badge, Button, Card } from "../components/ui";
import { SectionTitle, SkillIcon, StatusDot } from "../components/core";
import { MotionPage, listVariants, itemVariants } from "../components/motion";
import { toast } from "../components/toast";

export default function Downloads() {
  const lang = useApp((s) => s.lang);
  const installed = useApp((s) => s.installedSkills);
  const removeSkill = useApp((s) => s.removeSkill);
  const live = useRuntime((s) => s.live);
  const online = useRuntime((s) => s.online);
  const t = (k: string) => translate(lang, k);
  const voiceReady = isTTSSupported() || isSTTSupported();

  const skills = installed.map(getSkill).filter(Boolean);
  const skillsMB = skills.reduce((a, s) => a + (s?.sizeMB ?? 0), 0);
  const modelMB = 3680; // demo catalogue value for SkillBox Base
  const knowledgeMB = 214;

  const offlineCenter = [
    {
      icon: Cpu,
      label: "AI Model",
      status: live ? "Ready" : "Ready — demo catalogue",
      tone: "ok" as const,
    },
    {
      icon: Boxes,
      label: "Installed Skills",
      status: `${skills.length} available`,
      tone: "ok" as const,
    },
    {
      icon: Mic,
      label: "Voice",
      status: voiceReady ? "Available — on-device voices" : "Preview — packs not installed",
      tone: (voiceReady ? "ok" : "warn") as "ok" | "warn",
    },
    {
      icon: BookMarked,
      label: "Knowledge Base",
      status: "Ready",
      tone: "ok" as const,
    },
    {
      icon: online ? Wifi : WifiOff,
      label: "Internet",
      status: online ? t("app.online") : t("app.offline"),
      tone: online ? "idle" : ("idle" as const),
    },
  ];

  return (
    <MotionPage>
      <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 sm:px-6">
        <header className="px-1">
          <h1 className="font-display text-[24px] font-semibold tracking-tight">{t("nav.downloads")}</h1>
          <p className="mt-1 text-[14px] text-ink-2 dark:text-night-ink2">
            Your AI, Skills and knowledge — stored on this device.
          </p>
        </header>

        {/* offline center */}
        <SectionTitle title="Offline Center" className="mt-8" />
        <Card className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
          {offlineCenter.map((row) => (
            <div key={row.label} className="flex items-center gap-3.5 px-4 py-3.5">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-black/[0.04] text-ink-2 dark:bg-white/[0.06] dark:text-night-ink2">
                <row.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
              </div>
              <span className="flex-1 text-[14px] font-medium">{row.label}</span>
              <span className="flex items-center gap-2 text-[13px] text-ink-2 dark:text-night-ink2">
                <StatusDot tone={row.tone} />
                {row.status}
              </span>
            </div>
          ))}
        </Card>
        {!online && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center gap-2 rounded-2xl border border-line bg-black/[0.02] px-4 py-3 text-[13px] text-ink-2 dark:bg-white/[0.03] dark:text-night-ink2"
          >
            <WifiOff className="h-4 w-4 shrink-0" />
            {t("app.offline.note")}
          </motion.p>
        )}

        {/* model card */}
        <SectionTitle title="AI Model" className="mt-9" />
        <Card className="flex items-center gap-4 p-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-500/10 text-brand-600">
            <Cpu className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[15px] font-semibold">
              SkillBox Base
              {!live && <Badge tone="amber">Demo</Badge>}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-ink-2 dark:text-night-ink2">
              <StatusDot tone="ok" />
              {formatBytes(modelMB)} · Ready · running on this device
            </p>
          </div>
          <Button variant="ghost" size="md" onClick={() => toast("You're up to date", "success")}>
            <RefreshCw className="h-4 w-4" /> {t("skills.update")}
          </Button>
        </Card>

        {/* installed skills */}
        <SectionTitle title={t("skills.installed")} className="mt-9" />
        <motion.div initial="hidden" animate="show" variants={listVariants} className="space-y-2">
          {skills.map((s) => (
            <motion.div key={s!.id} variants={itemVariants} layout>
              <Card className="flex items-center gap-3.5 p-3.5">
                <SkillIcon icon={s!.icon} tint={s!.tint} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-semibold">{s!.name}</p>
                  <p className="text-[12.5px] text-ink-3 dark:text-night-ink3">
                    {formatBytes(s!.sizeMB)} · v{s!.version}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="iconSm"
                  aria-label={t("skills.remove")}
                  onClick={() => {
                    removeSkill(s!.id);
                    toast(t("toast.skillRemoved"));
                  }}
                >
                  <Trash2 className="h-4 w-4 text-ink-3" />
                </Button>
              </Card>
            </motion.div>
          ))}
          {skills.length === 0 && (
            <Card className="p-6 text-center text-[13.5px] text-ink-2 dark:text-night-ink2">
              {t("skills.empty.body")}
            </Card>
          )}
        </motion.div>

        {/* storage */}
        <SectionTitle title={t("settings.storage")} className="mt-9" />
        <Card className="space-y-4 p-4">
          {[
            { label: "AI Model", mb: modelMB },
            { label: t("nav.skills"), mb: skillsMB },
            { label: "Knowledge", mb: knowledgeMB },
          ].map((row) => (
            <div key={row.label}>
              <div className="mb-1.5 flex items-center justify-between text-[13px]">
                <span className="font-medium">{row.label}</span>
                <span className="text-ink-3 dark:text-night-ink3">{formatBytes(row.mb)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-black/[0.07] dark:bg-white/[0.09]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (row.mb / modelMB) * 100)}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 0.61, 0.21, 1] }}
                  className="h-full rounded-full bg-brand-600"
                />
              </div>
            </div>
          ))}
          <p className="flex items-center gap-2 pt-1 text-[12px] text-ink-3 dark:text-night-ink3">
            <HardDrive className="h-3.5 w-3.5" />
            Approximate device storage (demo catalogue values)
          </p>
        </Card>

        {/* voice packs */}
        <SectionTitle title={t("settings.offlineVoice")} className="mt-9" />
        <Card className="flex items-center gap-4 p-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-stone-500/10 text-stone-500 dark:text-stone-400">
            <Mic className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[15px] font-semibold">
              Offline voice packs
              {!voiceReady && <Badge>Prototype</Badge>}
            </p>
            <p className="mt-0.5 text-[13px] leading-snug text-ink-2 dark:text-night-ink2">
              {voiceReady
                ? "On-device listening and speaking are available."
                : t("settings.voice.notInstalled")}
            </p>
          </div>
        </Card>
      </div>
    </MotionPage>
  );
}
