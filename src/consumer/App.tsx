import { useEffect } from "react";
import { HashRouter, Route, Routes, Navigate } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { Toaster, toast } from "./components/toast";
import { useApp, useRuntime } from "./store/app";
import { translate } from "./lib/i18n";
import { detectLive, probeBackend } from "./api/client";
import Shell from "./layout/Shell";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import ChatHub from "./pages/ChatHub";
import Conversation from "./pages/Conversation";
import Skills from "./pages/Skills";
import SkillDetail from "./pages/SkillDetail";
import Downloads from "./pages/Downloads";
import SettingsPage from "./pages/Settings";
import Privacy from "./pages/Privacy";
import ModelStatus from "./pages/ModelStatus";
import Voice from "./pages/Voice";
import { LogoMark } from "./components/core";

export default function ConsumerApp() {
  const onboarded = useApp((s) => s.onboarded);
  const theme = useApp((s) => s.theme);
  const setBackend = useRuntime((s) => s.setBackend);
  const setLive = useRuntime((s) => s.setLive);
  const setOnline = useRuntime((s) => s.setOnline);
  const probed = useRuntime((s) => s.probed);
  const lang = useApp((s) => s.lang);

  /* apply theme */
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
      root.classList.toggle("dark", dark);
    };
    apply();
    const mq = matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);

  /* set <html lang> so Devanagari shaping and accessibility follow the UI */
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  /* probe runtimes once — local backend first, then the on-device runtime; otherwise Demo mode */
  useEffect(() => {
    detectLive().then(async (kind) => {
      setLive(kind !== null);
      setBackend(await probeBackend());
    });
  }, [setBackend, setLive]);

  /* online / offline awareness — calm, non-alarming */
  useEffect(() => {
    const off = () => {
      setOnline(false);
      toast(translate(useApp.getState().lang, "toast.offline"), "offline");
    };
    const on = () => {
      setOnline(true);
      toast(translate(useApp.getState().lang, "toast.online"));
    };
    window.addEventListener("offline", off);
    window.addEventListener("online", on);
    return () => {
      window.removeEventListener("offline", off);
      window.removeEventListener("online", on);
    };
  }, [setOnline]);

  if (!probed) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="animate-breathe">
          <LogoMark className="h-12 w-12" />
        </div>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <HashRouter>
        <Routes>
          {onboarded ? (
            <>
              <Route path="/voice" element={<Voice />} />
              <Route element={<Shell />}>
                <Route index element={<Home />} />
                <Route path="/chat" element={<ChatHub />} />
                <Route path="/chat/:id" element={<Conversation />} />
                <Route path="/skills" element={<Skills />} />
                <Route path="/skills/:id" element={<SkillDetail />} />
                <Route path="/downloads" element={<Downloads />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/settings/privacy" element={<Privacy />} />
                <Route path="/settings/model" element={<ModelStatus />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </>
          ) : (
            <>
              <Route path="*" element={<Onboarding />} />
            </>
          )}
        </Routes>
        <Toaster />
      </HashRouter>
    </MotionConfig>
  );
}
