import { cn } from "../lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8", className)} aria-hidden>
      <rect width="32" height="32" rx="9" fill="#D7FF3A" />
      <path d="M21.6 10.2a8.2 8.2 0 1 0 0 11.6" fill="none" stroke="#07080C" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="23" cy="16" r="2.7" fill="#07080C" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-display text-base font-semibold tracking-tight text-[#f4f4f0]">
        Connect<span className="text-[#d7ff3a]">Me</span>
      </span>
    </span>
  );
}
