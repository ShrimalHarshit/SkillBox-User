import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronDown, Cpu, RefreshCw, ShieldCheck } from "lucide-react";
import { useRuntime } from "../store/app";
import { reprobe, detectLive } from "../api/client";
import { Button, Card, Badge, Sep } from "../components/ui";
import { MotionPage } from "../components/motion";
import { StatusDot } from "../components/core";
import { cn } from "../lib/utils";
import { toast } from "../components/toast";

export default function ModelStatus() {
  const navigate = useNavigate();
  const backend = useRuntime((s) => s.backend);
  const setBackend = useRuntime((s) => s.setBackend);
  const live = useRuntime((s) => s.live);
  const setLive = useRuntime((s) => s.setLive);
  const [openTech, setOpenTech] = useState(false);
  const [probing, setProbing] = useState(false);

  const techRows: [string, string][] = backend
    ? [
        ["Model", backend.model?.name ?? "—"],
        ["Runtime", backend.model?.runtime ?? "—"],
        ["Quantization", backend.model?.quantization ?? "—"],
        ["Memory usage", backend.model?.memory ?? "—"],
        ["Context size", backend.model?.context ?? "—"],
        ["Hardware acceleration", backend.model?.acceleration ?? "—"],
      ]
    : [];

  return (
    <MotionPage>
      <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-5 sm:px-6">
        <Button variant="ghost" size="icon" aria-label="Back" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <header className="mt-6 flex items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-500/10 text-brand-600">
            <Cpu className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-display text-[24px] font-semibold tracking-tight">AI Model</h1>
            <p className="mt-1 text-[14px] text-ink-2 dark:text-night-ink2">
              Local AI · this device
            </p>
          </div>
        </header>

        <Card className="mt-6 divide-y divide-black/[0.06] dark:divide-white/[0.07]">
          {[
            { k: "Status", v: "Ready", dot: true },
            { k: "Running on", v: "This device" },
            { k: "Mode", v: live ? "Local inference" : "Demo Mode (built-in samples)", badge: !live },
          ].map((row) => (
            <div key={row.k} className="flex items-center justify-between px-4 py-3.5">
              <span className="text-[14px] font-medium text-ink-2 dark:text-night-ink2">{row.k}</span>
              <span className="flex items-center gap-2 text-[14px] font-semibold">
                {row.dot && <StatusDot tone="ok" />}
                {row.badge ? (
                  <Badge tone="amber">
                    {row.v}
                  </Badge>
                ) : (
                  row.v
                )}
              </span>
            </div>
          ))}
          <div className="flex items-start gap-3 px-4 py-3.5">
            <ShieldCheck className="mt-0.5 h-4.5 w-4.5 h-[18px] w-[18px] shrink-0 text-brand-600" />
            <p className="text-[13.5px] leading-relaxed text-ink-2 dark:text-night-ink2">
              Your conversations stay on this device.
            </p>
          </div>
        </Card>

        {/* technical details */}
        <button
          onClick={() => setOpenTech((v) => !v)}
          className="mt-5 flex w-full items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3.5 text-left transition-colors hover:bg-black/[0.02] dark:bg-night-1 dark:hover:bg-white/[0.03]"
          aria-expanded={openTech}
        >
          <span className="text-[14px] font-semibold">Technical details</span>
          <ChevronDown className={cn("h-4 w-4 text-ink-3 transition-transform", openTech && "rotate-180")} />
        </button>
        <AnimatePresence>
          {openTech && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.24 }}
              className="overflow-hidden"
            >
              <Card className="mt-2 p-4">
                {backend ? (
                  <div className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
                    {techRows.map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between py-2.5 text-[13.5px]">
                        <span className="text-ink-2 dark:text-night-ink2">{k}</span>
                        <span className="font-mono text-[12.5px]">{v}</span>
                      </div>
                    ))}
                  </div>
                ) : live ? (
                  <div className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
                    {[
                      ["Model", "SkillBox Base"],
                      ["Runtime", "On-device"],
                      ["Status", "Ready"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between py-2.5 text-[13.5px]">
                        <span className="text-ink-2 dark:text-night-ink2">{k}</span>
                        <span className="font-mono text-[12.5px]">{v}</span>
                      </div>
                    ))}
                    <p className="pt-3 text-[12px] leading-relaxed text-ink-3 dark:text-night-ink3">
                      Low-level fields (quantization, memory, acceleration) appear here when the
                      local runtime reports them.
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-[13.5px] leading-relaxed text-ink-2 dark:text-night-ink2">
                      Connect the local runtime to see real model details (quantization, memory,
                      context…). We never fabricate hardware information.
                    </p>
                    <Button
                      variant="outline"
                      size="md"
                      className="mt-3"
                      disabled={probing}
                      onClick={async () => {
                        setProbing(true);
                        const kind = await detectLive();
                        setLive(kind !== null);
                        setBackend(await reprobe());
                        setProbing(false);
                        toast(kind ? "Runtime found" : "Still in Demo Mode", kind ? "success" : "default");
                      }}
                    >
                      <RefreshCw className={cn("h-4 w-4", probing && "animate-spin")} />
                      Check again
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <Sep className="my-8" />
        <p className="text-center text-[12px] text-ink-3 dark:text-night-ink3">
          One base model. Many skills.
        </p>
      </div>
    </MotionPage>
  );
}
