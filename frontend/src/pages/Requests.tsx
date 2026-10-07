import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { Inbox as InboxIcon, Loader2, Send, ShieldCheck } from "lucide-react";
import { MaskLines } from "../components/Reveal";
import { RequestCard } from "../components/RequestCard";
import { ShareConsentModal } from "../components/ShareConsentModal";
import { Footer } from "../components/Closing";
import type { LocationRequest } from "../lib/api";
import { useInbox } from "../lib/queries";
import { useSession } from "../lib/session";
import { cn } from "../lib/utils";

export default function Requests() {
  const { active } = useSession();
  const { inbox, loading, error } = useInbox();
  const [tab, setTab] = useState<"incoming" | "outgoing">("incoming");
  const [sharing, setSharing] = useState<LocationRequest | null>(null);
  const closeShare = useCallback(() => setSharing(null), []);

  if (!active) {
    return (
      <main className="grid min-h-screen place-items-center px-5 pt-28" data-testid="requests-page">
        <div className="max-w-md text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-[#34d399]" />
          <h1 className="mt-6 font-display text-3xl font-bold uppercase text-white">Your requests live here</h1>
          <p className="mt-3 text-zinc-300">Register to send location requests and to approve or decline the ones you receive.</p>
          <Link to="/register" data-testid="requests-register-link" className="mt-8 inline-flex rounded-full bg-[#d7ff3a] px-7 py-4 font-semibold text-[#07080c]">
            Start registration
          </Link>
        </div>
      </main>
    );
  }

  const list = tab === "incoming" ? inbox.incoming : inbox.outgoing;
  const activeShares = inbox.incoming.filter((r) => r.status === "shared").length;
  const tabs = [
    { id: "incoming" as const, label: "Incoming", icon: InboxIcon, count: inbox.incoming.filter((r) => r.status === "pending").length },
    { id: "outgoing" as const, label: "Sent", icon: Send, count: inbox.outgoing.length },
  ];

  return (
    <main className="relative min-h-screen pt-28 md:pt-36" data-testid="requests-page">
      <div className="mx-auto max-w-4xl px-5 pb-24 md:px-8">
        <p className="eyebrow mb-4">Signed in as {active.name}</p>
        <h1 className="font-display text-4xl font-bold uppercase leading-[0.95] text-white sm:text-6xl">
          <MaskLines lines={["Location", "requests"]} />
        </h1>
        <div className="mt-8 flex items-start gap-3 rounded-3xl border border-[#34d399]/30 bg-[#34d399]/[0.05] p-5" data-testid="sharing-status-panel">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#34d399]" />
          <p className="text-sm text-zinc-200">
            {activeShares
              ? `You're sharing an approximate location with ${activeShares} ${activeShares === 1 ? "person" : "people"}. Revoke any share below.`
              : "You're not sharing your location with anyone. Nothing is shared without your approval."}
          </p>
        </div>

        <div className="mt-10 flex gap-2" role="tablist">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              data-testid={`requests-tab-${id}`}
              className={cn("flex items-center gap-2 rounded-full px-5 py-3 text-sm transition-colors", tab === id ? "bg-white text-[#07080c]" : "border border-white/10 text-zinc-200 hover:border-white/30")}
            >
              <Icon className="h-4 w-4" /> {label}
              {count > 0 && <span className="rounded-full bg-[#d7ff3a] px-2 font-mono text-[11px] text-[#07080c]">{count}</span>}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4">
          {loading && <p className="flex items-center gap-2 text-zinc-300"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>}
          {error && <p className="text-zinc-300" data-testid="requests-error">{error.message}</p>}
          {!loading && !error && list.length === 0 && (
            <div className="rounded-[28px] border border-dashed border-white/15 p-10 text-center" data-testid="requests-empty">
              <p className="text-zinc-300">{tab === "incoming" ? "No one has asked for your location." : "You haven't sent any requests yet."}</p>
              {tab === "outgoing" && (
                <Link to="/directory" data-testid="requests-browse-link" className="mt-4 inline-block text-[#d7ff3a] hover:underline">Browse the directory →</Link>
              )}
            </div>
          )}
          {list.map((r) => (
            <RequestCard key={r.id} request={r} direction={tab} onShare={setSharing} />
          ))}
        </div>
      </div>
      <Footer />
      <ShareConsentModal request={sharing} onClose={closeShare} />
    </main>
  );
}
