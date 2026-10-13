import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Ban, CalendarDays, Loader2, MapPin, MapPinOff, MessageCircle, Pencil, Phone } from "lucide-react";
import { Avatar } from "../components/Avatar";
import { AuroraBackground } from "../components/AuroraBackground";
import { BlockReportModal } from "../components/BlockReportModal";
import { RequestButton } from "../components/MemberCard";
import { RequestLocationModal } from "../components/RequestLocationModal";
import { Footer } from "../components/Closing";
import type { Person, RequestStatus } from "../lib/api";
import { INTEREST_MAP } from "../lib/data";
import type { InterestId } from "../lib/data";
import { useInbox, usePerson } from "../lib/queries";
import { useSession } from "../lib/session";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function PublicProfile() {
  const { personId } = useParams<{ personId: string }>();
  const { active } = useSession();
  const { inbox } = useInbox();
  const person = usePerson(personId);
  const [target, setTarget] = useState<Person | null>(null);
  const [blocking, setBlocking] = useState<Person | null>(null);

  const requestStatus = useMemo<RequestStatus | null>(() => {
    const r = inbox.outgoing.find((x) => x.counterpart?.id === personId && (x.status === "pending" || x.status === "shared"));
    return r?.status ?? null;
  }, [inbox.outgoing, personId]);

  const p = person.data;
  const isSelf = Boolean(active && p && active.id === p.id);
  const joined = p ? new Date(p.created_at).toLocaleDateString([], { month: "long", year: "numeric" }) : "";

  return (
    <main className="relative min-h-screen pt-28 md:pt-36" data-testid="public-profile-page">
      <AuroraBackground />
      <div className="relative z-[1] mx-auto max-w-6xl px-5 pb-24 md:px-8">
        <Link to="/directory" data-testid="profile-back-link" className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to directory
        </Link>

        {person.isLoading && <p className="mt-10 flex items-center gap-2 text-zinc-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading profile…</p>}
        {person.error && (
          <div className="mt-10 rounded-3xl border border-white/10 p-8" data-testid="profile-not-found">
            <h1 className="font-display text-2xl font-bold uppercase text-white">Profile not found</h1>
            <p className="mt-2 text-zinc-400">{person.error.message}</p>
          </div>
        )}

        {p && (
          <div className="mt-8 grid gap-10 md:grid-cols-12">
            <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }} className="md:col-span-5">
              <div className="rounded-[32px] border border-white/10 bg-[#15111d]/80 p-6 backdrop-blur-xl sm:p-8">
                <Avatar name={p.name} seed={p.id} src={p.picture} className="h-36 w-36 rounded-[36px] text-4xl sm:h-44 sm:w-44" />
                <h1 className="mt-6 font-display text-3xl font-bold uppercase leading-[1] text-white sm:text-4xl" data-testid="public-profile-name">{p.name}</h1>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/15 px-3 py-1 font-display text-[11px] uppercase text-white" data-testid="public-profile-department">{p.department}</span>
                  <span className="flex items-center gap-1.5 font-mono text-xs text-zinc-400" data-testid="public-profile-phone"><Phone className="h-3 w-3" /> {p.phone_masked}</span>
                </div>
                <p className="mt-3 flex items-center gap-1.5 font-mono text-xs text-zinc-500"><CalendarDays className="h-3 w-3" /> Member since {joined}</p>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-zinc-400" data-testid="public-profile-consent">
                  {p.accepts_location_requests ? <MapPin className="h-3.5 w-3.5 text-[#34d399]" /> : <MapPinOff className="h-3.5 w-3.5" />}
                  {p.accepts_location_requests ? "Open to location requests" : "Not accepting location requests"}
                </p>

                {isSelf ? (
                  <Link to="/profile" data-testid="public-profile-edit-link" className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-semibold text-[#0c0a12] transition-transform hover:scale-[1.02]">
                    <Pencil className="h-4 w-4" /> Edit my profile
                  </Link>
                ) : (
                  <>
                    <RequestButton person={p} isSelf={false} requestStatus={requestStatus} onRequest={setTarget} />
                    <div className="mt-2 flex gap-2">
                      <Link
                        to={active ? `/messages/${p.id}` : "/login"}
                        data-testid="public-profile-message-btn"
                        className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/10 py-3 text-sm font-medium text-zinc-100 transition-colors hover:border-[#ffb086]/60 hover:bg-[#ffb086]/10"
                      >
                        <MessageCircle className="h-4 w-4 text-[#ffb086]" /> Message privately
                      </Link>
                      {active && (
                        <button onClick={() => setBlocking(p)} aria-label={`Block ${p.name}`} data-testid="public-profile-block-btn" className="grid w-12 place-items-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:border-rose-300/60 hover:text-rose-300">
                          <Ban className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {!active && <p className="mt-3 text-center text-xs text-zinc-500">Log in or register to message or request a location.</p>}
                  </>
                )}
              </div>
            </motion.section>

            <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: EASE }} className="md:col-span-7">
              <p className="eyebrow mb-3">About</p>
              <p className="text-lg leading-relaxed text-zinc-200 sm:text-xl" data-testid="public-profile-bio">
                {p.bio || <span className="text-zinc-500">{p.name.split(" ")[0]} hasn't written a bio yet.</span>}
              </p>

              <p className="eyebrow mb-4 mt-12">Scenes · {p.interests.length}</p>
              <div className="grid gap-3 sm:grid-cols-2" data-testid="public-profile-interests">
                {p.interests.map((id, i) => {
                  const it = INTEREST_MAP[id as InterestId];
                  if (!it) return null;
                  const Icon = it.icon;
                  return (
                    <motion.div key={id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05, duration: 0.5, ease: EASE }}>
                      <Link to={`/directory?interest=${id}`} data-testid={`public-profile-interest-${id}`} className="group relative flex h-28 items-end overflow-hidden rounded-3xl ring-1 ring-white/10 transition-shadow hover:shadow-[0_20px_50px_-20px_rgba(255,176,134,0.5)]">
                        <img src={it.image} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                        <span className="relative flex items-center gap-2 p-4 font-display text-sm font-semibold uppercase text-white">
                          <Icon className="h-4 w-4 text-[#ffb086]" /> {it.label}
                        </span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          </div>
        )}
      </div>
      <Footer />
      <RequestLocationModal target={target} onClose={() => setTarget(null)} />
      <BlockReportModal person={blocking} onClose={() => setBlocking(null)} />
    </main>
  );
}
