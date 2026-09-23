import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Check, Download, Trash2, Share2, Package, FlaskConical, CircleAlert,
} from "lucide-react";
import { useApp } from "../store/app";
import { getSkill, skillDetail } from "../lib/data";
import { translate, type Lang } from "../lib/i18n";
import { formatBytes } from "../lib/utils";
import { useStartChat } from "../lib/startChat";
import { SkillIcon, StatusDot, EmptyState, SectionTitle } from "../components/core";
import { Button, Card, Badge, Sep } from "../components/ui";
import { Modal } from "../components/overlay";
import { MotionPage, listVariants, itemVariants } from "../components/motion";
import { toast } from "../components/toast";
import { Shapes } from "lucide-react";

function exportSkillPackage(id: string) {
  const skill = getSkill(id);
  if (!skill) return;
  const manifest = {
    format: "skill",
    id: skill.id,
    name: skill.name,
    version: skill.version,
    description: skill.desc.en,
    languages: skill.langs,
    sizeMB: skill.sizeMB,
    updatedAt: skill.updatedAt,
    baseModel: "SkillBox Base >= 1.0",
    knowledge: skill.knowledge,
    sources: skill.sources ?? [],
    prototype: !(skill.demoIncluded),
  };
  const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${skill.id}.skill`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SkillDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const lang = useApp((s) => s.lang);
  const installed = useApp((s) => s.installedSkills);
  const installSkill = useApp((s) => s.installSkill);
  const removeSkill = useApp((s) => s.removeSkill);
  const startChat = useStartChat();
  const t = (k: string) => translate(lang, k);

  const [installing, setInstalling] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  const skill = id ? getSkill(id) : undefined;

  if (!skill) {
    return (
      <div className="grid min-h-[60dvh] place-items-center p-6">
        <EmptyState
          icon={Shapes}
          title="Skill not found"
          body="This Skill isn't installed on this device."
          action={<Button variant="primary" onClick={() => navigate("/skills")}>{t("skills.title")}</Button>}
        />
      </div>
    );
  }

  const isInstalled = installed.includes(skill.id);
  const isCustom = !skill.demoIncluded;
  const isPrototype = isCustom;

  const install = () => {
    setInstalling(true);
    setTimeout(() => {
      installSkill(skill.id);
      setInstalling(false);
      setJustInstalled(true);
      toast(t("toast.skillInstalled"), "success");
      setTimeout(() => setJustInstalled(false), 2200);
    }, 1500);
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${skill.name} — SkillBox Skill`, text: `${skill.name} — ${skill.desc.en ?? ""}` });
        return;
      } catch { /* user cancelled */ }
    }
    exportSkillPackage(skill.id);
  };

  const metaRows: [string, string][] = [
    [t("skills.version"), skill.version],
    [t("skills.size"), formatBytes(skill.sizeMB)],
    [t("skills.updated"), skill.updatedAt],
    [t("skills.package"), `.skill`],
  ];

  return (
    <MotionPage>
      <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-5 sm:px-6">
        {/* top bar */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" aria-label={t("onboard.back")} onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Share" onClick={share}>
            <Share2 className="h-4.5 w-4.5 h-[18px] w-[18px]" />
          </Button>
        </div>

        {/* hero */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex flex-col items-start gap-4">
          <motion.div
            layoutId={`skill-icon-${skill.id}`}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
          >
            <SkillIcon icon={skill.icon} tint={skill.tint} size="xl" />
          </motion.div>
          <div>
            <h1 className="font-display text-[26px] font-semibold tracking-tight">{skill.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-1.5 rounded-full bg-brand-500/10 px-2.5 py-1 text-[12px] font-medium text-brand-700 dark:text-brand-300">
                <StatusDot tone="ok" /> {t("skills.offline")}
              </span>
              {isPrototype && (
                <Badge tone="amber">
                  <FlaskConical className="h-3 w-3" /> Prototype
                </Badge>
              )}
              {skill.langs.map((l) => (
                <Badge key={l}>{({ en: "English", hi: "हिन्दी", mr: "मराठी" } as Record<Lang, string>)[l]}</Badge>
              ))}
            </div>
          </div>
          <p className="max-w-xl text-[15px] leading-relaxed text-ink-2 dark:text-night-ink2">
            {skillDetail(skill, lang)}
          </p>

          {/* actions */}
          <div className="flex flex-wrap items-center gap-2">
            {isInstalled ? (
              <>
                <Button variant="accent" size="lg" onClick={() => startChat(skill.id)}>
                  {t("skills.use")}
                </Button>
                <Button variant="outline" size="lg" onClick={() => { exportSkillPackage(skill.id); toast(t("toast.exported"), "success"); }}>
                  <Download className="h-4 w-4" /> {t("skills.export")}
                </Button>
                <Button variant="ghost" size="lg" onClick={() => setConfirmRemove(true)}>
                  <Trash2 className="h-4 w-4" /> {t("skills.remove")}
                </Button>
              </>
            ) : (
              <Button variant={installing ? "secondary" : "accent"} size="lg" disabled={installing} onClick={install}>
                {installing ? (
                  <span className="flex items-center gap-2">
                    <motion.span
                      className="h-3.5 w-3.5 rounded-full border-2 border-ink-3 border-t-transparent dark:border-night-ink3 dark:border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    />
                    Installing…
                  </span>
                ) : justInstalled ? (
                  <Check className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                ) : (
                  <>
                    <Download className="h-4 w-4" /> {t("skills.install")}
                  </>
                )}
              </Button>
            )}
          </div>
          {justInstalled && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1.5 text-[13px] font-medium text-brand-700 dark:text-brand-300"
            >
              <Check className="h-4 w-4" /> {t("skills.offline")} — {t("app.localReady")}
            </motion.p>
          )}
        </motion.div>

        {/* meta grid */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={listVariants}
          className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {metaRows.map(([k, v]) => (
            <motion.div key={k} variants={itemVariants}>
              <Card className="p-3.5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-ink-3 dark:text-night-ink3">{k}</p>
                <p className="mt-1 flex items-center gap-1.5 text-[14px] font-semibold">
                  {k === t("skills.package") && <Package className="h-3.5 w-3.5 text-ink-3" />}
                  {v}
                </p>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* capabilities */}
        <motion.section initial="hidden" animate="show" variants={listVariants} className="mt-9">
          <SectionTitle title={t("skills.capabilities")} />
          <Card className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
            {skill.capabilities.map((c) => (
              <motion.div key={c} variants={itemVariants} className="flex items-center gap-3 px-4 py-3">
                <span className="grid h-5.5 w-5.5 h-[22px] w-[22px] shrink-0 place-items-center rounded-full bg-brand-500/12 text-brand-700 dark:text-brand-300">
                  <Check className="h-3 w-3" strokeWidth={2.6} />
                </span>
                <span className="text-[14px]">{c}</span>
              </motion.div>
            ))}
          </Card>
        </motion.section>

        {/* knowledge + sources */}
        <section className="mt-9">
          <SectionTitle title={t("skills.knowledge")} />
          <Card className="p-4">
            <div className="flex flex-wrap gap-1.5">
              {skill.knowledge.map((k) => (
                <Badge key={k} tone="brand" className="px-2.5 py-1 text-[12px]">
                  {k}
                </Badge>
              ))}
            </div>
          </Card>

          {skill.sources && skill.sources.length > 0 && (
            <>
              <SectionTitle title={t("skills.sources")} className="mt-6" />
              <Card className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
                {skill.sources.map((s) => (
                  <div key={s.name} className="flex items-center justify-between px-4 py-3">
                    <span className="text-[14px] font-medium">{s.name}</span>
                    <span className="text-[12.5px] text-ink-3 dark:text-night-ink3">{s.kind}</span>
                  </div>
                ))}
              </Card>
            </>
          )}
        </section>

        {/* package / portability note */}
        <Card className="mt-9 flex items-start gap-3.5 p-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-600">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[14px] font-semibold">{t("skills.package")}</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-ink-2 dark:text-night-ink2">
              {t("skills.package.note")} — save it to a USB drive or move it to another device, and your AI travels with its knowledge.
            </p>
          </div>
        </Card>

        <Sep className="my-8" />
        <p className="text-center text-[12px] text-ink-3 dark:text-night-ink3">
          {t("app.tagline")}
        </p>
      </div>

      {/* remove confirm */}
      <Modal open={confirmRemove} onOpenChange={setConfirmRemove} title={t("skills.remove")}>
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-500/10 text-red-600">
            <CircleAlert className="h-5 w-5" />
          </div>
          <p className="text-[14px] leading-relaxed text-ink-2 dark:text-night-ink2">
            {skill.name} will be removed from this device. You can install it again anytime.
          </p>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmRemove(false)}>{t("onboard.back")}</Button>
          <Button
            variant="danger"
            onClick={() => {
              removeSkill(skill.id);
              toast(t("toast.skillRemoved"));
              setConfirmRemove(false);
              navigate("/skills");
            }}
          >
            {t("skills.remove")}
          </Button>
        </div>
      </Modal>
    </MotionPage>
  );
}
