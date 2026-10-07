import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Clock, MapPin, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "./Avatar";
import { MeetupPanel } from "./MeetupPanel";
import { api } from "../lib/api";
import type { LocationRequest, RequestStatus } from "../lib/api";
import { useSession } from "../lib/session";
import { useRefresh } from "../lib/queries";
import { cn } from "../lib/utils";

const STATUS: Record<RequestStatus, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "border-[#ffb086]/40 text-[#ffb086]" },
  shared: { label: "Sharing", cls: "border-[#34d399]/50 bg-[#34d399]/10 text-[#34d399]" },
  declined: { label: "Declined", cls: "border-white/15 text-zinc-300" },
  revoked: { label: "Revoked", cls: "border-white/15 text-zinc-300" },
  expired: { label: "Expired", cls: "border-white/15 text-zinc-300" },
  cancelled: { label: "Cancelled", cls: "border-white/15 text-zinc-300" },
};

const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

interface Props {
  request: LocationRequest;
  direction: "incoming" | "outgoing";
  onShare: (r: LocationRequest) => void;
}

export function RequestCard({ request: r, direction, onShare }: Props) {
  const { active } = useSession();
  const refresh = useRefresh();
  const [busy, setBusy] = useState(false);
  const person = r.counterpart;
  const s = STATUS[r.status] ?? STATUS.pending;

  const act = async (fn: () => Promise<unknown>, msg: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(msg);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };
  const token = active?.token ?? "";

  return (
    <article data-testid={`request-card-${r.id}`} className="rounded-[28px] border border-white/10 bg-[#15111d] p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <Avatar name={person?.name ?? "?"} seed={person?.id ?? r.id} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white">
            {direction === "incoming" ? `${person?.name ?? "Someone"} asks for your location` : `You asked ${person?.name ?? "someone"}`}
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">
            {person?.department} · {time(r.created_at)} {r.is_demo && "· demo request"}
          </p>
        </div>
        <span className={cn("rounded-full border px-3 py-1 text-xs", s.cls)} data-testid="request-status-badge">{s.label}</span>
      </div>
      {person && (
        <Link to={`/messages/${person.id}`} data-testid="request-card-message-link" className="mt-4 inline-flex items-center gap-2 text-sm text-zinc-300 transition-colors hover:text-[#ffb086]">
          <MessageCircle className="h-4 w-4 text-[#ffb086]" /> Message {person.name.split(" ")[0]} privately
        </Link>
      )}
      {r.note && <p className="mt-4 rounded-2xl bg-white/[0.03] px-4 py-3 text-sm text-zinc-200">“{r.note}”</p>}

      {direction === "incoming" && r.status === "pending" && (
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button onClick={() => onShare(r)} disabled={busy} data-testid="location-inbox-accept-btn" className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#34d399] py-3 text-sm font-semibold text-[#0c0a12] transition-transform hover:scale-[1.02]">
            <Check className="h-4 w-4" /> Share approximate location
          </button>
          <button onClick={() => act(() => api.respond(token, r.id, { accept: false }), "Request declined. Nothing was shared.")} disabled={busy} data-testid="location-inbox-decline-btn" className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 py-3 text-sm text-white hover:bg-white/5">
            <X className="h-4 w-4" /> Decline
          </button>
        </div>
      )}

      {direction === "incoming" && r.status === "shared" && r.location && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#34d399]/30 bg-[#34d399]/[0.05] px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-zinc-200">
            <span className="relative grid h-3 w-3 place-items-center"><span className="pulse-ring absolute inset-0 rounded-full bg-[#34d399]" /><span className="h-2 w-2 rounded-full bg-[#34d399]" /></span>
            Shared until {time(r.location.expires_at)}
          </span>
          <button onClick={() => act(() => api.revoke(token, r.id), "Location sharing revoked.")} disabled={busy} data-testid="location-sharing-revoke-btn" className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#0c0a12] hover:bg-rose-200">
            Revoke now
          </button>
        </div>
      )}
      {direction === "incoming" && r.status === "shared" && r.location && <MeetupPanel request={r} loc={r.location} isSharer />}

      {direction === "outgoing" && r.status === "pending" && (
        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm text-zinc-400"><Clock className="h-4 w-4" /> Waiting for their decision</span>
          <button onClick={() => act(() => api.cancel(token, r.id), "Request cancelled.")} disabled={busy} data-testid="outgoing-request-cancel-btn" className="text-sm text-zinc-300 underline-offset-4 hover:underline">
            Cancel request
          </button>
        </div>
      )}

      {direction === "outgoing" && r.status === "shared" && r.location && (
        <>
          <p className="mt-4 flex items-center gap-2 text-sm text-[#34d399]"><MapPin className="h-4 w-4" /> Shared with you until {time(r.location.expires_at)}</p>
          <MeetupPanel request={r} loc={r.location} isSharer={false} />
        </>
      )}
    </article>
  );
}
