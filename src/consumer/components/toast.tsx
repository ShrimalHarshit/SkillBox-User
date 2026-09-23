import { useEffect } from "react";
import { create } from "zustand";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Info, WifiOff, X } from "lucide-react";
import { uid, cn } from "../lib/utils";

export interface ToastItem {
  id: string;
  title: string;
  tone?: "default" | "success" | "offline";
}

interface ToastStore {
  toasts: ToastItem[];
  push: (t: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
}

export const useToasts = create<ToastStore>((set) => ({
  toasts: [],
  push: (t) => set((s) => ({ toasts: [...s.toasts.slice(-2), { ...t, id: uid() }] })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export const toast = (title: string, tone: ToastItem["tone"] = "default") =>
  useToasts.getState().push({ title, tone });

const icons = {
  default: <Info className="h-4 w-4 text-ink-3 dark:text-night-ink3" />,
  success: <CheckCircle2 className="h-4 w-4 text-brand-600" />,
  offline: <WifiOff className="h-4 w-4 text-amber-600" />,
};

export function Toaster() {
  const { toasts, dismiss } = useToasts();
  useEffect(() => {
    if (!toasts.length) return;
    const t = setTimeout(() => dismiss(toasts[0].id), 3400);
    return () => clearTimeout(t);
  }, [toasts, dismiss]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 md:bottom-6 z-[80] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={cn(
              "pointer-events-auto flex items-center gap-2.5 rounded-full border border-line bg-surface py-2.5 pl-3.5 pr-2 shadow-[var(--shadow-pop)] dark:bg-night-2",
            )}
            role="status"
          >
            {icons[t.tone ?? "default"]}
            <span className="text-[13.5px] font-medium">{t.title}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="rounded-full p-1.5 text-ink-3 hover:bg-black/5 dark:hover:bg-white/10"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
