import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, UploadCloud, NotebookPen, Wand2,
} from "lucide-react";
import { Modal } from "./overlay";
import { Button, Input, Badge } from "./ui";
import { useApp } from "../store/app";
import { toast } from "./toast";
import { translate } from "../lib/i18n";
import { uid, formatBytes } from "../lib/utils";
import { LANGS } from "../lib/i18n";

interface PickedFile {
  name: string;
  sizeMB: number;
}

/**
 * "Create a Skill" — honest consumer flow.
 * The UI walks through the real SkillBox pipeline steps, clearly marks which
 * ones are functional today and which are prototype/coming-soon, and saves a
 * local Skill *draft* instead of simulating a fake training run.
 */
export function CreateSkillDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const lang = useApp((s) => s.lang);
  const addCustomSkill = useApp((s) => s.addCustomSkill);
  const t = (k: string) => translate(lang, k);

  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState("");
  const [name, setName] = useState("");
  const [files, setFiles] = useState<PickedFile[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const totalSize = files.reduce((a, f) => a + f.sizeMB, 0);

  const reset = () => {
    setStep(0);
    setGoal("");
    setName("");
    setFiles([]);
  };

  const create = () => {
    addCustomSkill({
      id: `custom-${uid()}`,
      name: name.trim() || "My Skill",
      desc: goal.trim() || "Personal knowledge skill",
      langs: [lang],
      sizeMB: Math.max(1, Math.round(totalSize)),
      version: "0.1.0",
      updatedAt: new Date().toLocaleDateString(undefined, { month: "short", year: "numeric" }),
      prototype: true,
      knowledge: files.map((f) => f.name),
    });
    toast(translate(lang, "toast.draftCreated"), "success");
    onOpenChange(false);
    reset();
  };

  const pipeline = [
    { label: "Understand requirement", live: true },
    { label: "Select knowledge sources", live: true },
    { label: "Extract & index documents", live: false },
    { label: "Train Skill adapter", live: false },
    { label: "Evaluate responses", live: false },
    { label: "Package .skill", live: false },
    { label: "Install on device", live: false },
  ];

  return (
    <Modal open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }} title={t("skills.create")} wide>
      {/* pipeline honesty */}
      <ol className="mb-5 grid gap-1.5 rounded-2xl border border-line bg-black/[0.02] p-4 dark:bg-white/[0.03] sm:grid-cols-2">
        {pipeline.map((p, i) => (
          <li key={p.label} className="flex items-center gap-2.5 text-[12.5px]">
            <span
              className={
                "grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold " +
                (i === 0 || i === 1 ? "bg-brand-500/15 text-brand-700 dark:text-brand-300" : "bg-black/[0.06] text-ink-3 dark:bg-white/[0.08] dark:text-night-ink3")
              }
            >
              {i + 1}
            </span>
            <span className="flex-1">{p.label}</span>
            {!p.live && (
              <Badge tone="neutral" className="px-1.5 py-0 text-[9.5px] uppercase tracking-wide">
                Prototype
              </Badge>
            )}
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="s0" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            <label className="mb-1.5 block text-[13px] font-semibold">What should your AI learn?</label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={3}
              placeholder="e.g. I want an AI that understands Maharashtra cotton farming."
              className="w-full resize-none rounded-xl border border-line bg-surface px-3.5 py-3 text-[15px] outline-none transition-shadow placeholder:text-ink-3 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/15 dark:bg-night-2 dark:placeholder:text-night-ink3"
            />
            <label className="mb-1.5 mt-4 block text-[13px] font-semibold">Skill name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My College Notes, My Research…"
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>{t("onboard.back")}</Button>
              <Button variant="primary" disabled={!goal.trim() && !name.trim()} onClick={() => setStep(1)}>
                {t("onboard.next")}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            <label className="mb-1.5 block text-[13px] font-semibold">Add your knowledge</label>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-black/[0.015] px-4 py-8 text-center transition-colors hover:border-brand-500/40 hover:bg-brand-500/[0.03] dark:bg-white/[0.02]"
            >
              <UploadCloud className="h-7 w-7 text-ink-3 dark:text-night-ink3" />
              <span className="text-[14px] font-medium">Choose documents</span>
              <span className="text-[12px] text-ink-3 dark:text-night-ink3">PDF · TXT · Markdown · EPUB</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".pdf,.txt,.md,.markdown,.epub"
              className="hidden"
              onChange={(e) => {
                const add = Array.from(e.target.files ?? []).map((f) => ({ name: f.name, sizeMB: f.size / (1024 * 1024) }));
                setFiles((prev) => [...prev, ...add]);
                e.target.value = "";
              }}
            />
            {files.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {files.map((f, i) => (
                  <motion.li
                    key={f.name + i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2.5 rounded-xl border border-line px-3 py-2.5 text-[13px]"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-ink-3" />
                    <span className="min-w-0 flex-1 truncate font-medium">{f.name}</span>
                    <span className="shrink-0 text-ink-3">{formatBytes(f.sizeMB)}</span>
                  </motion.li>
                ))}
              </ul>
            )}
            <div className="mt-5 flex justify-between gap-2">
              <Button variant="ghost" onClick={() => setStep(0)}>{t("onboard.back")}</Button>
              <Button variant="primary" onClick={() => setStep(2)}>
                {t("onboard.next")}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-start gap-3 rounded-2xl border border-line p-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-stone-500/10 text-stone-600 dark:text-stone-300">
                <NotebookPen className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-[15px] font-semibold">{name.trim() || "My Skill"}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-ink-2 dark:text-night-ink2">
                  {goal.trim() || "Personal knowledge skill"}
                </p>
                <p className="mt-1.5 text-[12px] text-ink-3 dark:text-night-ink3">
                  {files.length} document{files.length === 1 ? "" : "s"} · {formatBytes(Math.max(1, totalSize))} ·{" "}
                  {LANGS.find((l) => l.code === lang)?.native}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-4 text-[13px] leading-relaxed text-amber-800 dark:text-amber-300">
              This prototype can save your Skill as a <b>draft</b>. Extracting, indexing, training
              and packaging run on the SkillBox backend — those steps are marked above and become
              active once the backend is connected. Nothing about a successful training run is
              simulated here.
            </div>

            <div className="mt-5 flex justify-between gap-2">
              <Button variant="ghost" onClick={() => setStep(1)}>{t("onboard.back")}</Button>
              <Button variant="accent" onClick={create}>
                <Wand2 className="h-4 w-4" /> Create draft skill
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
