import { useState } from "react";
import { Loader2, LocateFixed, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "./Modal";
import { api } from "../lib/api";
import type { LocationRequest } from "../lib/api";
import { useSession } from "../lib/session";
import { useRefresh } from "../lib/queries";

interface Props {
  request: LocationRequest | null;
  onClose: () => void;
}

const GEO_ERRORS: Record<number, string> = {
  1: "You blocked location access in your browser, so nothing was shared.",
  2: "Your device couldn't determine a location. Nothing was shared.",
  3: "Getting your location took too long. Nothing was shared.",
};

export function ShareConsentModal({ request, onClose }: Props) {
  const { active } = useSession();
  const [busy, setBusy] = useState(false);
  const refresh = useRefresh();
  const who = request?.counterpart?.name ?? "this person";

  const share = () => {
    if (!active || !request) return;
    if (!("geolocation" in navigator)) {
      toast.error("This browser doesn't support location sharing.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await api.respond(active.token, request.id, { accept: true, lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
          toast.success(`Sharing your approximate location with ${who} for 60 minutes.`);
          refresh();
          onClose();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Could not share location");
        } finally {
          setBusy(false);
        }
      },
      (err) => {
        setBusy(false);
        toast.error(GEO_ERRORS[err.code] ?? "Location unavailable. Nothing was shared.");
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
    );
  };

  return (
    <Modal open={Boolean(request)} onClose={onClose} title="Share location" testId="share-consent-modal">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#34d399]/15">
        <LocateFixed className="h-5 w-5 text-[#34d399]" />
      </span>
      <h2 className="mt-5 pr-10 font-display text-2xl font-semibold uppercase leading-tight text-white">Share your location with {who}?</h2>
      <p className="mt-3 text-sm text-zinc-300">
        Your browser will now ask for permission. If you allow it, ConnectMe rounds your position to about 1 km and shows it only to {who}.
      </p>
      <ul className="mt-5 grid gap-2 text-sm text-zinc-300">
        <li className="flex gap-3"><ShieldCheck className="h-4 w-4 shrink-0 text-[#34d399]" /> One-time snapshot — not continuous tracking.</li>
        <li className="flex gap-3"><ShieldCheck className="h-4 w-4 shrink-0 text-[#34d399]" /> Expires automatically after 60 minutes.</li>
        <li className="flex gap-3"><ShieldCheck className="h-4 w-4 shrink-0 text-[#34d399]" /> Revoke any time from this page.</li>
      </ul>
      <div className="mt-7 flex flex-col gap-2 sm:flex-row">
        <button
          onClick={share}
          disabled={busy}
          data-testid="share-consent-confirm-btn"
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#34d399] py-4 font-semibold text-[#07080c] transition-transform hover:scale-[1.02] disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />} Allow & share once
        </button>
        <button onClick={onClose} data-testid="share-consent-cancel-btn" className="flex-1 rounded-full border border-white/15 py-4 text-white hover:bg-white/5">
          Not now
        </button>
      </div>
    </Modal>
  );
}
