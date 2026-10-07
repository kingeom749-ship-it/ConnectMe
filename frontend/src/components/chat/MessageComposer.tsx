import { useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Loader2, SendHorizonal } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api";
import { useSession } from "../../lib/session";
import { useRefresh } from "../../lib/queries";

interface Props {
  otherId: string;
  otherName: string;
}

export function MessageComposer({ otherId, otherName }: Props) {
  const { active } = useSession();
  const refresh = useRefresh();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    const t = text.trim();
    if (!t || busy || !active) return;
    setBusy(true);
    try {
      await api.sendMessage(active.token, otherId, t);
      setText("");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send message");
    } finally {
      setBusy(false);
    }
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  return (
    <form onSubmit={send} className="flex items-end gap-2 border-t border-white/10 bg-[#15111d] p-3 sm:p-4" data-testid="message-composer">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 1000))}
        onKeyDown={onKey}
        rows={1}
        placeholder={`Message ${otherName}…`}
        data-testid="message-input"
        className="max-h-40 min-h-[48px] flex-1 resize-none rounded-3xl border border-white/10 bg-[#0c0a12]/60 px-5 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-[#ffb086] focus:outline-none"
      />
      <button
        type="submit"
        disabled={busy || !text.trim()}
        data-testid="message-send-btn"
        aria-label="Send message"
        className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#ffb086] text-[#0c0a12] transition-transform hover:scale-[1.05] active:scale-95 disabled:opacity-40"
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizonal className="h-5 w-5" />}
      </button>
    </form>
  );
}
