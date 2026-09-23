import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "../lib/utils";

/** Shared motion language: fast, subtle, purposeful. */
export const EASE = [0.22, 0.61, 0.21, 1] as const;
export const SPRING = { type: "spring", stiffness: 420, damping: 34 } as const;

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.16, ease: EASE } },
};

export function MotionPage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      className={cn("min-h-full", className)}
    >
      {children}
    </motion.div>
  );
}

export const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
};

/** fade+rise for incoming chat messages */
export const msgVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: EASE } },
};

export function Crossfade({
  k,
  children,
  className,
}: {
  k: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      key={k}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
