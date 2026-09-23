import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, WifiOff, CloudOff, HardDrive, Scale, Trash2 } from "lucide-react";
import { Button, Card } from "../components/ui";
import { MotionPage } from "../components/motion";
import { useRuntime } from "../store/app";

const POINTS = [
  {
    icon: HardDrive,
    title: "Conversations live on this device",
    body: "Your chats are stored in local storage on this device. There is no SkillBox account and no sync to a server you don't control.",
  },
  {
    icon: WifiOff,
    title: "Installed Skills work offline",
    body: "Once the base model and a Skill are installed, questions are answered locally. In Offline Mode the app keeps working — nothing needs to leave the device.",
  },
  {
    icon: CloudOff,
    title: "No cloud AI required for local inference",
    body: "The SkillBox architecture runs a base model plus Skill adapters on your device. In Demo Mode (without the backend), no network calls to any AI service are made either — answers are clearly-labelled built-in samples.",
  },
  {
    icon: Scale,
    title: "What offline mode does and doesn't mean",
    body: "Offline inference keeps your prompts on the device. It is not a blanket guarantee about everything: if you enable backend connections or future online features, those features may exchange data — and the app will say so. This prototype makes demo vs. local inference explicit rather than hiding it.",
  },
  {
    icon: Trash2,
    title: "Your data, your call",
    body: "Export everything as JSON, or delete all conversations, from Settings. Deleting is immediate and local.",
  },
];

export default function Privacy() {
  const navigate = useNavigate();
  const live = useRuntime((s) => s.live);
  return (
    <MotionPage>
      <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-5 sm:px-6">
        <Button variant="ghost" size="icon" aria-label="Back" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="mt-6 flex items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-500/10 text-brand-600">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-display text-[26px] font-semibold tracking-tight text-balance">
              Your AI stays with you.
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2 dark:text-night-ink2">
              SkillBox is built around one idea: the intelligence, the knowledge and the
              conversation all live on your device. Here is exactly what that means —
              and what it doesn't.
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {POINTS.map((p) => (
            <Card key={p.title} className="flex items-start gap-3.5 p-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black/[0.04] text-ink-2 dark:bg-white/[0.06] dark:text-night-ink2">
                <p.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[14.5px] font-semibold">{p.title}</p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2 dark:text-night-ink2">{p.body}</p>
              </div>
            </Card>
          ))}
        </div>

        <Card className="mt-6 p-4">
          <p className="text-[12.5px] leading-relaxed text-ink-3 dark:text-night-ink3">
            Current mode: <b>{live ? "Local AI (runtime connected)" : "Demo Mode"}</b>.
            {!live && " In Demo Mode, sample responses are generated on-device by the app itself and are visibly labelled."}
          </p>
        </Card>
      </div>
    </MotionPage>
  );
}
