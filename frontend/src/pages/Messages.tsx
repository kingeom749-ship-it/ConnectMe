import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Lock, MapPin, MessageCircle } from "lucide-react";
import { Avatar } from "../components/Avatar";
import { ConversationList } from "../components/chat/ConversationList";
import { MessageThread } from "../components/chat/MessageThread";
import { MessageComposer } from "../components/chat/MessageComposer";
import { useConversations, useThread } from "../lib/queries";
import { useSession } from "../lib/session";
import { cn } from "../lib/utils";

export default function Messages() {
  const { active } = useSession();
  const { personId } = useParams<{ personId: string }>();
  const convos = useConversations();
  const thread = useThread(personId);

  if (!active) {
    return (
      <main className="grid min-h-screen place-items-center px-5 pt-28" data-testid="messages-page">
        <div className="max-w-md text-center">
          <Lock className="mx-auto h-10 w-10 text-[#2fb8ff]" />
          <h1 className="mt-6 font-display text-3xl font-bold uppercase text-white">Private messages</h1>
          <p className="mt-3 text-zinc-300">Register to chat one-to-one. Every thread is visible only to the two people in it.</p>
          <Link to="/register" data-testid="messages-register-link" className="mt-8 inline-flex rounded-full bg-[#2fb8ff] px-7 py-4 font-semibold text-[#07080c]">
            Start registration
          </Link>
        </div>
      </main>
    );
  }

  const other = thread.data?.person;

  return (
    <main className="relative min-h-screen pt-24 md:pt-32" data-testid="messages-page">
      <div className="mx-auto max-w-6xl px-3 pb-10 sm:px-5 md:px-8">
        <div className="grid h-[calc(100svh-8.5rem)] min-h-[520px] overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0d12] md:h-[calc(100svh-10rem)] md:grid-cols-[320px_1fr]">
          <aside className={cn("flex flex-col border-white/10 md:border-r", personId && "hidden md:flex")} data-testid="messages-sidebar">
            <div className="flex items-center justify-between px-5 pb-3 pt-5">
              <h1 className="font-display text-xl font-bold uppercase text-white">Messages</h1>
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500"><Lock className="h-3 w-3 text-[#2fb8ff]" /> 1:1 only</span>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-3">
              {convos.isLoading && <p className="flex items-center gap-2 px-2 text-sm text-zinc-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>}
              <ConversationList conversations={convos.data ?? []} activeId={personId} loading={convos.isLoading} />
            </div>
          </aside>

          <section className={cn("flex min-h-0 flex-col", !personId && "hidden md:flex")} data-testid="messages-thread-pane">
            {!personId ? (
              <div className="grid flex-1 place-items-center p-8 text-center">
                <div>
                  <MessageCircle className="mx-auto h-10 w-10 text-zinc-600" />
                  <p className="mt-4 text-zinc-300">Pick a chat, or message someone from the directory.</p>
                  <Link to="/directory" data-testid="messages-browse-link" className="mt-3 inline-block text-sm text-[#2fb8ff] hover:underline">Open the directory →</Link>
                </div>
              </div>
            ) : thread.isLoading ? (
              <p className="flex flex-1 items-center justify-center gap-2 text-zinc-400"><Loader2 className="h-4 w-4 animate-spin" /> Opening chat…</p>
            ) : thread.error || !other ? (
              <p className="flex flex-1 items-center justify-center text-zinc-300" data-testid="thread-error">{thread.error?.message ?? "Person not found"}</p>
            ) : (
              <>
                <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-6" data-testid="thread-header">
                  <Link to="/messages" aria-label="Back to all chats" data-testid="thread-back-link" className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white md:hidden">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                  <Avatar name={other.name} seed={other.id} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">{other.name}</p>
                    <p className="truncate text-xs text-zinc-400">{other.department}{other.is_demo && " · demo member (auto-replies)"}</p>
                  </div>
                  <Link to={`/directory?q=${encodeURIComponent(other.name)}`} data-testid="thread-directory-link" className="hidden items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-200 hover:border-white/30 sm:inline-flex">
                    <MapPin className="h-3.5 w-3.5" /> Profile
                  </Link>
                </header>
                <MessageThread messages={thread.data?.messages ?? []} otherName={other.name.split(" ")[0]} />
                <MessageComposer otherId={other.id} otherName={other.name.split(" ")[0]} />
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
