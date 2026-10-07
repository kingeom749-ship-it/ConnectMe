import { Check } from "lucide-react";
import { DEPARTMENTS, DEPARTMENT_INFO, slug } from "../../lib/data";
import type { Department } from "../../lib/data";
import { cn } from "../../lib/utils";

interface Props {
  value: Department | null;
  onChange: (v: Department) => void;
}

export function StepDepartment({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Department" data-testid="reg-step3-dept-select" className="grid gap-3">
      {DEPARTMENTS.map((d) => {
        const on = value === d;
        const Icon = DEPARTMENT_INFO[d].icon;
        return (
          <button
            key={d}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(d)}
            data-testid={`reg-step3-dept-option-${slug(d)}`}
            className={cn(
              "group flex items-center gap-4 rounded-3xl border p-4 text-left transition-[background-color,border-color,transform] duration-300 hover:translate-x-1 sm:p-5",
              on ? "border-[#d7ff3a] bg-[#d7ff3a]/[0.07]" : "border-white/10 bg-white/[0.02] hover:border-white/30"
            )}
          >
            <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl", on ? "bg-[#d7ff3a] text-[#07080c]" : "bg-white/5 text-[#d7ff3a]")}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="block font-display text-xl font-semibold uppercase text-white">{d}</span>
              <span className="text-sm text-zinc-400">{DEPARTMENT_INFO[d].full}</span>
            </span>
            <span className={cn("grid h-7 w-7 place-items-center rounded-full border", on ? "border-[#d7ff3a] bg-[#d7ff3a] text-[#07080c]" : "border-white/20 text-transparent")}>
              <Check className="h-4 w-4" />
            </span>
          </button>
        );
      })}
    </div>
  );
}
