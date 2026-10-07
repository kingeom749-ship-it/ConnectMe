import { useEffect, useState } from "react";
import { Footprints, Loader2, LocateFixed, PartyPopper, Timer } from "lucide-react";
import type { Meetup, SharedLocation } from "../lib/api";

interface Props {
  meetup: Meetup;
  loc: SharedLocation;
  isSharer: boolean;
  other: string;
}

const WALK_M_PER_MIN = 80;

function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const walkMinutes = (from: { lat: number; lng: number }, to: { lat: number; lng: number }) =>
  Math.max(1, Math.round(distanceM(from, to) / WALK_M_PER_MIN));

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return undefined;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [active]);
  return now;
}

export function MeetupCountdown({ meetup: m, loc, isSharer, other }: Props) {
  const [mine, setMine] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");
  const meetAt = m.meet_at ? new Date(m.meet_at).getTime() : null;
  const acceptedAt = m.accepted_at ? new Date(m.accepted_at).getTime() : null;
  const now = useNow(meetAt !== null);
  const remaining = meetAt === null ? null : Math.max(0, meetAt - now);
  const total = meetAt !== null && acceptedAt !== null ? meetAt - acceptedAt : null;
  const progress = remaining !== null && total ? 1 - remaining / total : 0;
  const mm = remaining === null ? "" : String(Math.floor(remaining / 60000)).padStart(2, "0");
  const ss = remaining === null ? "" : String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");

  const sharedMins = walkMinutes(loc, m);
  const myMins = mine ? walkMinutes(mine, m) : null;
  const nudge = myMins !== null
    ? `You're about ${myMins} min away on foot`
    : isSharer
      ? `You're about ${sharedMins} min away on foot`
      : `${other} is about ${sharedMins} min from the spot`;

  const locate = () => {
    if (!navigator.geolocation) {
      setLocError("Location isn't available in this browser.");
      return;
    }
    setLocating(true);
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMine({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocError("Couldn't read your location. It stays on this device either way.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  };

  return (
    <div className="grid gap-3 rounded-2xl border border-[#2fb8ff]/30 bg-[#2fb8ff]/[0.05] p-4" data-testid="meetup-countdown">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-medium text-white" data-testid="meetup-eta-nudge">
          <Footprints className="h-4 w-4 text-[#2fb8ff]" /> {nudge}
        </p>
        {!mine && (
          <button onClick={locate} disabled={locating} data-testid="meetup-check-distance-btn" className="inline-flex items-center gap-2 text-xs text-zinc-300 underline-offset-4 hover:underline disabled:opacity-50">
            {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
            {isSharer ? "Re-check my distance" : "Check my distance"}
          </button>
        )}
      </div>
      {locError && <p className="text-xs text-rose-300" data-testid="meetup-locate-error">{locError}</p>}

      {remaining !== null && (
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-400">
              {remaining > 0 ? <Timer className="h-3.5 w-3.5" /> : <PartyPopper className="h-3.5 w-3.5 text-[#2fb8ff]" />}
              {remaining > 0 ? "Meet-up window" : "It's time"}
            </span>
            <span className="font-mono text-2xl font-semibold tabular-nums text-white" data-testid="meetup-timer" aria-live="polite">
              {remaining > 0 ? `${mm}:${ss}` : "00:00"}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
            <div className="h-full rounded-full bg-[#2fb8ff] transition-[width] duration-1000 ease-linear" style={{ width: `${Math.min(100, progress * 100)}%` }} />
          </div>
          <p className="text-xs text-zinc-400" data-testid="meetup-timer-hint">
            {remaining > 0 ? `Aim to be at ${m.label} before the timer runs out.` : `Meet-up time — look for ${other} at ${m.label}.`}
          </p>
        </div>
      )}
    </div>
  );
}
