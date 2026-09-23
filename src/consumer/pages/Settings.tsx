import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronRight, Globe, Mic, Cpu, HardDrive, ShieldCheck,
  User, Info, Download, Trash2, RefreshCw, Boxes, Check, PlugZap,
} from "lucide-react";
import { useApp, useRuntime, type Theme } from "../store/app";
import { LANGS, translate } from "../lib/i18n";
import { getSkill } from "../lib/data";
import { useChats } from "../store/chats";
import { reprobe, getAccessKey, setAccessKey, detectLive } from "../api/client";
import { isSTTSupported, isTTSSupported } from "../lib/voice";
import { Badge, Button, Card, Input } from "../components/ui";
import { RangeSlider, Modal } from "../components/overlay";
import { SectionTitle, LogoMark, StatusDot } from "../components/core";
import { MotionPage } from "../components/motion";
import { toast } from "../components/toast";
import { cn } from "../lib/utils";

function Row({
  icon: Icon,
  title,
  note,
  noteIcon,
  onClick,
  right,
  danger,
}: {
  icon?: any;
  title: string;
  note?: string;
  noteIcon?: boolean;
  onClick?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
}) {
  const interactive = !!onClick;
  return (
    <button
      onClick={onClick}
      disabled={!interactive}
      className={cn(
        "flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors",
        interactive && "hover:bg-black/[0.025] dark:hover:bg-white/[0.04]",
        danger && "text-red-600 dark:text-red-400",
      )}
    >
      {Icon && (
        <Icon
          className={cn("h-[18px] w-[18px] shrink-0", danger ? "text-red-500" : "text-ink-3 dark:text-night-ink3")}
        />
      )}
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate text-[14.5px] font-medium", danger ? "" : "text-ink dark:text-night-ink")}>{title}</span>
        {note && (
          <span className="mt-0.5 flex items-center gap-1.5 truncate text-[12.5px] text-ink-3 dark:text-night-ink3">
            {noteIcon && <StatusDot tone="warn" />}
            {note}
          </span>
        )}
      </span>
      {right ?? (interactive && <ChevronRight className="h-4 w-4 shrink-0 text-ink-3 dark:text-night-ink3" />)}
    </button>
  );
}

function Group({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section>
      {title && <SectionTitle title={title} className="mt-8" />}
      <Card className="divide-y divide-black/[0.06] overflow-hidden dark:divide-white/[0.07]">{children}</Card>
    </section>
  );
}

