import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { motion } from "framer-motion";
import { Check, Globe } from "lucide-react";
import { LANGS, langMeta } from "../lib/i18n";
import { useApp } from "../store/app";
import { translate } from "../lib/i18n";
import { toast } from "./toast";
import { cn } from "../lib/utils";

/**
 * First-class language selector.
 * Compact pill by default; `prominent` shows the full native name.
 */
export function LanguageMenu({
  prominent,
  onChange,
  className,
}: {
  prominent?: boolean;
  onChange?: (l: string) => void;
  className?: string;
}) {
  const lang = useApp((s) => s.lang);
  const setLang = useApp((s) => s.setLang);
  const meta = langMeta(lang);

  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-ink-2 transition-colors hover:bg-black/[0.05] hover:text-ink dark:text-night-ink2 dark:hover:bg-white/[0.08] dark:hover:text-night-ink",
            prominent ? "h-10 border border-line bg-surface px-3.5 dark:bg-night-1" : "h-9",
            className,
          )}
          aria-label="Choose language"
        >
          <Globe className="h-4 w-4" />
          <span>{prominent ? meta.native : meta.native}</span>
        </button>
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          align="end"
          sideOffset={8}
          className="z-[70] w-56 rounded-2xl border border-line bg-surface p-1.5 shadow-[var(--shadow-pop)] dark:bg-night-1"
        >
          <Dropdown.Label className="px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-3 dark:text-night-ink3">
            {translate(lang, "settings.language")}
          </Dropdown.Label>
          {LANGS.map((l) => {
            const active = l.code === lang;
            return (
              <Dropdown.Item
                key={l.code}
                onSelect={() => {
                  setLang(l.code);
                  onChange?.(l.code);
                  toast(translate(l.code, "toast.languageChanged"), "success");
                }}
                className={cn(
                  "relative flex cursor-pointer select-none items-center justify-between gap-2 rounded-xl px-3 py-2.5 pr-8 text-sm outline-none",
                  active
                    ? "bg-brand-500/10 text-brand-700 dark:text-brand-300 font-medium"
                    : "text-ink data-[highlighted]:bg-black/[0.05] dark:text-night-ink dark:data-[highlighted]:bg-white/[0.07]",
                )}
              >
                <span className="flex flex-col">
                  <span>{l.native}</span>
                  {l.code !== "en" && (
                    <span className="text-[11px] text-ink-3 dark:text-night-ink3">{l.name}</span>
                  )}
                </span>
                {active && (
                  <motion.span
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 24 }}
                    className="absolute right-3"
                  >
                    <Check className="h-4 w-4" />
                  </motion.span>
                )}
              </Dropdown.Item>
            );
          })}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
