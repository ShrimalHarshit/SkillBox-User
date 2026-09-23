import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCirclePlus, MessagesSquare, Search, Ellipsis, Pencil, Pin, PinOff, Trash2,
} from "lucide-react";
import { useApp } from "../store/app";
import { useChats, type Conversation } from "../store/chats";
import { translate } from "../lib/i18n";
import { dayBucket, timeLabel } from "../lib/utils";
import { EmptyState } from "../components/core";
import { Button, Input, Card } from "../components/ui";
import { Modal, Menu, MenuItem } from "../components/overlay";
import { MotionPage, listVariants, itemVariants } from "../components/motion";
import { SkillAvatar, skillVisual } from "../components/chat";
import { useStartChat } from "../lib/startChat";
import { toast } from "../components/toast";

type GroupKey = "pinned" | "today" | "yesterday" | "week" | "older";

export default function ChatHub() {
  const lang = useApp((s) => s.lang);
  const installed = useApp((s) => s.installedSkills);
  const defaultSkillId = useApp((s) => s.defaultSkillId);
  const conversations = useChats((s) => s.conversations);
  const { remove, togglePin, rename } = useChats();
  const navigate = useNavigate();
  const startChat = useStartChat();
  const t = (k: string) => translate(lang, k);

  const [query, setQuery] = useState("");
  const [renameTarget, setRenameTarget] = useState<Conversation | null>(null);
  const [renameText, setRenameText] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);

  /* debounced search */
  const q = query.trim().toLowerCase();
  const list = useMemo(() => {
    const filtered = q
      ? conversations.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.messages.some((m) => m.content.toLowerCase().includes(q)),
        )
      : conversations;
    const by: Record<GroupKey, Conversation[]> = { pinned: [], today: [], yesterday: [], week: [], older: [] };
    for (const c of filtered) {
      if (c.pinned) by.pinned.push(c);
      else by[dayBucket(c.updatedAt)].push(c);
    }
    return (Object.keys(by) as GroupKey[])
      .filter((k) => by[k].length)
      .map((k) => ({ key: k, items: by[k].sort((a, b) => b.updatedAt - a.updatedAt) }));
  }, [conversations, q]);

  const newChat = () => startChat(installed.includes(defaultSkillId) ? defaultSkillId : "general");

  return (
    <MotionPage>
      <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 sm:px-6">
        <header className="flex items-center justify-between gap-3 px-1">
          <h1 className="font-display text-[24px] font-semibold tracking-tight">{t("nav.chat")}</h1>
          <Button variant="primary" size="md" onClick={newChat}>
            <MessageCirclePlus className="h-4.5 w-4.5 h-[18px] w-[18px]" />
            {t("chat.new")}
          </Button>
        </header>

        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3 dark:text-night-ink3" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("chat.search")}
            className="pl-10"
            aria-label={t("chat.search")}
          />
        </div>

        {list.length === 0 ? (
          <Card className="mt-6">
            <EmptyState
              icon={MessagesSquare}
              title={t("empty.noConversations.title")}
              body={t("empty.noConversations.body")}
              action={
                <Button variant="accent" onClick={newChat}>
                  <MessageCirclePlus className="h-4 w-4" /> {t("chat.new")}
                </Button>
              }
            />
          </Card>
        ) : (
          <motion.div initial="hidden" animate="show" variants={listVariants} className="mt-6 space-y-7">
            {list.map((group) => (
              <div key={group.key}>
                <h2 className="px-1 pb-2 text-[11.5px] font-semibold uppercase tracking-wide text-ink-3 dark:text-night-ink3">
                  {group.key === "pinned" ? t("chat.pinned") : t(`chat.${group.key}`)}
                </h2>
                <motion.ul layout className="space-y-1">
                  <AnimatePresence initial={false}>
                    {group.items.map((c) => {
                      const v = skillVisual(c.skillId);
                      const preview = c.messages[c.messages.length - 1]?.content ?? "";
                      return (
                        <motion.li
                          key={c.id}
                          layout
                          variants={itemVariants}
                          exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0, overflow: "hidden" }}
                        >
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => navigate(`/chat/${c.id}`)}
                            onKeyDown={(e) => e.key === "Enter" && navigate(`/chat/${c.id}`)}
                            className="group flex cursor-pointer items-center gap-3 rounded-2xl px-2.5 py-2.5 transition-colors hover:bg-black/[0.035] dark:hover:bg-white/[0.05]"
                          >
                            <SkillAvatar skillId={c.skillId} size="md" />
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-1.5">
                                {c.pinned && <Pin className="h-3 w-3 shrink-0 text-ink-3" />}
                                <span className="truncate text-[14.5px] font-medium">{c.title}</span>
                              </span>
                              <span className="mt-0.5 block truncate text-[12.5px] text-ink-3 dark:text-night-ink3">
                                {v.name} · {preview.replace(/[#*`>\n]/g, " ").slice(0, 72)}
                              </span>
                            </span>
                            <span className="shrink-0 text-[11.5px] text-ink-3 dark:text-night-ink3">
                              {timeLabel(c.updatedAt)}
                            </span>
                            <div onClick={(e) => e.stopPropagation()}>
                              <Menu
                                trigger={
                                  <button
                                    aria-label="More"
                                    className="grid h-8 w-8 place-items-center rounded-full text-ink-3 opacity-0 transition-all hover:bg-black/[0.06] group-hover:opacity-100 dark:hover:bg-white/[0.08] max-md:opacity-100"
                                  >
                                    <Ellipsis className="h-4 w-4" />
                                  </button>
                                }
                              >
                                <MenuItem icon={<Pencil />} onSelect={() => { setRenameTarget(c); setRenameText(c.title); }}>
                                  {t("chat.rename")}
                                </MenuItem>
                                <MenuItem icon={c.pinned ? <PinOff /> : <Pin />} onSelect={() => togglePin(c.id)}>
                                  {c.pinned ? t("chat.unpin") : t("chat.pin")}
                                </MenuItem>
                                <MenuItem icon={<Trash2 />} danger onSelect={() => setDeleteTarget(c)}>
                                  {t("chat.delete")}
                                </MenuItem>
                              </Menu>
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </motion.ul>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* rename modal */}
      <Modal open={!!renameTarget} onOpenChange={(v) => !v && setRenameTarget(null)} title={t("chat.rename")}>
        <Input
          value={renameText}
          onChange={(e) => setRenameText(e.target.value)}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter" && renameTarget && renameText.trim()) {
              rename(renameTarget.id, renameText.trim());
              setRenameTarget(null);
            }
          }}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRenameTarget(null)}>{t("onboard.back")}</Button>
          <Button
            variant="primary"
            disabled={!renameText.trim()}
            onClick={() => {
              if (renameTarget) rename(renameTarget.id, renameText.trim());
              setRenameTarget(null);
            }}
          >
            {t("chat.rename")}
          </Button>
        </div>
      </Modal>

      {/* delete confirm */}
      <Modal open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} title={t("chat.delete")}>
        <p className="text-sm text-ink-2 dark:text-night-ink2">
          “{deleteTarget?.title}”
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>{t("onboard.back")}</Button>
          <Button
            variant="danger"
            onClick={() => {
              if (deleteTarget) {
                remove(deleteTarget.id);
                toast(t("toast.chatDeleted"));
              }
              setDeleteTarget(null);
            }}
          >
            {t("chat.delete")}
          </Button>
        </div>
      </Modal>
    </MotionPage>
  );
}
