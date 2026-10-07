import { cn } from "../lib/utils";

function hue(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

export function Avatar({ name, seed, className, src }: { name: string; seed: string; className?: string; src?: string }) {
  const h = hue(seed);
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  if (src) {
    return <img src={src} alt="" aria-hidden referrerPolicy="no-referrer" className={cn("h-12 w-12 shrink-0 rounded-2xl object-cover", className)} />;
  }
  return (
    <span
      aria-hidden
      className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-display text-sm font-semibold text-[#0c0a12]", className)}
      style={{ background: `linear-gradient(135deg, hsl(${h} 90% 72%), hsl(${(h + 60) % 360} 85% 62%))` }}
    >
      {initials}
    </span>
  );
}
