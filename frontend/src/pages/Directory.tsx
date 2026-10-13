import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, Users } from "lucide-react";
import { MaskLines } from "../components/Reveal";
import { DirectoryFilters } from "../components/DirectoryFilters";
import { MemberCard } from "../components/MemberCard";
import { AuroraBackground } from "../components/AuroraBackground";
import { RequestLocationModal } from "../components/RequestLocationModal";
import { BlockReportModal } from "../components/BlockReportModal";
import { Footer } from "../components/Closing";
import { DEPARTMENTS, DEPARTMENT_INFO, INTEREST_MAP } from "../lib/data";
import type { InterestId } from "../lib/data";
import type { Person, RequestStatus } from "../lib/api";
import { useInbox, usePeople } from "../lib/queries";
import { useSession } from "../lib/session";

export default function Directory() {
  const [params, setParams] = useSearchParams();
  const interest = params.get("interest") ?? "";
  const department = params.get("department") ?? "";
  const [q, setQ] = useState(params.get("q") ?? "");
  const [debounced, setDebounced] = useState(q);
  const [view, setView] = useState<"grid" | "grouped">("grid");
  const [target, setTarget] = useState<Person | null>(null);
  const [blocking, setBlocking] = useState<Person | null>(null);
  const { active } = useSession();
  const { inbox } = useInbox();
  const closeModal = useCallback(() => setTarget(null), []);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(q), 250);
    return () => window.clearTimeout(t);
  }, [q]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const { data, isLoading, isError } = usePeople({ q: debounced, interest, department });
  const people = Array.isArray(data) ? data : [];

  const statusFor = useMemo(() => {
    const map = new Map<string, RequestStatus>();
    inbox.outgoing.forEach((r) => {
      if (r.counterpart && (r.status === "pending" || r.status === "shared") && !map.has(r.counterpart.id)) map.set(r.counterpart.id, r.status);
    });
    return map;
  }, [inbox.outgoing]);

  const card = (p: Person, i: number) => (
    <MemberCard key={p.id} person={p} index={i} isSelf={p.id === active?.id} requestStatus={statusFor.get(p.id) ?? null} canMessage={Boolean(active)} onRequest={setTarget} onBlock={setBlocking} />
  );

  const title = interest ? INTEREST_MAP[interest as InterestId]?.label ?? "Directory" : "Directory";

  return (
    <main className="relative min-h-screen overflow-x-clip pt-28 md:pt-36" data-testid="directory-page">
      <AuroraBackground />
      <div className="relative z-[1] mx-auto max-w-7xl px-5 pb-24 md:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow mb-4">The people</p>
            <h1 key={title} className="font-display text-4xl font-bold uppercase leading-[0.95] text-white sm:text-6xl">
              <MaskLines lines={[title === "Directory" ? "The directory" : `${title} people`]} />
            </h1>
          </div>
          <p className="flex items-center gap-2 font-mono text-sm text-zinc-300" data-testid="directory-result-count">
            <Users className="h-4 w-4 text-[#ffb086]" /> {people.length} {people.length === 1 ? "person" : "people"}
            {department && ` · ${department}`}
          </p>
        </div>

        <DirectoryFilters
          q={q}
          interest={interest}
          department={department}
          view={view}
          onQ={setQ}
          onInterest={(v) => setParam("interest", v)}
          onDepartment={(v) => setParam("department", v)}
          onView={setView}
        />

        <div className="mt-10">
          {isLoading && (
            <p className="flex items-center gap-2 text-zinc-300"><Loader2 className="h-4 w-4 animate-spin" /> Loading people…</p>
          )}
          {isError && <p className="text-zinc-300" data-testid="directory-error">The directory is unavailable right now. Please try again shortly.</p>}
          {!isLoading && !isError && people.length === 0 && (
            <div className="rounded-[28px] border border-dashed border-white/15 p-10 text-center" data-testid="directory-empty">
              <p className="font-display text-xl uppercase text-white">No one here yet</p>
              <p className="mt-2 text-sm text-zinc-400">Try another scene or department — or clear your search.</p>
            </div>
          )}
          {view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{people.map(card)}</div>
          ) : (
            <div className="grid gap-14">
              {DEPARTMENTS.filter((d) => !department || d === department).map((d) => {
                const group = people.filter((p) => p.department === d);
                if (!group.length) return null;
                return (
                  <section key={d} data-testid={`directory-group-${d}`}>
                    <div className="mb-5 flex items-baseline gap-4 border-b border-white/10 pb-4">
                      <h2 className="font-display text-2xl font-semibold uppercase text-white">{d}</h2>
                      <span className="text-sm text-zinc-400">{DEPARTMENT_INFO[d].full} · {group.length}</span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{group.map(card)}</div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
      <RequestLocationModal target={target} onClose={closeModal} />
      <BlockReportModal person={blocking} onClose={() => setBlocking(null)} />
    </main>
  );
}
