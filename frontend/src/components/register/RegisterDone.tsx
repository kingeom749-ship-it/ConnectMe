import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Bell, Check } from "lucide-react";
import { Avatar } from "../Avatar";
import { INTEREST_MAP } from "../../lib/data";
import type { Me } from "../../lib/api";

export function RegisterDone({ person }: { person: Me }) {
  return (
    <main className="grain relative grid min-h-screen place-items-center overflow-hidden px-5 pt-28" data-testid="register-done">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d7ff3a]/10 blur-[140px]" />
      <motion.div
        initial={{ opacity: 0, y: 40, rotateX: 20 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformPerspective: 1000 }}
        className="relative z-10 w-full max-w-xl text-center"
      >
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.3 }}
          className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#d7ff3a] text-[#07080c]"
        >
          <Check className="h-8 w-8" />
        </motion.span>
        <h1 className="mt-8 font-display text-4xl font-bold uppercase leading-[0.95] text-white sm:text-5xl">You're in.</h1>
        <div className="mx-auto mt-8 flex max-w-sm items-center gap-4 rounded-3xl border border-white/10 bg-[#0e1016] p-4 text-left">
          <Avatar name={person.name} seed={person.id} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-white" data-testid="register-done-name">{person.name}</p>
            <p className="text-sm text-zinc-400">
              {person.department} · {person.interests.map((i) => INTEREST_MAP[i]?.label ?? i).join(", ")}
            </p>
          </div>
        </div>
        {person.accepts_location_requests && (
          <p className="mx-auto mt-6 flex max-w-sm items-center justify-center gap-2 text-sm text-zinc-300">
            <Bell className="h-4 w-4 text-[#d7ff3a]" /> A demo location request is waiting in your inbox.
          </p>
        )}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/directory" data-testid="register-done-directory-btn" className="inline-flex items-center gap-2 rounded-full bg-[#d7ff3a] px-7 py-4 font-semibold text-[#07080c] transition-transform hover:scale-[1.03]">
            Open directory <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/requests" data-testid="register-done-requests-btn" className="rounded-full border border-white/15 px-7 py-4 text-white hover:bg-white/5">
            View requests
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
