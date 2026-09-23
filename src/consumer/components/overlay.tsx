import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Switch from "@radix-ui/react-switch";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import * as Slider from "@radix-ui/react-slider";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../lib/utils";

/* ---------------------------------- Tooltip ---------------------------------- */
export function Tip({
  label,
  children,
  side = "top",
}: {
  label: string;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <Tooltip.Provider delayDuration={350}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side={side}
            sideOffset={6}
            className="z-[90] rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-paper shadow-lg dark:bg-night-ink dark:text-night animate-in"
          >
            {label}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

/* ---------------------------------- Switch ---------------------------------- */
export function Toggle({
  checked,
  onCheckedChange,
  label,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <Switch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 outline-none disabled:opacity-40",
        checked ? "bg-brand-600" : "bg-black/[0.14] dark:bg-white/[0.16]",
      )}
    >
      <Switch.Thumb asChild>
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          className={cn(
            "block h-[22px] w-[22px] rounded-full bg-white shadow",
            checked ? "translate-x-[22px]" : "translate-x-[3px]",
          )}
        />
      </Switch.Thumb>
    </Switch.Root>
  );
}

/* ---------------------------------- Modal ---------------------------------- */
export function Modal({
  open,
  onOpenChange,
  title,
  children,
  wide,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <AnimatePresence>
          {open && (
            <>
              <Dialog.Overlay asChild forceMount>
                <motion.div
                  className="fixed inset-0 z-[60] bg-black/40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              </Dialog.Overlay>
              <Dialog.Content
                forceMount
                onOpenAutoFocus={(e: Event) => e.preventDefault()}
                className="fixed inset-0 z-[61] flex items-end justify-center sm:items-center sm:p-6 pointer-events-none outline-none"
              >
                <motion.div
                  className={cn(
                    "pointer-events-auto w-full rounded-t-3xl sm:rounded-3xl bg-surface p-6 shadow-[var(--shadow-pop)] dark:bg-night-1 border border-line overflow-y-auto max-h-[92dvh]",
                    wide ? "sm:max-w-2xl" : "sm:max-w-md",
                  )}
                  initial={{ y: 80, opacity: 0, scale: 0.99 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 60, opacity: 0, scale: 0.99 }}
                  transition={{ type: "spring", stiffness: 320, damping: 32 }}
                >
                  {title && (
                    <div className="mb-4 flex items-center justify-between">
                      <Dialog.Title className="font-display text-lg font-semibold">
                        {title}
                      </Dialog.Title>
                      <Dialog.Close className="rounded-full p-2 text-ink-3 hover:bg-black/5 dark:hover:bg-white/10" aria-label="Close">
                        <X className="h-[18px] w-[18px]" />
                      </Dialog.Close>
                    </div>
                  )}
                  {children}
                </motion.div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ------------------------------ Dropdown menu ------------------------------ */
export function Menu({
  trigger,
  children,
  align = "end",
  side = "bottom",
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end" | "center";
  side?: "bottom" | "top" | "left" | "right";
}) {
  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>{trigger}</Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          align={align}
          side={side}
          sideOffset={6}
          className="z-[70] min-w-44 max-w-[calc(100vw-32px)] rounded-2xl border border-line bg-surface p-1.5 shadow-[var(--shadow-pop)] dark:bg-night-1 data-[state=open]:animate-in"
        >
          {children}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}

export function MenuItem({
  icon,
  children,
  onSelect,
  danger,
  disabled,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  onSelect?: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <Dropdown.Item
      onSelect={onSelect}
      disabled={disabled}
      className={cn(
        "flex cursor-pointer select-none items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm outline-none",
        danger
          ? "text-red-600 data-[highlighted]:bg-red-500/10 dark:text-red-400"
          : "text-ink data-[highlighted]:bg-black/[0.05] dark:text-night-ink dark:data-[highlighted]:bg-white/[0.07]",
        disabled && "opacity-40 pointer-events-none",
      )}
    >
      {icon && <span className="[&>svg]:h-4 [&>svg]:w-4 text-ink-3 dark:text-night-ink3">{icon}</span>}
      {children}
    </Dropdown.Item>
  );
}

/* ---------------------------------- Slider ---------------------------------- */
export function RangeSlider({
  value,
  onChange,
  min = 0.6,
  max = 1.4,
  step = 0.1,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}) {
  return (
    <Slider.Root
      aria-label={label}
      className="relative flex h-7 w-full touch-none select-none items-center"
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={([v]) => onChange(v)}
    >
      <Slider.Track className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.1] dark:bg-white/[0.12]">
        <Slider.Range className="absolute h-full bg-brand-600" />
      </Slider.Track>
      <Slider.Thumb className="block h-5 w-5 rounded-full border border-line bg-white shadow-md outline-none transition-transform focus:scale-110" />
    </Slider.Root>
  );
}
