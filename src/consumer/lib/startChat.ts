import { useNavigate } from "react-router-dom";
import { useChats } from "../store/chats";
import { useApp } from "../store/app";
import { titleFrom } from "./utils";

/** Creates (or reuses) a conversation for a skill and navigates into it. */
export function useStartChat() {
  const navigate = useNavigate();
  const create = useChats((s) => s.create);
  const rename = useChats((s) => s.rename);
  const touchSkill = useApp((s) => s.touchSkill);
  const lang = useApp((s) => s.lang);

  return (skillId: string, firstText?: string) => {
    const conv = create(skillId, lang, firstText);
    if (firstText) rename(conv.id, titleFrom(firstText));
    if (skillId !== "general") touchSkill(skillId);
    navigate(`/chat/${conv.id}`);
  };
}
