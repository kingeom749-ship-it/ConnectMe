import { useState } from "react";
import { Check, ExternalLink, Flag, Loader2, MapPinned, X } from "lucide-react";
import { toast } from "sonner";
import { MeetupMap } from "./MeetupMap";
import { MeetupCountdown } from "./MeetupCountdown";
import { ContactReveal } from "./ContactReveal";
import { api } from "../lib/api";
import type { LocationRequest, SharedLocation } from "../lib/api";
import { useSession } from "../lib/session";
import { useRefresh } from "../lib/queries";

interface Props {
  request: LocationRequest;
  loc: SharedLocation;
  isSharer: boolean;
}

const pill = "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.03] disabled:opacity-50";

export function MeetupPanel({ request: r, loc, isSharer }: Props) {
  const { active } = useSession();
  const refresh = useRefresh();
  const [picking, setPicking] = useState(false);
  const [draft, setDraft] = useState<{ lat: number; lng: number } | null>(null);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const m = r.meetup;
  const other = r.counterpart?.name.split(" ")[0] ?? "them";
  const token = active?.token ?? "";

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(msg);
      refresh();
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const stopPicking = () => {
    setPicking(false);
    setDraft(null);
    setLabel("");
  };

  const send = async () => {
    if (!draft) return;
    const ok = await run(() => api.proposeMeetup(token, r.id, { ...draft, label: label.trim() }), `Spot suggested to ${other}`);
    if (ok) stopPicking();
  };

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-[#34d399]/30" data-testid="meetup-panel">
      <MeetupMap loc={loc} meetup={m} draft={draft} picking={picking} onPick={setDraft} />
      <div className="grid gap-3 bg-[#34d399]/[0.05] p-4">
        <p className="font-mono text-xs text-zinc-300">
          Shared area ≈ {loc.lat.toFixed(2)}, {loc.lng.toFixed(2)} · ±{Math.round((loc.accuracy_m ?? 1000) / 1000)} km
        </p>

        {picking ? (
          <div className="grid gap-3">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value.slice(0, 60))}
              placeholder="Name the spot, e.g. Library steps"
              data-testid="meetup-label-input"
              className="h-12 w-full rounded-full border border-white/10 bg-[#07080c]/60 px-5 text-white placeholder:text-zinc-500 focus:border-[#2fb8ff] focus:outline-none"
            />
            <div className="flex flex-wrap gap-2">
              <button onClick={send} disabled={busy || !draft || label.trim().length < 2} data-testid="meetup-send-btn" className={`${pill} bg-[#2fb8ff] text-[#07080c]`}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />} Suggest this spot
              </button>
              <button onClick={stopPicking} data-testid="meetup-cancel-pick-btn" className={`${pill} border border-white/15 text-white`}>
                Cancel
              </button>
            </div>
            {!draft && <p className="text-xs text-zinc-400">Drop a pin first, then name it.</p>}
          </div>
        ) : (
          <>
            <MeetupStatus request={r} other={other} busy={busy}
              onSuggest={() => setPicking(true)}
              onAnswer={(accept) => run(() => api.respondMeetup(token, r.id, accept), accept ? "Meet-up spot confirmed" : "Spot declined")}
            />
            {m?.status === "accepted" && <MeetupCountdown meetup={m} loc={loc} isSharer={isSharer} other={other} />}
            {m?.status === "accepted" && r.contact_phone && <ContactReveal phone={r.contact_phone} other={other} spot={m.label} />}
          </>
        )}
      </div>
    </div>
  );
}

interface StatusProps {
  request: LocationRequest;
  other: string;
  busy: boolean;
  onSuggest: () => void;
  onAnswer: (accept: boolean) => void;
}

function MeetupStatus({ request: r, other, busy, onSuggest, onAnswer }: StatusProps) {
  const m = r.meetup;
  const suggestBtn = (text: string) => (
    <button onClick={onSuggest} data-testid="meetup-suggest-btn" className={`${pill} bg-white text-[#07080c]`}>
      <MapPinned className="h-4 w-4" /> {text}
    </button>
  );
  const row = "flex flex-wrap items-center justify-between gap-3";

  if (!m) return <div className={row}><p className="text-sm text-zinc-200">No meet-up spot yet.</p>{suggestBtn("Suggest a spot")}</div>;

  if (m.status === "accepted") {
    return (
      <div className={row} data-testid="meetup-confirmed">
        <p className="flex items-center gap-2 text-sm text-white"><Check className="h-4 w-4 text-[#2fb8ff]" /> Meeting at <span className="font-semibold">{m.label}</span></p>
        <div className="flex flex-wrap gap-2">
          <a href={`https://www.openstreetmap.org/directions?to=${m.lat},${m.lng}`} target="_blank" rel="noreferrer" data-testid="meetup-directions-link" className={`${pill} bg-[#2fb8ff] text-[#07080c]`}>
            Directions <ExternalLink className="h-3.5 w-3.5" />
          </a>
          {suggestBtn("Change")}
        </div>
      </div>
    );
  }

  if (m.status === "proposed" && !m.proposed_by_me) {
    return (
      <div className={row} data-testid="meetup-incoming-proposal">
        <p className="text-sm text-white">{other} suggests <span className="font-semibold">{m.label}</span></p>
        <div className="flex gap-2">
          <button onClick={() => onAnswer(true)} disabled={busy} data-testid="meetup-accept-btn" className={`${pill} bg-[#2fb8ff] text-[#07080c]`}><Check className="h-4 w-4" /> Accept</button>
          <button onClick={() => onAnswer(false)} disabled={busy} data-testid="meetup-decline-btn" className={`${pill} border border-white/15 text-white`}><X className="h-4 w-4" /> Decline</button>
        </div>
      </div>
    );
  }

  const text = m.status === "proposed"
    ? `You suggested “${m.label}” — waiting for ${other}${r.is_demo || r.counterpart?.is_demo ? " (demo members don't reply)" : ""}.`
    : m.proposed_by_me ? `${other} declined “${m.label}”.` : `You declined “${m.label}”.`;
  return <div className={row} data-testid="meetup-status"><p className="text-sm text-zinc-200">{text}</p>{suggestBtn(m.status === "proposed" ? "Change spot" : "Suggest another")}</div>;
}
