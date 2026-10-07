import { useEffect, useRef } from "react";
import { Check, CheckCheck, Lock } from "lucide-react";
import type { Message } from "../../lib/api";
import { cn } from "../../lib/utils";

interface Props {
  messages: Message[];
  otherName: string;
}

const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const day = (iso: string) => new Date(iso).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });

export function MessageThread({ messages, otherName }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const count = messages.length;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: count > 1 ? "smooth" : "auto" });
  }, [count]);

  return (
    <div className="flex-1 space-y-2 overflow-y-auto px-4 py-5 sm:px-6" data-testid="message-thread">
      <p className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-zinc-400" data-testid="thread-privacy-note">
        <Lock className="h-3.5 w-3.5 text-[#ffb086]" /> Private — only you and {otherName} can see this chat.
      </p>
      {messages.length === 0 && (
        <p className="py-10 text-center text-sm text-zinc-500" data-testid="thread-empty">Say hi to {otherName}. Your first message starts the thread.</p>
      )}
      {messages.map((m, i) => {
        const prev = messages[i - 1];
        const newDay = !prev || day(prev.created_at) !== day(m.created_at);
        const grouped = prev && prev.mine === m.mine && !newDay;
        return (
          <div key={m.id}>
            {newDay && <p className="my-4 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">{day(m.created_at)}</p>}
            <div className={cn("flex", m.mine ? "justify-end" : "justify-start", grouped ? "mt-1" : "mt-3")} data-testid={`message-${m.id}`}>
              <div
                className={cn(
                  "max-w-[80%] px-4 py-2.5 text-sm leading-relaxed sm:max-w-[70%]",
                  m.mine
                    ? "rounded-[20px] rounded-br-md bg-[#ffb086] text-[#0c0a12]"
                    : "rounded-[20px] rounded-bl-md border border-white/10 bg-white/[0.05] text-zinc-100"
                )}
              >
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
                <p className={cn("mt-1 flex items-center justify-end gap-1 font-mono text-[10px]", m.mine ? "text-[#0c0a12]/60" : "text-zinc-500")}>
                  {time(m.created_at)}
                  {m.mine && (m.read_at ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
