import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, WifiOff, Languages, Sparkles, Box } from "lucide-react";
import { useApp } from "../store/app";
import { LANGS, translate, type Lang } from "../lib/i18n";
import { SKILL_CATALOG, skillDesc } from "../lib/data";
import { LogoMark, SkillIcon, StatusDot } from "../components/core";
import { Button } from "../components/ui";
import { cn } from "../lib/utils";

const slide = {
  enter: (dir: number) => ({ x: dir * 48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -48, opacity: 0 }),
};

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [lang, setLang] = useState<Lang>("en");
  const [picked, setPicked] = useState<string[]>(["agriculture"]);
  const completeOnboarding = useApp((s) => s.completeOnboarding);

  const t = (k: string) => translate(lang, k);
  const total = 5;

  const go = (d: number) => {
    setDir(d);
    setStep((s) => Math.min(total - 1, Math.max(0, s + d)));
  };
  const finish = () => completeOnboarding(lang, picked);

  const toggleSkill = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <div className="relative flex min-h-dvh flex-col bg-paper dark:bg-night">
      {/* top bar */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2.5">
          <LogoMark className="h-7 w-7" />
          <span className="font-display text-[15px] font-semibold">SkillBox AI</span>
        </div>
        {step < total - 1 && (
          <button
            onClick={finish}
            className="rounded-full px-3 py-1.5 text-[13px] font-medium text-ink-3 transition-colors hover:text-ink dark:text-night-ink3 dark:hover:text-night-ink"
          >
            {t("onboard.skip")}
          </button>
        )}
      </div>

      {/* content */}
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-8">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: [0.22, 0.61, 0.21, 1] }}
          >
            {step === 0 && (
              <StepShell>
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.08, type: "spring", stiffness: 260, damping: 20 }}
                >
                  <LogoMark className="h-20 w-20" />
                </motion.div>
                <Title text={t("onboard.s1.title")} />
                <Body text={t("onboard.s1.body")} />
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3.5 py-1.5 text-[13px] font-medium text-brand-700 dark:text-brand-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t("app.tagline")}
                </div>
              </StepShell>
            )}

            {step === 1 && (
              <StepShell>
                <div className="card flex w-full max-w-xs flex-col gap-3 p-5">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-stone-500/10 text-stone-500 dark:text-stone-400">
                      <WifiOff className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        {t("app.offline")} <StatusDot tone="ok" />
                      </div>
                      <div className="text-[12.5px] text-ink-2 dark:text-night-ink2">
                        {t("app.offline.note")}
                      </div>
                    </div>
                  </div>
                  <div className="h-px w-full bg-line" />
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11.5px] font-medium text-emerald-700 dark:text-emerald-400">🌱 Agriculture</span>
                    <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-[11.5px] font-medium text-violet-700 dark:text-violet-400">🧠 AI Researcher</span>
                    <span className="rounded-full bg-sky-500/10 px-2.5 py-1 text-[11.5px] font-medium text-sky-700 dark:text-sky-400">💻 Programming</span>
                  </div>
                </div>
                <Title text={t("onboard.s2.title")} />
                <Body text={t("onboard.s2.body")} />
              </StepShell>
            )}

            {step === 2 && (
              <StepShell>
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/10 text-brand-600">
                  <Languages className="h-7 w-7" />
                </div>
                <Title text={t("onboard.s3.title")} />
                <Body text={t("onboard.s3.body")} />
                <div className="mt-4 flex w-full flex-col gap-2" role="radiogroup" aria-label="Language">
                  {LANGS.map((l) => {
                    const active = lang === l.code;
                    return (
                      <motion.button
                        key={l.code}
                        role="radio"
                        aria-checked={active}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => setLang(l.code)}
                        className={cn(
                          "flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-colors",
                          active
                            ? "border-brand-500/50 bg-brand-500/[0.07]"
                            : "border-line bg-surface hover:bg-black/[0.02] dark:bg-night-1 dark:hover:bg-white/[0.03]",
                        )}
                      >
                        <span>
                          <span className="block text-[15px] font-medium">{l.native}</span>
                          <span className="text-[12px] text-ink-3 dark:text-night-ink3">{l.name}</span>
                        </span>
                        <AnimatePresence>
                          {active && (
                            <motion.span
                              initial={{ scale: 0.4, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.4, opacity: 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 24 }}
                              className="grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-white"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    );
                  })}
                </div>
              </StepShell>
            )}

            {step === 3 && (
              <StepShell>
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/10 text-brand-600">
                  <Box className="h-7 w-7" />
                </div>
                <Title text={t("onboard.s4.title")} />
                <Body text={t("onboard.s4.body")} />
                <div className="mt-4 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
                  {SKILL_CATALOG.filter((s) => s.demoIncluded).map((s) => {
                    const active = picked.includes(s.id);
                    return (
                      <motion.button
                        key={s.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleSkill(s.id)}
                        aria-pressed={active}
                        className={cn(
                          "relative flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors",
                          active
                            ? "border-brand-500/50 bg-brand-500/[0.06]"
                            : "border-line bg-surface dark:bg-night-1",
                        )}
                      >
                        <SkillIcon icon={s.icon} tint={s.tint} />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">{s.name}</span>
                          <span className="mt-0.5 block text-[12px] leading-snug text-ink-2 dark:text-night-ink2 line-clamp-2">
                            {skillDesc(s, lang)}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full border transition-colors",
                            active ? "border-brand-600 bg-brand-600 text-white" : "border-line text-transparent",
                          )}
                        >
                          <Check className="h-3 w-3" />
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </StepShell>
            )}

            {step === 4 && (
              <StepShell>
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="grid h-20 w-20 place-items-center rounded-full bg-brand-600 text-white"
                >
                  <Check className="h-9 w-9" strokeWidth={2.4} />
                </motion.div>
                <Title text={t("onboard.s5.title")} />
                <Body text={t("onboard.s5.body")} />
              </StepShell>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* footer */}
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-6 pb-8">
        <div className="flex items-center gap-1.5" aria-hidden>
          {Array.from({ length: total }).map((_, i) => (
            <motion.span
              key={i}
              animate={{ width: i === step ? 22 : 6, opacity: i <= step ? 1 : 0.35 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="h-1.5 rounded-full bg-brand-600"
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {step > 0 && step < total && (
            <Button variant="ghost" size="md" onClick={() => go(-1)}>
              <ChevronLeft className="h-4 w-4" /> {t("onboard.back")}
            </Button>
          )}
          {step < total - 1 ? (
            <Button
              variant="primary"
              size="lg"
              onClick={() => go(1)}
              disabled={step === 2 && !lang}
            >
              {t("onboard.next")}
            </Button>
          ) : (
            <Button variant="accent" size="lg" onClick={finish}>
              {t("onboard.start")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepShell({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col items-center gap-4 text-center">{children}</div>;
}

function Title({ text }: { text: string }) {
  return (
    <motion.h1
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.3 }}
      className="font-display text-[28px] font-semibold tracking-tight text-balance"
    >
      {text}
    </motion.h1>
  );
}
function Body({ text }: { text: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.16, duration: 0.3 }}
      className="max-w-sm text-[15px] leading-relaxed text-ink-2 dark:text-night-ink2 text-balance"
    >
      {text}
    </motion.p>
  );
}
