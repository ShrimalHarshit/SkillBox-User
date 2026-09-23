import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

/* --------------------------------- Button --------------------------------- */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-colors select-none disabled:opacity-50 disabled:pointer-events-none outline-none",
  {
    variants: {
      variant: {
        primary: "bg-ink text-paper hover:bg-ink/90 dark:bg-white dark:text-black dark:hover:bg-white/90",
        accent: "bg-brand-600 text-white hover:bg-brand-600/90",
        secondary:
          "bg-black/[0.05] text-ink hover:bg-black/[0.09] dark:bg-white/[0.08] dark:text-night-ink dark:hover:bg-white/[0.12]",
        ghost:
          "text-ink-2 hover:bg-black/[0.05] hover:text-ink dark:text-night-ink2 dark:hover:bg-white/[0.07] dark:hover:text-night-ink",
        outline:
          "border border-line bg-surface text-ink hover:bg-black/[0.03] dark:bg-night-1 dark:text-night-ink dark:hover:bg-white/[0.04]",
        danger: "text-red-600 hover:bg-red-500/10 dark:text-red-400",
      },
      size: {
        sm: "h-8 px-3 text-[13px]",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-5 text-[15px]",
        icon: "h-10 w-10",
        iconSm: "h-8 w-8",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export interface ButtonProps
  extends HTMLMotionProps<"button">,
    VariantProps<typeof buttonVariants> {}

/** Tactile press feedback (scale 0.98) — the house button. */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, whileTap, whileHover, ...props }, ref) => (
    <motion.button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      whileHover={whileHover ?? { y: -0.5 }}
      whileTap={whileTap ?? { scale: 0.975 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      {...props}
    />
  ),
);
Button.displayName = "Button";

/* ---------------------------------- Card ---------------------------------- */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card", className)} {...props} />;
}

export const PressableCard = React.forwardRef<
  HTMLDivElement,
  HTMLMotionProps<"div"> & { disabled?: boolean }
>(({ className, children, ...props }, ref) => (
  <motion.div
    ref={ref}
    className={cn("card", className)}
    whileHover={{ y: -2, transition: { duration: 0.16 } }}
    whileTap={{ scale: 0.985 }}
    {...props}
  >
    {children}
  </motion.div>
));
PressableCard.displayName = "PressableCard";

/* ---------------------------------- Badge ---------------------------------- */
export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "brand" | "amber" | "violet" }) {
  const tones = {
    neutral:
      "bg-black/[0.06] text-ink-2 dark:bg-white/[0.1] dark:text-night-ink2",
    brand: "bg-brand-500/12 text-brand-700 dark:text-brand-300",
    amber: "bg-amber-500/14 text-amber-700 dark:text-amber-400",
    violet: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-4",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

/* ---------------------------------- Input ---------------------------------- */
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[15px] text-ink placeholder:text-ink-3 outline-none transition-shadow dark:bg-night-2 dark:text-night-ink dark:placeholder:text-night-ink3 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/15",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

/* -------------------------------- Separator -------------------------------- */
export function Sep({ className, vertical }: { className?: string; vertical?: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(vertical ? "w-px h-full" : "h-px w-full", "bg-line shrink-0", className)}
    />
  );
}
