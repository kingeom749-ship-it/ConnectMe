import { useState } from "react";
import { Link } from "react-router-dom";
import { Clock, EyeOff, Loader2, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "./Modal";
import { api } from "../lib/api";
import type { Person } from "../lib/api";
import { useSession } from "../lib/session";
import { useRefresh } from "../lib/queries";

interface Props {
  target: Person | null;
  onClose: () => void;
}

export function RequestLocationModal({ target, onClose }: Props) {
  const { active } = useSession();
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const refresh = useRefresh();

  const send = async () => {
    if (!active || !target) return;
    setSending(true);
    try {
      await api.requestLocation(active.token, target.id, note);
      toast.success(`Request sent to ${target.name}. They'll decide whether to share.`);
      setNote("");
      refresh();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send request");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal open={Boolean(target)} onClose={onClose} title="Request location" testId="location-request-modal">
      {!active ? (
        <div>
          <p className="eyebrow">Register first</p>
          <h2 className="mt-3 font-display text-2xl font-semibold uppercase text-white">Who's asking?</h2>
          <p className="mt-3 text-sm text-zinc-300">Requests always show your name, so {target?.name} knows exactly who is asking. Create a profile to continue.</p>
          <Link to="/register" onClick={onClose} data-testid="location-request-register-link" className="mt-6 inline-flex rounded-full bg-[#d7ff3a] px-6 py-3 font-semibold text-[#07080c]">
            Start registration
          </Link>
        </div>
      ) : (
        <div>
          <p className="eyebrow">Consent-based request</p>
          <h2 className="mt-3 pr-10 font-display text-2xl font-semibold uppercase leading-tight text-white">Ask {target?.name} to share their location</h2>
          <ul className="mt-5 grid gap-3 text-sm text-zinc-300">
            <li className="flex gap-3"><ShieldCheck className="h-4 w-4 shrink-0 text-[#34d399]" /> Nothing is shared unless {target?.name.split(" ")[0]} approves — their device will also ask permission.</li>
            <li className="flex gap-3"><EyeOff className="h-4 w-4 shrink-0 text-[#34d399]" /> If approved, you'll see an approximate area (about 1 km), not an exact address.</li>
            <li className="flex gap-3"><Clock className="h-4 w-4 shrink-0 text-[#34d399]" /> Sharing ends after 60 minutes or the moment they revoke it.</li>
          </ul>
          <label htmlFor="request-note" className="mt-6 block font-mono text-xs uppercase tracking-widest text-zinc-400">
            Note (optional)
          </label>
          <textarea
            id="request-note"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 140))}
            rows={3}
            placeholder="Hey! Meeting for practice near the auditorium?"
            data-testid="location-request-note-input"
            className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-white placeholder:text-zinc-500 focus:border-[#d7ff3a] focus:outline-none"
          />
          <p className="mt-1 text-right font-mono text-[11px] text-zinc-400">{note.length}/140</p>
          <p className="mt-2 text-sm text-zinc-400">Sending as <span className="text-white">{active.name}</span></p>
          <button
            onClick={send}
            disabled={sending}
            data-testid="location-request-modal-confirm-btn"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#d7ff3a] py-4 font-semibold text-[#07080c] transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send request
          </button>
        </div>
      )}
    </Modal>
  );
}
