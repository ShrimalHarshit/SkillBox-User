import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowUp, ArrowRight, Mic, Plus, FileUp, Image, WifiOff, Languages, ShieldCheck, Disc3, Sparkles
} from "lucide-react";
import { useApp, useRuntime } from "../store/app";
import { translate } from "../lib/i18n";
import { SKILL_CATALOG, skillDesc, suggestionsFor } from "../lib/data";
import { useStartChat } from "../lib/startChat";
import { cn, timeLabel } from "../lib/utils";
import { Wordmark, SkillIcon, StatusDot, SectionTitle, EmptyState } from "../components/core";
import { Button, Card, PressableCard, Badge } from "../components/ui";
import { MotionPage, listVariants, itemVariants } from "../components/motion";
import { LanguageMenu } from "../components/LanguageMenu";
import { Menu, MenuItem, Tip } from "../components/overlay";

export function StatusPill({ className }: { className?: string }) {
  const live = useRuntime((s) => s.live);
  const online = useRuntime((s) => s.online);
  const lang = useApp((s) => s.lang);
  const label = live
    ? translate(lang, "app.localReady")
    : translate(lang, "app.demo");
  const tone = live ? "ok" : "warn";
  return (
    <Tip
      label={live ? translate(lang, "home.reassure") : translate(lang, "app.demo.note")}
      side="bottom"
    >
      <span
        className={cn(
          "inline-flex h-9 cursor-default items-center gap-2 rounded-full border border-line bg-surface px-3 text-[12.5px] font-medium text-ink-2 dark:bg-night-1 dark:text-night-ink2",
          className,
        )}
      >
        <StatusDot tone={online || live ? tone : "idle"} />
        {!online ? translate(lang, "app.offline") : label}
      </span>
    </Tip>
  );
}