export default function SettingsPage() {
  const lang = useApp((s) => s.lang);
  const setLang = useApp((s) => s.setLang);
  const theme = useApp((s) => s.theme);
  const setTheme = useApp((s) => s.setTheme);
  const responseStyle = useApp((s) => s.responseStyle);
  const setResponseStyle = useApp((s) => s.setResponseStyle);
  const voiceSpeed = useApp((s) => s.voiceSpeed);
  const setVoiceSpeed = useApp((s) => s.setVoiceSpeed);
  const installed = useApp((s) => s.installedSkills);
  const defaultSkillId = useApp((s) => s.defaultSkillId);
  const setDefaultSkill = useApp((s) => s.setDefaultSkill);
  const clearAll = useChats((s) => s.clearAll);
  const conversations = useChats((s) => s.conversations);
  const live = useRuntime((s) => s.live);
  const setLive = useRuntime((s) => s.setLive);
  const setBackend = useRuntime((s) => s.setBackend);
  const navigate = useNavigate();
  const t = (k: string) => translate(lang, k);

  const [probing, setProbing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);
  const [keyText, setKeyText] = useState("");

  const exportData = () => {
    const payload = {
      app: "SkillBox AI",
      exportedAt: new Date().toISOString(),
      conversations,
      settings: { lang, theme, responseStyle, defaultSkillId, installedSkills: installed },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "skillbox-data.json";
    a.click();
    URL.revokeObjectURL(url);
    toast(t("toast.exported"), "success");
  };

  const styleOptions = [
    { id: "concise", label: t("settings.style.concise") },
    { id: "balanced", label: t("settings.style.balanced") },
    { id: "detailed", label: t("settings.style.detailed") },
  ] as const;

  const themeOptions: { id: Theme; label: string }[] = [
    { id: "light", label: t("settings.light") },
    { id: "dark", label: t("settings.dark") },
    { id: "system", label: t("settings.system") },
  ];

  return (
    <MotionPage>
      <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 sm:px-6">
        <header className="px-1">
          <h1 className="font-display text-[24px] font-semibold tracking-tight">{t("settings.title")}</h1>
        </header>

        {/* profile */}
        <Group>
          <Row
            icon={User}
            title={t("settings.localAccount")}
            note={t("settings.localAccount.note")}
            right={<div className="grid h-8 w-8 place-items-center rounded-full bg-brand-500/12 text-[13px] font-semibold text-brand-700 dark:text-brand-300">You</div>}
          />
        </Group>

        {/* language */}
        <section>
          <SectionTitle title={t("settings.language")} className="mt-8" />
          <Card className="p-2">
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
              {LANGS.map((l) => {
                const active = l.code === lang;
                return (
                  <motion.button
                    key={l.code}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setLang(l.code);
                      toast(translate(l.code, "toast.languageChanged"), "success");
                    }}
                    className={cn(
                      "relative flex items-center justify-between rounded-xl px-3.5 py-3 text-left transition-colors",
                      active ? "bg-brand-500/10" : "hover:bg-black/[0.03] dark:hover:bg-white/[0.05]",
                    )}
                    role="radio"
                    aria-checked={active}
                  >
                    <span>
                      <span className={cn("block text-[14.5px] font-medium", active && "text-brand-700 dark:text-brand-300")}>{l.native}</span>
                      <span className="text-[11.5px] text-ink-3 dark:text-night-ink3">{l.name}</span>
                    </span>
                    {active && <Check className="h-4 w-4 text-brand-600" />}
                  </motion.button>
                );
              })}
            </div>
            <p className="flex items-center gap-2 px-3 pb-2 pt-3 text-[12px] text-ink-3 dark:text-night-ink3">
              <Globe className="h-3.5 w-3.5" /> {t("settings.language.note")}
            </p>
          </Card>
        </section>

        {/* appearance */}
        <section>
          <SectionTitle title={t("settings.appearance")} className="mt-8" />
          <Card className="p-2">
            <div className="grid grid-cols-3 gap-1" role="radiogroup">
              {themeOptions.map((o) => (
                <motion.button
                  key={o.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setTheme(o.id)}
                  role="radio"
                  aria-checked={theme === o.id}
                  className={cn(
                    "rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors",
                    theme === o.id
                      ? "bg-ink text-paper dark:bg-white dark:text-black"
                      : "text-ink-2 hover:bg-black/[0.04] dark:text-night-ink2 dark:hover:bg-white/[0.06]",
                  )}
                >
                  {o.label}
                </motion.button>
              ))}
            </div>
          </Card>
        </section>

        {/* AI */}
        <section>
          <SectionTitle title={t("settings.ai")} className="mt-8" />
          <Card className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
            <div className="px-4 py-3.5">
              <p className="text-[14px] font-medium">{t("settings.responseStyle")}</p>
              <div className="mt-2.5 grid grid-cols-3 gap-1 rounded-xl bg-black/[0.04] p-1 dark:bg-white/[0.06]">
                {styleOptions.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setResponseStyle(o.id)}
                    className={cn(
                      "rounded-lg px-2 py-1.5 text-[12.5px] font-medium transition-colors",
                      responseStyle === o.id
                        ? "bg-surface shadow-sm dark:bg-night-2"
                        : "text-ink-2 dark:text-night-ink2",
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <Row icon={Cpu} title={t("settings.modelStatus")} onClick={() => navigate("/settings/model")} />
            <Row icon={Boxes} title={t("settings.manageDownloads")} onClick={() => navigate("/downloads")} />
            <div className="px-4 py-3.5">
              <p className="text-[14px] font-medium">{t("settings.defaultSkill")}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {["general", ...installed].map((id) => {
                  const s = getSkill(id);
                  const active = defaultSkillId === id;
                  if (!s && id !== "general") return null;
                  return (
                    <button
                      key={id}
                      onClick={() => setDefaultSkill(id)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                        active
                          ? "border-brand-500/50 bg-brand-500/10 text-brand-700 dark:text-brand-300"
                          : "border-line text-ink-2 hover:bg-black/[0.03] dark:text-night-ink2 dark:hover:bg-white/[0.05]",
                      )}
                    >
                      {id === "general" ? t("chat.general") : s!.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        </section>

        {/* voice */}
        <section>
          <SectionTitle title={t("settings.voice")} className="mt-8" />
          <Card className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
            <div className="px-4 py-3.5">
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-medium">{t("settings.voiceSpeed")}</p>
                <span className="text-[13px] text-ink-3 dark:text-night-ink3">{voiceSpeed.toFixed(1)}×</span>
              </div>
              <RangeSlider value={voiceSpeed} onChange={setVoiceSpeed} label={t("settings.voiceSpeed")} />
            </div>
            <Row
              icon={Mic}
              title={t("settings.offlineVoice")}
              note={isTTSSupported() || isSTTSupported() ? "Available — on-device" : t("settings.voice.notInstalled")}
              onClick={() => navigate("/downloads")}
            />
          </Card>
        </section>

        {/* privacy + storage */}
        <section className="mt-8">
          <Card className="divide-y divide-black/[0.06] overflow-hidden dark:divide-white/[0.07]">
          <Row icon={ShieldCheck} title={t("settings.privacyLink")} note={lang === "en" ? "Your conversations stay on this device." : t("settings.localAccount.note")} onClick={() => navigate("/settings/privacy")} />
          <Row icon={HardDrive} title={t("settings.storage")} onClick={() => navigate("/downloads")} />
          <Row icon={Download} title={t("settings.exportData")} onClick={exportData} />
          </Card>
        </section>

        {/* advanced */}
        <section>
          <SectionTitle title={t("settings.advanced")} className="mt-8" />
          <Card className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
            <div className="flex items-center gap-3.5 px-4 py-3.5">
              <PlugZap className="h-[18px] w-[18px] shrink-0 text-ink-3 dark:text-night-ink3" />
              <span className="min-w-0 flex-1">
                <span className="block text-[14.5px] font-medium">{t("settings.backend")}</span>
                <span className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-ink-3 dark:text-night-ink3">
                  <StatusDot tone={live ? "ok" : "warn"} />
                  {live ? t("settings.backend.local") : t("settings.backend.demo")}
                </span>
              </span>
              {getAccessKey() && !live ? null : !live ? (
                <Button variant="outline" size="sm" onClick={() => setKeyOpen(true)}>
                  Key
                </Button>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                disabled={probing}
                onClick={async () => {
                  setProbing(true);
                  const kind = await detectLive();
                  setLive(kind !== null);
                  setBackend(await reprobe());
                  setProbing(false);
                  toast(kind !== null ? t("settings.backend.local") : t("settings.backend.demo"), kind !== null ? "success" : "default");
                }}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", probing && "animate-spin")} />
                Retry
              </Button>
            </div>
            <Row icon={Trash2} title={t("settings.clearChats")} danger onClick={() => setConfirmClear(true)} />
          </Card>
        </section>

        {/* about */}
        <section>
          <SectionTitle title={t("settings.about")} className="mt-8" />
          <Card className="flex items-center gap-4 p-4">
            <LogoMark className="h-11 w-11" />
            <div className="min-w-0 flex-1">
              <p className="font-display text-[15px] font-semibold">SkillBox AI</p>
              <p className="text-[12.5px] text-ink-3 dark:text-night-ink3">
                {t("app.subtag")} · v0.1 consumer prototype
              </p>
            </div>
            <Badge tone="brand">
              <Info className="h-3 w-3" /> Prototype
            </Badge>
          </Card>
        </section>
      </div>

      {/* runtime key — discreet, unbranded */}
      <Modal open={keyOpen} onOpenChange={setKeyOpen} title="Runtime key">
        <p className="text-[13.5px] leading-relaxed text-ink-2 dark:text-night-ink2">
          Paste the access key for the on-device AI runtime to enable live local answers.
          It stays in this browser's local storage.
        </p>
        <Input
          className="mt-3 font-mono text-[13px]"
          placeholder="sk-…"
          value={keyText}
          onChange={(e) => setKeyText(e.target.value)}
          autoFocus
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setKeyOpen(false)}>{t("onboard.back")}</Button>
          <Button
            variant="primary"
            disabled={!keyText.trim()}
            onClick={async () => {
              setAccessKey(keyText);
              setKeyOpen(false);
              setKeyText("");
              const kind = await detectLive();
              setLive(kind !== null);
              toast(kind !== null ? t("settings.backend.local") : t("settings.backend.demo"), kind !== null ? "success" : "default");
            }}
          >
            Save
          </Button>
        </div>
      </Modal>

      <Modal open={confirmClear} onOpenChange={setConfirmClear} title={t("settings.clearChats")}>
        <p className="text-[14px] text-ink-2 dark:text-night-ink2">
          All conversations on this device will be deleted. Your Skills stay installed.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmClear(false)}>{t("onboard.back")}</Button>
          <Button
            variant="danger"
            onClick={() => {
              clearAll();
              setConfirmClear(false);
              toast(t("toast.chatDeleted"));
            }}
          >
            {t("settings.clearChats")}
          </Button>
        </div>
      </Modal>
    </MotionPage>
  );
}
