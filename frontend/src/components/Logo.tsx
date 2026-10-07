import { cn } from "../lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return <img src="/logo-mark.png" alt="" className={cn("h-9 w-9 select-none drop-shadow-[0_0_14px_rgba(47,184,255,0.45)]", className)} aria-hidden draggable={false} />;
}

export function Wordmark({ className, tagline = false }: { className?: string; tagline?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)} data-testid="brand-wordmark">
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-bold tracking-tight text-[#f7f2ec]">
          Connect<span className="bg-gradient-to-r from-[#2fb8ff] to-[#1e63ff] bg-clip-text text-transparent">Me</span>
        </span>
        {tagline && (
          <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.28em] text-zinc-400">
            Find People <span className="text-[#ffb086]">•</span> Build Connections
          </span>
        )}
      </span>
    </span>
  );
}