export default function Home() {
  const lang = useApp((s) => s.lang);
  const installed = useApp((s) => s.installedSkills);
  const lastUsed = useApp((s) => s.lastUsed);
  const defaultSkillId = useApp((s) => s.defaultSkillId);
  const live = useRuntime((s) => s.live);
  const startChat = useStartChat();
  const navigate = useNavigate();

  const skills = useMemo(
    () => SKILL_CATALOG.filter((s) => installed.includes(s.id)),
    [installed],
  );
  const suggestionSeed = installed.includes(defaultSkillId) ? defaultSkillId : "general";
  const suggestions = suggestionsFor(suggestionSeed, lang).slice(0, 4);
  const t = (k: string, v?: Record<string, string>) => translate(lang, k, v);

  /* hero composer */
  const [text, setText] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const send = (value = text) => {
    const q = value.trim();
    if (!q) return;
    startChat(suggestionSeed === "general" ? "general" : suggestionSeed, q);
  };
  const grow = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(140, el.scrollHeight) + "px";
  };

  return (
    <MotionPage>
      <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-5 sm:px-6">
        {/* header */}
        <header className="flex items-center justify-between">
          <Wordmark />
          <div className="flex items-center gap-1.5">
            <StatusPill />
            <LanguageMenu />
          </div>
        </header>

        {/* greeting */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 0.61, 0.21, 1] }}
          className="mt-14 sm:mt-20"
        >
          <h1 className="font-display text-[32px] font-semibold tracking-tight sm:text-[38px]">
            {t("home.greeting")}
          </h1>
          <p className="mt-2 flex items-center gap-2 text-[13.5px] text-ink-2 dark:text-night-ink2">
            <StatusDot tone={live ? "ok" : "warn"} />
            {live ? t("home.reassure") : t("app.demo.note")}
          </p>
        </motion.section>

        {/* hero composer */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35, ease: [0.22, 0.61, 0.21, 1] }}
          className="mt-7 rounded-[26px] border border-line bg-surface p-2 pl-2 shadow-[var(--shadow-card)] transition-shadow focus-within:ring-4 focus-within:ring-brand-500/10 focus-within:border-brand-500/40 dark:bg-night-1"
        >
          <div className="flex items-end gap-1.5">
            <Menu
              trigger={
                <Button variant="ghost" size="icon" aria-label="Add" className="shrink-0 rounded-full">
                  <Plus className="h-5 w-5" />
                </Button>
              }
            >
              <MenuItem icon={<FileUp />} onSelect={() => navigate("/skills?create=1")}>
                Add your knowledge
              </MenuItem>
              <MenuItem icon={<Image />} disabled>
                Photo (coming soon)
              </MenuItem>
            </Menu>
            <textarea
              ref={taRef}
              value={text}
              rows={1}
              onChange={(e) => {
                setText(e.target.value);
                grow();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={t("home.placeholder")}
              className="max-h-[140px] min-h-10 w-full resize-none bg-transparent py-2.5 text-[15.5px] outline-none placeholder:text-ink-3 dark:placeholder:text-night-ink3"
              aria-label={t("home.placeholder")}
            />
            <Tip label={t("home.talk")}>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 rounded-full"
                aria-label={t("home.talk")}
                onClick={() => navigate(`/voice?skill=${suggestionSeed}`)}
              >
                <Mic className="h-5 w-5" />
              </Button>
            </Tip>
            <motion.span
              animate={{ opacity: text.trim() ? 1 : 0.55, scale: text.trim() ? 1 : 0.96 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                variant="primary"
                size="icon"
                className="shrink-0 rounded-full"
                aria-label={t("chat.send")}
                disabled={!text.trim()}
                onClick={() => send()}
              >
                <ArrowUp className="h-5 w-5" />
              </Button>
            </motion.span>
          </div>
        </motion.div>

        {/* suggestions */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={listVariants}
          className="mt-4 flex flex-wrap gap-2"
        >
          {suggestions.map((s) => (
            <motion.button
              key={s}
              variants={itemVariants}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => send(s)}
              className="rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] text-ink-2 transition-colors hover:border-brand-500/40 hover:text-ink dark:bg-night-1 dark:text-night-ink2 dark:hover:text-night-ink"
            >
              {s}
            </motion.button>
          ))}
        </motion.div>

        {/* your skills */}
        <section className="mt-14">
          <SectionTitle
            title={t("home.yourSkills")}
            action={
              <button
                onClick={() => navigate("/skills")}
                className="flex items-center gap-1 text-[13px] font-medium text-brand-700 transition-colors hover:text-brand-600 dark:text-brand-300"
              >
                {t("home.viewAll")} <ArrowRight className="h-3.5 w-3.5" />
              </button>
            }
          />
          {skills.length === 0 ? (
            <Card>
              <EmptyState
                icon={Sparkles}
                title={t("skills.empty.title")}
                body={t("skills.empty.body")}
                action={
                  <Button variant="accent" onClick={() => navigate("/skills")}>
                    {t("skills.mySkills")}
                  </Button>
                }
              />
            </Card>
          ) : (
            <motion.div
              initial="hidden"
              animate="show"
              variants={listVariants}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            >
              {skills.map((s) => (
                <motion.div key={s.id} variants={itemVariants}>
                  <PressableCard
                    role="button"
                    tabIndex={0}
                    onClick={() => startChat(s.id)}
                    onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && startChat(s.id)}
                    className="group flex h-full cursor-pointer flex-col gap-3 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <SkillIcon icon={s.icon} tint={s.tint} size="lg" className="transition-transform duration-200 group-hover:scale-105" />
                      <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-ink-3 dark:text-night-ink3">
                        <StatusDot tone="ok" /> {t("skills.offline")}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-display text-[15.5px] font-semibold">{s.name}</h3>
                      <p className="mt-1 text-[13px] leading-snug text-ink-2 dark:text-night-ink2 line-clamp-2">
                        {skillDesc(s, lang)}
                      </p>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1">
                        {s.langs.slice(0, 3).map((l) => (
                          <Badge key={l}>{({ en: "English", hi: "हिन्दी", mr: "मराठी" } as any)[l]}</Badge>
                        ))}
                      </div>
                      <span className="shrink-0 text-[11.5px] text-ink-3 dark:text-night-ink3">
                        {lastUsed[s.id]
                          ? `${t("skills.lastUsed")} ${timeLabel(lastUsed[s.id])}`
                          : t("skills.never")}
                      </span>
                    </div>
                  </PressableCard>
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>

        {/* quiet reassurance row */}
        <section className="mt-14 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { icon: WifiOff, title: t("onboard.s2.title"), body: t("onboard.s2.body") },
            { icon: Languages, title: t("settings.language"), body: "English · हिन्दी · मराठी" },
            { icon: ShieldCheck, title: t("settings.privacy"), body: "", link: "/settings/privacy" },
          ].map(({ icon: Icon, title, body, link }, i) => (
            <Card
              key={i}
              className={cn("flex items-start gap-3 p-4", link && "cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.03]")}
              onClick={link ? () => navigate(link) : undefined}
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-500/10 text-brand-600">
                <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
              </div>
              <div>
                <p className="text-[13.5px] font-semibold">{title}</p>
                <p className="mt-0.5 text-[12px] leading-snug text-ink-3 dark:text-night-ink3">
                  {body || (lang === "en" ? "Your conversations stay on this device." : translate(lang, "settings.localAccount.note"))}
                </p>
              </div>
            </Card>
          ))}
        </section>

        {/* explore skills */}
        <section className="mt-10">
          <PressableCard
            role="button"
            tabIndex={0}
            onClick={() => navigate("/skills")}
            className="flex cursor-pointer items-center gap-4 p-5"
          >
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/10 text-brand-600">
              <Disc3 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[15px] font-semibold">Skill Library</p>
              <p className="text-[13px] text-ink-2 dark:text-night-ink2">
                Browse and insert a Skill disc into your AI.
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-ink-3" />
          </PressableCard>
        </section>
      </div>
    </MotionPage>
  );
}
