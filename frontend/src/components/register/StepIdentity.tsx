import { Phone, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { PhoneVerify } from "./PhoneVerify";

interface Props {
  name: string;
  phone: string;
  onName: (v: string) => void;
  onPhone: (v: string) => void;
  errors: { name?: string; phone?: string };
  verified: boolean;
  onVerified: (token: string) => void;
}

function Field({ id, label, icon, error, children }: { id: string; label: string; icon: ReactNode; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-mono text-xs uppercase tracking-widest text-zinc-400">
        {label}
      </label>
      <div className="group relative">
        <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#d7ff3a]">{icon}</span>
        {children}
      </div>
      {error && (
        <p className="mt-2 text-sm text-rose-300" role="alert" data-testid={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls =
  "h-16 w-full rounded-2xl border border-white/10 bg-white/[0.03] pl-14 pr-5 text-lg text-white placeholder:text-zinc-500 transition-colors focus:border-[#d7ff3a] focus:bg-white/[0.05] focus:outline-none";

export function StepIdentity({ name, phone, onName, onPhone, errors, verified, onVerified }: Props) {
  return (
    <div className="grid gap-6">
      <Field id="reg-name" label="Full name" icon={<UserRound className="h-5 w-5" />} error={errors.name}>
        <input
          id="reg-name"
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder="e.g. Priya Raman"
          autoComplete="name"
          maxLength={60}
          aria-invalid={Boolean(errors.name)}
          data-testid="reg-step1-name-input"
          className={inputCls}
        />
      </Field>
      <Field id="reg-phone" label="Phone number" icon={<Phone className="h-5 w-5" />} error={errors.phone}>
        <input
          id="reg-phone"
          value={phone}
          onChange={(e) => onPhone(e.target.value)}
          placeholder="+91 98765 43210"
          inputMode="tel"
          autoComplete="tel"
          maxLength={20}
          aria-invalid={Boolean(errors.phone)}
          data-testid="reg-step1-phone-input"
          className={inputCls}
        />
      </Field>
      <PhoneVerify key={phone} phone={phone} verified={verified} onVerified={onVerified} />
      <p className="text-sm text-zinc-400">
        We text a one-time code so only the real owner can register a number. It's masked in the directory and never used for location.
      </p>
    </div>
  );
}
