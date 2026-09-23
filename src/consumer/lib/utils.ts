import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const uid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

export const hasDevanagari = (s: string) => /[\u0900-\u097F]/.test(s);

export function formatBytes(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${Math.round(mb)} MB`;
}

/** Day-bucketed relative time used by conversation history grouping. */
export type DayBucket = "today" | "yesterday" | "week" | "older";
export function dayBucket(ts: number): DayBucket {
  const d = new Date(ts);
  const now = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.floor((startOf(now) - startOf(d)) / 86400000);
  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return "week";
  return "older";
}

export function timeLabel(ts: number): string {
  const d = new Date(ts);
  const b = dayBucket(ts);
  if (b === "today")
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (b === "yesterday") return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function titleFrom(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "New chat";
  return clean.length > 44 ? clean.slice(0, 44).trimEnd() + "…" : clean;
}

export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export const smooth = (t: number) => t * t * (3 - 2 * t);
