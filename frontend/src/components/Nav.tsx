import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { Wordmark } from "./Logo";
import { ProfileMenu } from "./ProfileMenu";
import { useInbox, useUnreadCount } from "../lib/queries";
import { useSession } from "../lib/session";
import { cn } from "../lib/utils";

const LINKS = [
  { to: "/#interests", label: "Interests", id: "interests" },
  { to: "/directory", label: "Directory", id: "directory" },
  { to: "/requests", label: "Requests", id: "requests" },
  { to: "/messages", label: "Messages", id: "messages" },
];

function PendingBadge() {
  const { inbox } = useInbox();
  const n = inbox.incoming.filter((r) => r.status === "pending").length;
  if (!n) return null;
  return (
    <span data-testid="nav-pending-count" className="ml-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#2fb8ff] px-1 font-mono text-[11px] font-semibold text-[#07080c]">
      {n}
    </span>
  );
}

function UnreadBadge() {
  const n = useUnreadCount();
  if (!n) return null;
  return (
    <span data-testid="nav-unread-count" className="ml-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#2fb8ff] px-1 font-mono text-[11px] font-semibold text-[#07080c]">
      {n}
    </span>
  );
}

export function Nav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { active } = useSession();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-6 md:pt-5">
      <nav className="glass mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/10 py-2 pl-4 pr-2">
        <Link to="/" data-testid="nav-brand-logo" aria-label="ConnectMe home">
          <Wordmark />
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <NavLink
              key={l.id}
              to={l.to}
              data-testid={`nav-${l.id}-btn`}
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-full px-4 py-2 text-sm text-zinc-300 transition-colors hover:text-white",
                  isActive && l.id !== "interests" && "bg-white/10 text-white"
                )
              }
            >
              {l.label}
              {l.id === "requests" && <PendingBadge />}
              {l.id === "messages" && <UnreadBadge />}
            </NavLink>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {active ? (
            <ProfileMenu />
          ) : (
            <Link
              to="/register"
              data-testid="nav-register-btn"
              className="rounded-full bg-[#2fb8ff] px-5 py-2.5 text-sm font-semibold text-[#07080c] transition-transform hover:scale-[1.04] active:scale-95"
            >
              Join
            </Link>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            data-testid="nav-mobile-menu-btn"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="glass mx-auto mt-2 max-w-7xl rounded-3xl border border-white/10 p-3 md:hidden"
          >
            {LINKS.map((l) => (
              <Link
                key={l.id}
                to={l.to}
                onClick={() => setOpen(false)}
                data-testid={`mobile-nav-${l.id}-link`}
                className="flex items-center justify-between rounded-2xl px-4 py-4 font-display text-2xl uppercase text-[#f4f4f0] hover:bg-white/5"
              >
                <span className="flex items-center">
                  {l.label}
                  {l.id === "requests" && <PendingBadge />}
                  {l.id === "messages" && <UnreadBadge />}
                </span>
              </Link>
            ))}
            {!active && (
              <Link to="/register" data-testid="mobile-nav-register-link" className="mt-2 block rounded-2xl bg-[#2fb8ff] px-4 py-4 text-center font-semibold text-[#07080c]">
                Start registration
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
