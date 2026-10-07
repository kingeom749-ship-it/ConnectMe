import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Ban, Loader2, Lock, MapPin, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "../components/Avatar";
import { GoogleButton } from "../components/GoogleButton";
import { BlockReportModal } from "../components/BlockReportModal";
import { BlockedList } from "../components/chat/BlockedList";
import { ConversationList } from "../components/chat/ConversationList";
import { MessageThread } from "../components/chat/MessageThread";
import { MessageComposer } from "../components/chat/MessageComposer";
import { AlertSoundToggle } from "../components/chat/MessageAlerts";
import { api } from "../lib/api";
import type { Person, Thread } from "../lib/api";
import { useConversations, useRefresh, useThread } from "../lib/queries";
import { useSession } from "../lib/session";
import { cn } from "../lib/utils";

function BlockedNotice({ thread, token }: { thread: Thread; token: string }) {
  const refresh = useRefresh();
  const [busy, setBusy] = useState(false);
  const first = thread.person.name.split(" ")[0];
  const unblock = async () => {
    setBusy(true);
    try {
      await api.unblock(token, thread.person.id);
      toast.success(`${first} unblocked`);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#15111d] p-4" data-testid="thread-blocked-notice">
      <p className="flex items-center gap-2 text-sm text-zinc-300">
        <Ban className="h-4 w-4 text-rose-300" />
        {thread.blocked_by_me ? `You blocked ${first}. They can't message you.` : `${first} isn't accepting messages from you.`}
      </p>
      {thread.blocked_by_me && (
        <button onClick={unblock} disabled={busy} data-testid="thread-unblock-btn" className="rounded-full border border-white/15 px-4 py-2 text-xs text-white hover:border-white/40 disabled:opacity-50">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Unblock"}
        </button>
      )}
    </div>
  );
}

export default function Messages() {
  const { active } = useSession();
  const { personId } = useParams<{ personId: string }>();
  const convos = useConversations();
  const thread = useThread(personId);
  const [blocking, setBlocking] = useState<Person | null>(null);

  if (!active) {
    return (
      <main className="grid min-h-screen place-items-center px-5 pt-28" data-testid="messages-page">
        <div className="max-w-md text-center">
          <Lock className="mx-auto h-10 w-10 text-[#ffb086]" />
          <h1 className="mt-6 font-display text-3xl font-bold uppercase text-white">Private messages</h1>
          <p className="mt-3 text-zinc-300">Register to chat one-to-one. Every thread is visible only to the two people in it.</p>
          <Link to="/register" data-testid="messages-register-link" className="mt-8 inline-flex rounded-full bg-[#ffb086] px-7 py-4 font-semibold text-[#0c0a12]">
            Start registration
          </Link>
          <div className="mt-4 flex justify-center"><GoogleButton testId="messages-google-signin-btn" /></div>
        </div>
      </main>
    );
  }

  const other = thread.data?.person;

  return (
    <main className="relative min-h-screen pt-24 md:pt-32" data-testid="messages-page">
      <div className="mx-auto max-w-6xl px-3 pb-10 sm:px-5 md:px-8">
        <div className="grid h-[calc(100svh-8.5rem)] min-h-[520px] overflow-hidden rounded-[28px] border border-white/10 bg-[#110e18] md:h-[calc(100svh-10rem)] md:grid-cols-[320px_1fr]">
          <aside className={cn("flex flex-col border-white/10 md:border-r", personId && "hidden md:flex")} data-testid="messages-sidebar">
            <div className="flex items-center justify-between px-5 pb-3 pt-5">
              <h1 className="font-display text-xl font-bold uppercase text-white">Messages</h1>
              <span className="flex items-center gap-2">
                <AlertSoundToggle />
                <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500"><Lock className="h-3 w-3 text-[#ffb086]" /> 1:1 only</span>
              </span>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-3">
              {convos.isLoading && <p className="flex items-center gap-2 px-2 text-sm text-zinc-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>}
              <ConversationList conversations={convos.data ?? []} activeId={personId} loading={convos.isLoading} />
            </div>
            <BlockedList />
          </aside>

          <section className={cn("flex min-h-0 flex-col", !personId && "hidden md:flex")} data-testid="messages-thread-pane">
            {!personId ? (
              <div className="grid flex-1 place-items-center p-8 text-center">
                <div>
                  <MessageCircle className="mx-auto h-10 w-10 text-zinc-600" />
                  <p className="mt-4 text-zinc-300">Pick a chat, or message someone from the directory.</p>
                  <Link to="/directory" data-testid="messages-browse-link" className="mt-3 inline-block text-sm text-[#ffb086] hover:underline">Open the directory →</Link>
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
                  <Avatar name={other.name} seed={other.id} src={other.picture} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">{other.name}</p>
                    <p className="truncate text-xs text-zinc-400">{other.department}{other.is_demo && " · demo member (auto-replies)"}</p>
                  </div>
                  <Link to={`/directory?q=${encodeURIComponent(other.name)}`} data-testid="thread-directory-link" className="hidden items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-200 hover:border-white/30 sm:inline-flex">
                    <MapPin className="h-3.5 w-3.5" /> Profile
                  </Link>
                  {!thread.data?.blocked_by_me && (
                    <button onClick={() => setBlocking(other)} data-testid="thread-block-btn" aria-label={`Block ${other.name}`} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-zinc-300 transition-colors hover:border-rose-300/60 hover:text-rose-300">
                      <Ban className="h-4 w-4" />
                    </button>
                  )}
                </header>
                <MessageThread messages={thread.data?.messages ?? []} otherName={other.name.split(" ")[0]} />
                {thread.data && (thread.data.blocked_by_me || thread.data.blocked_me) ? (
                  <BlockedNotice thread={thread.data} token={active.token} />
                ) : (
                  <MessageComposer otherId={other.id} otherName={other.name.split(" ")[0]} />
                )}
              </>
            )}
          </section>
        </div>
      </div>
      <BlockReportModal person={blocking} onClose={() => setBlocking(null)} />
    </main>
  );
}
