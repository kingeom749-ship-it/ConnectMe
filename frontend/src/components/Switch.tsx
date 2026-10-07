import { motion } from "motion/react";
import { cn } from "../lib/utils";

interface SwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  testId: string;
}

export function Switch({ checked, onChange, label, testId }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      data-testid={testId}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors duration-300",
        checked ? "border-[#34d399] bg-[#34d399]" : "border-white/20 bg-white/10"
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className={cn("h-6 w-6 rounded-full shadow", checked ? "ml-7 bg-[#07080c]" : "ml-1 bg-white")}
      />
    </button>
  );
}
