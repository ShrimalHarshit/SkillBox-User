import { cloneElement } from "react";
import { useLocation, useNavigate, NavLink, useOutlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, MessagesSquare, Shapes, Download, Settings as SettingsIcon,
  ChevronRight, Cpu,
} from "lucide-react";
import { useApp, useRuntime } from "../store/app";
import { translate } from "../lib/i18n";
import { cn } from "../lib/utils";
import { Wordmark, StatusDot } from "../components/core";
import { LanguageMenu } from "../components/LanguageMenu";

const NAV = [
  { to: "/", key: "nav.home", icon: Home, end: true },
  { to: "/chat", key: "nav.chat", icon: MessagesSquare },
  { to: "/skills", key: "nav.skills", icon: Shapes },
  { to: "/downloads", key: "nav.downloads", icon: Download },
  { to: "/settings", key: "nav.settings", icon: SettingsIcon },
] as const;

const isActive = (pathname: string, to: string, end?: boolean) =>
  end ? pathname === to : pathname.startsWith(to);

/* ------------------------------ Desktop sidebar ----------------------------- */
function Sidebar() {
  const lang = useApp((s) => s.lang);
  const live = useRuntime((s) => s.live);
  const online = useRuntime((s) => s.online);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-surface/60 px-3 py-5 backdrop-blur dark:bg-night-1/60 md:flex">
      <NavLink to="/" className="px-2">
        <Wordmark sub />
      </NavLink>

      <nav className="mt-8 flex flex-col gap-1" aria-label="Primary">
        {NAV.map(({ to, key, icon: Icon, ...rest }) => {
          const active = isActive(pathname, to, (rest as any).end);
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors",
                active ? "text-ink dark:text-night-ink" : "text-ink-2 hover:text-ink dark:text-night-ink2 dark:hover:text-night-ink",
              )}
            >
              {active && (
                <motion.span
                  layoutId="side-pill"
                  className="absolute inset-0 rounded-xl bg-black/[0.05] dark:bg-white/[0.08]"
                  transition={{ type: "spring", stiffness: 480, damping: 38 }}
                />
              )}
              <Icon className="relative h-[18px] w-[18px] transition-transform duration-150 group-hover:translate-x-0.5" strokeWidth={1.9} />
              <span className="relative">{translate(lang, key)}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <button
          onClick={() => navigate("/settings/model")}
          className="group rounded-2xl border border-line bg-surface p-3.5 text-left transition-colors hover:bg-black/[0.02] dark:bg-night-2 dark:hover:bg-white/[0.03]"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[13px] font-semibold">
              <Cpu className="h-4 w-4 text-ink-3 dark:text-night-ink3" />
              {live ? translate(lang, "app.localReady") : translate(lang, "app.demo")}
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-ink-3 transition-transform group-hover:translate-x-0.5" />
          </div>
          <div className="mt-2 flex items-center gap-2 text-[12px] text-ink-2 dark:text-night-ink2">
            <StatusDot tone={live ? "ok" : "warn"} />
            {live
              ? translate(lang, "home.reassure")
              : translate(lang, "app.demo.note").split("—")[0]}
          </div>
          {!online && (
            <div className="mt-1.5 flex items-center gap-2 text-[12px] text-ink-3 dark:text-night-ink3">
              <StatusDot tone="idle" /> {translate(lang, "app.offline")}
            </div>
          )}
        </button>
        <div className="flex items-center justify-between px-1.5">
          <LanguageMenu prominent />
          <span className="text-[11px] text-ink-3 dark:text-night-ink3">v0.1 prototype</span>
        </div>
      </div>
    </aside>
  );
}

/* ------------------------------ Mobile bottom nav -------------------------- */
function BottomNav() {
  const lang = useApp((s) => s.lang);
  const { pathname } = useLocation();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[max(env(safe-area-inset-bottom),0px)] backdrop-blur dark:bg-night-1/95 md:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-md items-stretch">
        {NAV.map(({ to, key, icon: Icon, ...rest }) => {
          const active = (rest as any).end ? pathname === to : pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className="relative flex flex-1 flex-col items-center gap-1 py-2.5"
              aria-current={active ? "page" : undefined}
            >
              <span
                className={cn(
                  "relative grid h-8 w-14 place-items-center rounded-full transition-colors",
                  active ? "text-brand-700 dark:text-brand-300" : "text-ink-3 dark:text-night-ink3",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="bottom-pill"
                    className="absolute inset-0 rounded-full bg-brand-500/12"
                    transition={{ type: "spring", stiffness: 480, damping: 38 }}
                  />
                )}
                <Icon className="relative h-[19px] w-[19px]" strokeWidth={active ? 2 : 1.8} />
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium leading-none",
                  active ? "text-ink dark:text-night-ink" : "text-ink-3 dark:text-night-ink3",
                )}
              >
                {translate(lang, key)}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

/* ---------------------------------- Shell ---------------------------------- */
export default function Shell() {
  const location = useLocation();
  const outlet = useOutlet();
  const immersive = /^\/chat\/[^/]+/.test(location.pathname);

  return (
    <div className="min-h-dvh">
      <Sidebar />
      {!immersive && <BottomNav />}
      <div className={cn("md:pl-64", !immersive && "pb-24 md:pb-0")}>
        <AnimatePresence mode="wait" initial={false}>
          {outlet ? cloneElement(outlet, { key: location.pathname }) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
