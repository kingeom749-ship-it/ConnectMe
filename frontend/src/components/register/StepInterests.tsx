import { Check } from "lucide-react";
import { motion } from "motion/react";
import { TiltCard } from "../TiltCard";
import { INTERESTS } from "../../lib/data";
import type { InterestId } from "../../lib/data";
import { cn } from "../../lib/utils";

interface Props {
  value: InterestId[];
  onChange: (v: InterestId[]) => void;
}

export function StepInterests({ value, onChange }: Props) {
  const toggle = (id: InterestId) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {INTERESTS.map((it, i) => {
        const on = value.includes(it.id);
        const Icon = it.icon;
        return (
          <motion.div
            key={it.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, ease: [0.22, 1, 0.36, 1], duration: 0.6 }}
          >
            <TiltCard max={8}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => toggle(it.id)}
                data-testid={`reg-step2-interest-card-${it.id}`}
                className={cn(
                  "group relative block aspect-[3/4] w-full overflow-hidden rounded-3xl text-left ring-2 transition-[box-shadow] duration-300",
                  on ? "ring-[#ffb086] shadow-[0_20px_60px_-20px_rgba(255,176,134,0.6)]" : "ring-white/10"
                )}
              >
                <img
                  src={it.image}
                  alt={it.label}
                  className={cn("absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110", !on && "grayscale-[35%]")}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                {it.trending && (
                  <span className="absolute left-3 top-3 rounded-full bg-[#ffb086] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#0c0a12]" data-testid={`reg-step2-trending-${it.id}`}>
                    Trending
                  </span>
                )}
                <span
                  className={cn(
                    "absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border transition-colors",
                    on ? "border-[#ffb086] bg-[#ffb086] text-[#0c0a12]" : "border-white/40 bg-black/30 text-transparent"
                  )}
                >
                  <Check className="h-4 w-4" />
                </span>
                <span className="absolute inset-x-0 bottom-0 p-4">
                  <Icon className="mb-2 h-5 w-5 text-[#ffb086]" />
                  <span className="block font-display text-lg font-semibold uppercase text-white">{it.label}</span>
                  <span className="mt-1 block text-xs text-zinc-300">{it.tagline}</span>
                </span>
              </button>
            </TiltCard>
          </motion.div>
        );
      })}
    </div>
  );
}
