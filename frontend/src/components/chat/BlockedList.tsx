import { useState } from "react";
import { Ban, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "../Avatar";
import { api } from "../../lib/api";
import { useSession } from "../../lib/session";
import { useBlocks, useRefresh } from "../../lib/queries";
import { cn } from "../../lib/utils";

export function BlockedList() {
  const { active } = useSession();
  const refresh = useRefresh();
  const blocks = useBlocks();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const list = blocks.data ?? [];
  if (!list.length) return null;

  const unblock = async (id: string, name: string) => {
    if (!active) return;
    setBusy(id);
    try {
      await api.unblock(active.token, id);
      toast.success(`${name.split(" ")[0]} unblocked`);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="border-t border-white/10 px-3 py-3" data-testid="blocked-list">
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} data-testid="blocked-list-toggle" className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-xs text-zinc-400 hover:text-white">
        <span className="flex items-center gap-2"><Ban className="h-3.5 w-3.5 text-rose-300" /> Blocked people ({list.length})</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul className="mt-1 grid gap-1">
          {list.map((b) => (
            <li key={b.person.id} className="flex items-center gap-3 rounded-xl px-2 py-2" data-testid={`blocked-item-${b.person.id}`}>
              <Avatar name={b.person.name} seed={b.person.id} className="h-9 w-9 rounded-xl text-xs" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-zinc-100">{b.person.name}</span>
                {b.reason && <span className="block truncate text-xs text-zinc-500">{b.reason}</span>}
              </span>
              <button onClick={() => unblock(b.person.id, b.person.name)} disabled={busy === b.person.id} data-testid={`unblock-btn-${b.person.id}`} className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-white hover:border-white/40 disabled:opacity-50">
                {busy === b.person.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Unblock"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
