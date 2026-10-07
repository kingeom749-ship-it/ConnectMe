import { Ban, Clock, EyeOff, MapPin, ShieldCheck } from "lucide-react";
import { Switch } from "../Switch";
import { INTEREST_MAP } from "../../lib/data";
import type { Department, InterestId } from "../../lib/data";

interface Props {
  consent: boolean;
  onConsent: (v: boolean) => void;
  summary: { name: string; phone: string; interests: InterestId[]; department: Department | null };
}

const RULES = [
  { icon: Ban, text: "Nobody can locate you from your phone number. Ever." },
  { icon: ShieldCheck, text: "Each request needs your explicit approval, plus your browser's permission prompt." },
  { icon: EyeOff, text: "Only an approximate location (about 1 km) is shared with that one person." },
  { icon: Clock, text: "Shares expire after 60 minutes, and you can revoke them any time." },
];

export function StepConsent({ consent, onConsent, summary }: Props) {
  return (
    <div className="grid gap-5">
      <div className="rounded-3xl border border-[#34d399]/30 bg-[#34d399]/[0.05] p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#34d399]/15">
            <MapPin className="h-5 w-5 text-[#34d399]" />
          </span>
          <div className="flex-1">
            <p id="consent-label" className="font-semibold text-white">Allow people to send me location requests</p>
            <p className="mt-1 text-sm text-zinc-300">Off by default. Turning this on only lets people ask — you still decide every time.</p>
          </div>
          <Switch checked={consent} onChange={onConsent} label="Allow location requests" testId="reg-step4-location-consent-toggle" />
        </div>
        <ul className="mt-5 grid gap-3 border-t border-white/10 pt-5">
          {RULES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3 text-sm text-zinc-300">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#34d399]" />
              {text}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 sm:p-6" data-testid="reg-summary">
        <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">Review</p>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-zinc-400">Name</dt><dd className="text-white">{summary.name}</dd></div>
          <div><dt className="text-zinc-400">Phone</dt><dd className="text-white">{summary.phone}</dd></div>
          <div><dt className="text-zinc-400">Interests</dt><dd className="text-white">{summary.interests.map((i) => INTEREST_MAP[i].label).join(", ")}</dd></div>
          <div><dt className="text-zinc-400">Department</dt><dd className="text-white">{summary.department}</dd></div>
        </dl>
      </div>
    </div>
  );
}
