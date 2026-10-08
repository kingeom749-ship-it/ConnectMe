import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Ban, Check, Clock, MapPin, MapPinOff, MessageCircle, Phone } from "lucide-react";
import { Avatar } from "./Avatar";
import { TiltCard } from "./TiltCard";
import { INTEREST_MAP } from "../lib/data";
import type { Person, RequestStatus } from "../lib/api";
import { cn } from "../lib/utils";

interface Props {
  person: Person;
  index: number;
  isSelf: boolean;
  requestStatus: RequestStatus | null;
  canMessage: boolean;
  onRequest: (p: Person) => void;
  onBlock: (p: Person) => void;
}

function RequestButton({ person, isSelf, requestStatus, onRequest }: Omit<Props, "index" | "canMessage" | "onBlock">) {
  const base = "mt-6 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition-[background-color,transform,color] duration-300";
  if (isSelf) return <span className={cn(base, "border border-white/10 text-zinc-400")}>This is you</span>;
  if (!person.accepts_location_requests)
    return (
      <span className={cn(base, "border border-white/10 text-zinc-400")} data-testid="member-card-not-accepting">
        <MapPinOff className="h-4 w-4" /> Not accepting requests
      </span>
    );
  if (requestStatus === "pending")
    return (
      <span className={cn(base, "border border-[#ffb086]/40 text-[#ffb086]")} data-testid="member-card-request-pending">
        <Clock className="h-4 w-4" /> Request pending
      </span>
    );
  if (requestStatus === "shared")
    return (
      <span className={cn(base, "bg-[#34d399]/15 text-[#34d399]")} data-testid="member-card-request-shared">
        <Check className="h-4 w-4" /> Sharing with you
      </span>
    );
  return (
    <button onClick={() => onRequest(person)} data-testid="member-card-request-location-btn" className={cn(base, "bg-white text-[#0c0a12] hover:scale-[1.02] hover:bg-[#ffb086]")}>
      <MapPin className="h-4 w-4" /> Request location
    </button>
  );
}

export function MemberCard(props: Props) {
  const { person, index } = props;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index, 8) * 0.04, ease: [0.22, 1, 0.36, 1] }}
    >
      <TiltCard max={5} className="h-full">
        <article data-testid={`member-card-${person.id}`} className="flex h-full flex-col rounded-[28px] border border-white/10 bg-[#15111d] p-5 transition-colors hover:border-white/25 sm:p-6">
          <div className="flex items-start gap-4">
            <Avatar name={person.name} seed={person.id} src={person.picture} />
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-white">{person.name}</h3>
              <p className="mt-0.5 flex items-center gap-1.5 font-mono text-xs text-zinc-400">
                <Phone className="h-3 w-3" /> {person.phone_masked}
              </p>
            </div>
            <span className="rounded-full border border-white/15 px-3 py-1 font-display text-[11px] uppercase text-white">{person.department}</span>
          </div>
          {person.bio && <p className="mt-4 line-clamp-2 text-sm text-zinc-300" data-testid="member-card-bio">{person.bio}</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            {person.interests.map((i) => {
              const it = INTEREST_MAP[i];
              if (!it) return null;
              const Icon = it.icon;
              return (
                <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs text-zinc-200">
                  <Icon className="h-3.5 w-3.5 text-[#ffb086]" /> {it.label}
                </span>
              );
            })}
          </div>
          <div className="mt-auto">
            <RequestButton {...props} />
            {!props.isSelf && (
              <div className="mt-2 flex gap-2">
                <Link
                  to={props.canMessage ? `/messages/${person.id}` : "/register"}
                  data-testid="member-card-message-btn"
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/10 py-3 text-sm font-medium text-zinc-100 transition-colors hover:border-[#ffb086]/60 hover:bg-[#ffb086]/10 hover:text-white"
                >
                  <MessageCircle className="h-4 w-4 text-[#ffb086]" /> Message privately
                </Link>
                {props.canMessage && (
                  <button onClick={() => props.onBlock(person)} aria-label={`Block ${person.name}`} data-testid="member-card-block-btn" className="grid w-12 shrink-0 place-items-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:border-rose-300/60 hover:text-rose-300">
                    <Ban className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </article>
      </TiltCard>
    </motion.div>
  );
}
