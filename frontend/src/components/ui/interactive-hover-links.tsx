import { useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform, useVelocity } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "../../lib/utils";

export interface HoverLinkItem {
  id: string;
  label: string;
  href: string;
  image: string;
  meta?: ReactNode;
  caption?: string;
}

interface InteractiveHoverLinksProps {
  items: HoverLinkItem[];
  className?: string;
}

export function InteractiveHoverLinks({ items, className }: InteractiveHoverLinksProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 28, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 260, damping: 28, mass: 0.6 });
  const rotate = useTransform(useVelocity(sx), [-1600, 0, 1600], [-12, 0, 12], { clamp: true });

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    x.set(e.clientX - r.left);
    y.set(e.clientY - r.top);
  };

  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={() => setActive(null)} className={cn("relative", className)}>
      <motion.div
        aria-hidden
        style={{ x: sx, y: sy, rotate }}
        className="pointer-events-none absolute left-0 top-0 z-20 hidden md:block"
      >
        <motion.div
          animate={{ scale: active ? 1 : 0.4, opacity: active ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className="relative -translate-x-1/2 -translate-y-1/2 h-64 w-48 overflow-hidden rounded-2xl ring-1 ring-white/20 shadow-[0_30px_80px_-20px_rgba(255,176,134,0.35)] lg:h-80 lg:w-60"
        >
          {items.map((it) => (
            <img
              key={it.id}
              src={it.image}
              alt=""
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-500",
                active === it.id ? "opacity-100 scale-100" : "opacity-0 scale-110"
              )}
            />
          ))}
        </motion.div>
      </motion.div>

      <ul className="relative z-10 border-t border-white/10">
        {items.map((it, i) => (
          <HoverRow key={it.id} item={it} index={i} active={active} onEnter={() => setActive(it.id)} />
        ))}
      </ul>
    </div>
  );
}

interface RowProps {
  item: HoverLinkItem;
  index: number;
  active: string | null;
  onEnter: () => void;
}

function HoverRow({ item, index, active, onEnter }: RowProps) {
  const dim = active !== null && active !== item.id;
  return (
    <li className="border-b border-white/10">
      <Link
        to={item.href}
        onPointerEnter={onEnter}
        onFocus={onEnter}
        data-testid={`hover-link-item-${item.id}`}
        className="group relative flex items-center gap-4 py-6 md:gap-8 md:py-8"
      >
        <span className="font-mono text-xs text-zinc-400 tabular-nums">{String(index + 1).padStart(2, "0")}</span>
        <img src={item.image} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover md:hidden" />
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block font-display text-3xl font-semibold uppercase leading-none tracking-tight transition-[color,transform] duration-500 ease-out sm:text-5xl lg:text-7xl",
              "group-hover:translate-x-3 group-hover:text-[#ffb086] md:group-hover:translate-x-6",
              dim ? "md:text-white/30" : "text-[#f7f2ec]"
            )}
          >
            {item.label}
          </span>
          {item.caption && <span className="mt-2 block text-sm text-zinc-400 md:hidden">{item.caption}</span>}
        </span>
        <span className="hidden text-right text-sm text-zinc-400 md:block">{item.meta}</span>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/15 transition-[background-color,transform,border-color] duration-500 group-hover:rotate-45 group-hover:border-[#ffb086] group-hover:bg-[#ffb086] md:h-14 md:w-14">
          <ArrowUpRight className="h-5 w-5 text-[#f7f2ec] transition-colors group-hover:text-[#0c0a12]" />
        </span>
      </Link>
    </li>
  );
}
