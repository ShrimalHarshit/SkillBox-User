import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";

/* ---------------------------------- Logo ---------------------------------- */
export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative grid place-items-center rounded-[10px] bg-brand-600 text-white shrink-0",
        className ?? "h-8 w-8",
      )}
      aria-hidden
    >
      {/* two-box glyph: base model + skill */}
      <div className="absolute left-[18%] top-[18%] h-[46%] w-[46%] rounded-[5px] bg-white/95" />
      <div className="absolute bottom-[18%] right-[18%] h-[38%] w-[38%] rounded-[4px] bg-white/55" />
    </div>
  );
}

export function Wordmark({ sub = false, className }: { sub?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <div className="leading-none">
        <span className="font-display text-[17px] font-semibold tracking-tight">
          SkillBox<span className="text-brand-600"> AI</span>
        </span>
        {sub && (
          <div className="mt-1 text-[11px] font-medium text-ink-3 dark:text-night-ink3">
            One base model. Many skills.
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------- Skill icon ------------------------------- */
export function SkillIcon({
  icon: Icon,
  tint,
  size = "md",
  className,
}: {
  icon: LucideIcon;
  tint: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes = {
    sm: "h-8 w-8 rounded-[10px] [&>svg]:h-4 [&>svg]:w-4",
    md: "h-10 w-10 rounded-xl [&>svg]:h-5 [&>svg]:w-5",
    lg: "h-12 w-12 rounded-[14px] [&>svg]:h-6 [&>svg]:w-6",
    xl: "h-16 w-16 rounded-2xl [&>svg]:h-8 [&>svg]:w-8",
  };
  return (
    <div className={cn("grid place-items-center shrink-0", sizes[size], tint, className)}>
      <Icon strokeWidth={1.8} />
    </div>
  );
}

/* -------------------------------- Status dot ------------------------------- */
/** Slow breathing status dot — reassuring, never alarming. */
export function StatusDot({
  tone = "ok",
  className,
}: {
  tone?: "ok" | "warn" | "idle";
  className?: string;
}) {
  const tones = {
    ok: "bg-brand-500",
    warn: "bg-amber-500",
    idle: "bg-stone-400",
  };
  return <span className={cn("inline-block h-2 w-2 rounded-full animate-breathe", tones[tone], className)} />;
}

/* -------------------------------- Empty state ------------------------------ */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex flex-col items-center justify-center gap-3 px-6 py-16 text-center", className)}
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="grid h-16 w-16 place-items-center rounded-3xl border border-dashed border-line text-ink-3 dark:text-night-ink3"
      >
        <Icon className="h-7 w-7" strokeWidth={1.5} />
      </motion.div>
      <div>
        <p className="font-display text-[17px] font-semibold">{title}</p>
        {body && <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-2 dark:text-night-ink2">{body}</p>}
      </div>
      {action}
    </motion.div>
  );
}

/* ------------------------------ Section header ----------------------------- */
export function SectionTitle({
  title,
  action,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-end justify-between gap-3 px-1", className)}>
      <h2 className="font-display text-[15px] font-semibold tracking-tight text-ink dark:text-night-ink">
        {title}
      </h2>
      {action}
    </div>
  );
}
