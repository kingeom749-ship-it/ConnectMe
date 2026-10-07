import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, LogOut, UserPlus } from "lucide-react";
import { Avatar } from "./Avatar";
import { useSession } from "../lib/session";

export function ProfileMenu() {
  const { profiles, active, switchTo, forget } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (!active) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        data-testid="nav-profile-menu-btn"
        className="flex items-center gap-2 rounded-full border border-white/10 py-1 pl-1 pr-3 text-sm text-white transition-colors hover:bg-white/10"
      >
        <Avatar name={active.name} seed={active.id} className="h-8 w-8 rounded-full text-[10px]" />
        <span className="hidden max-w-[8rem] truncate sm:block">{active.name}</span>
        <ChevronDown className="h-4 w-4 text-zinc-400" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            className="absolute right-0 mt-3 w-72 rounded-3xl border border-white/10 bg-[#0e1016] p-2 shadow-2xl"
            data-testid="profile-menu"
          >
            <p className="px-3 pb-2 pt-2 font-mono text-[11px] uppercase tracking-widest text-zinc-400">Profiles on this device</p>
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  switchTo(p.id);
                  setOpen(false);
                }}
                data-testid={`profile-switch-${p.id}`}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm text-white hover:bg-white/5"
              >
                <Avatar name={p.name} seed={p.id} className="h-8 w-8 rounded-full text-[10px]" />
                <span className="flex-1 truncate">{p.name}</span>
                {p.id === active.id && <Check className="h-4 w-4 text-[#2fb8ff]" />}
              </button>
            ))}
            <div className="my-2 h-px bg-white/10" />
            <Link
              to="/register"
              onClick={() => setOpen(false)}
              data-testid="profile-register-another-link"
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-zinc-200 hover:bg-white/5"
            >
              <UserPlus className="h-4 w-4" /> Register another person
            </Link>
            <button
              onClick={() => {
                forget(active.id);
                setOpen(false);
              }}
              data-testid="profile-forget-btn"
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm text-zinc-200 hover:bg-white/5"
            >
              <LogOut className="h-4 w-4" /> Remove {active.name.split(" ")[0]} from this device
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
