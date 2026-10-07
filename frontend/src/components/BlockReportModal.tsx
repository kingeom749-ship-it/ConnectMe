import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Ban, Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "./Modal";
import { api } from "../lib/api";
import type { Person } from "../lib/api";
import { useSession } from "../lib/session";
import { useRefresh } from "../lib/queries";
import { cn } from "../lib/utils";

interface Props {
  person: Person | null;
  onClose: () => void;
}

const REASONS = ["Spam or scam", "Harassment", "Fake profile", "Unwanted contact", "Other"];

export function BlockReportModal({ person, onClose }: Props) {
  const { active } = useSession();
  const refresh = useRefresh();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [report, setReport] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const first = person?.name.split(" ")[0] ?? "them";

  const submit = async () => {
    if (!person || !active) return;
    setBusy(true);
    try {
      await api.block(active.token, person.id, { reason, report });
      toast.success(report ? `${first} blocked and reported` : `${first} blocked`);
      refresh();
      onClose();
      if (pathname === `/messages/${person.id}`) navigate("/messages");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={Boolean(person)} onClose={onClose} title={`Block ${first}?`} testId="block-report-modal">
      <h2 className="mb-3 pr-12 font-display text-2xl font-bold uppercase text-white">Block {first}?</h2>
      <p className="text-sm text-zinc-300">
        {first} won't be able to message you or request your location, and you'll disappear from each other's directory.
        Any active sharing between you is revoked. You can unblock later from Messages.
      </p>
      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Reason">
        {REASONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setReason(reason === r ? "" : r)}
            data-testid={`block-reason-${r.toLowerCase().replace(/[^a-z]+/g, "-")}`}
            className={cn("rounded-full border px-4 py-2 text-xs transition-colors", reason === r ? "border-[#ffb086] bg-[#ffb086]/15 text-white" : "border-white/15 text-zinc-300 hover:border-white/40")}
          >
            {r}
          </button>
        ))}
      </div>
      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 p-4">
        <input type="checkbox" checked={report} onChange={(e) => setReport(e.target.checked)} data-testid="block-report-checkbox" className="mt-1 h-4 w-4 accent-[#ffb086]" />
        <span className="text-sm text-zinc-200">
          <span className="flex items-center gap-2 font-medium text-white"><Flag className="h-4 w-4 text-rose-300" /> Also report to ConnectMe</span>
          <span className="mt-1 block text-xs text-zinc-400">Reports are private and reviewed by the team. {first} is never told who reported them.</span>
        </span>
      </label>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <button onClick={submit} disabled={busy} data-testid="block-confirm-btn" className="flex flex-1 items-center justify-center gap-2 rounded-full bg-rose-400 py-3 text-sm font-semibold text-[#0c0a12] transition-transform hover:scale-[1.02] disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />} {report ? "Block & report" : "Block"}
        </button>
        <button onClick={onClose} data-testid="block-cancel-btn" className="flex-1 rounded-full border border-white/15 py-3 text-sm text-white hover:bg-white/5">
          Cancel
        </button>
      </div>
    </Modal>
  );
}
