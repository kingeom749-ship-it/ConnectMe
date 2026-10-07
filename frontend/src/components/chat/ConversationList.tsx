import { Link } from "react-router-dom";
import { MessageSquareDashed } from "lucide-react";
import { Avatar } from "../Avatar";
import type { Conversation } from "../../lib/api";
import { cn } from "../../lib/utils";

interface Props {
  conversations: Conversation[];
  activeId?: string;
  loading: boolean;
}

const when = (iso: string) => {
  const d = new Date(iso);
  const today = new Date().toDateString() === d.toDateString();
  return today ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString([], { day: "numeric", month: "short" });
};

export function ConversationList({ conversations, activeId, loading }: Props) {
  if (!loading && conversations.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/15 p-8 text-center" data-testid="conversations-empty">
        <MessageSquareDashed className="mx-auto h-8 w-8 text-zinc-500" />
        <p className="mt-3 text-sm text-zinc-300">No chats yet. Open someone in the directory and tap Message.</p>
        <Link to="/directory" data-testid="conversations-browse-link" className="mt-3 inline-block text-sm text-[#2fb8ff] hover:underline">Browse the directory →</Link>
      </div>
    );
  }
  return (
    <ul className="grid gap-1.5" data-testid="conversation-list">
      {conversations.map((c) => {
        const on = c.person.id === activeId;
        return (
          <li key={c.person.id}>
            <Link
              to={`/messages/${c.person.id}`}
              data-testid={`conversation-item-${c.person.id}`}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-3 py-3 transition-colors",
                on ? "border-[#2fb8ff]/40 bg-[#2fb8ff]/[0.08]" : "border-transparent hover:border-white/10 hover:bg-white/[0.03]"
              )}
            >
              <Avatar name={c.person.name} seed={c.person.id} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className={cn("truncate text-sm font-semibold", on ? "text-white" : "text-zinc-100")}>{c.person.name}</span>
                  <span className="shrink-0 font-mono text-[10px] text-zinc-500">{when(c.last_message.created_at)}</span>
                </span>
                <span className="mt-0.5 flex items-center justify-between gap-2">
                  <span className={cn("truncate text-xs", c.unread ? "font-medium text-zinc-100" : "text-zinc-400")}>
                    {c.last_message.mine && "You: "}{c.last_message.text}
                  </span>
                  {c.unread > 0 && (
                    <span data-testid={`conversation-unread-${c.person.id}`} className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-[#2fb8ff] px-1.5 font-mono text-[10px] font-semibold text-[#07080c]">
                      {c.unread}
                    </span>
                  )}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
