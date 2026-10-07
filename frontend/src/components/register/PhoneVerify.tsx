import { useEffect, useState } from "react";
import { BadgeCheck, FlaskConical, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api";
import type { OtpSent } from "../../lib/api";

interface Props {
  phone: string;
  verified: boolean;
  onVerified: (token: string) => void;
}

const btn =
  "inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-[transform,opacity] hover:scale-[1.03] active:scale-95 disabled:pointer-events-none disabled:opacity-40";

export function PhoneVerify({ phone, verified, onVerified }: Props) {
  const [sent, setSent] = useState<OtpSent | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");
  const digits = phone.replace(/\D/g, "").length;

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  const send = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await api.sendOtp(phone);
      setSent(res);
      setCode("");
      setCooldown(30);
      toast.success(res.mode === "sms" ? `Code sent to ${res.phone}` : "Demo code generated");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send code");
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await api.verifyOtp(phone, code);
      onVerified(res.verification_token);
      toast.success("Phone number verified");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not verify code");
    } finally {
      setBusy(false);
    }
  };

  if (verified) {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-[#34d399]" data-testid="reg-phone-verified-badge">
        <BadgeCheck className="h-5 w-5" /> Phone number verified
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      {sent?.mode === "demo" && (
        <div className="flex items-start gap-3 rounded-2xl border border-dashed border-[#d7ff3a]/50 bg-[#d7ff3a]/[0.06] p-4" data-testid="reg-otp-demo-banner">
          <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-[#d7ff3a]" />
          <p className="text-sm text-zinc-200">
            <span className="font-semibold text-[#d7ff3a]">Demo mode</span> — SMS isn't connected yet, so your code is shown here:{" "}
            <span className="font-mono text-base font-semibold tracking-[0.3em] text-white" data-testid="reg-otp-demo-code">{sent.demo_code}</span>
          </p>
        </div>
      )}
      {sent && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="group relative flex-1">
            <span className="sr-only">6-digit code</span>
            <KeyRound className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#d7ff3a]" />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit code"
              data-testid="reg-otp-code-input"
              className="h-12 w-full rounded-full border border-white/10 bg-white/[0.03] pl-14 pr-5 font-mono tracking-[0.3em] text-white placeholder:tracking-normal placeholder:text-zinc-500 focus:border-[#d7ff3a] focus:outline-none"
            />
          </label>
          <button onClick={verify} disabled={busy || code.length !== 6} data-testid="reg-otp-verify-btn" className={`${btn} bg-[#d7ff3a] text-[#07080c]`}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Verify
          </button>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={send}
          disabled={busy || digits < 10 || cooldown > 0}
          data-testid="reg-otp-send-btn"
          className={sent ? "text-sm text-zinc-300 underline-offset-4 hover:underline disabled:opacity-50" : `${btn} bg-white text-[#07080c]`}
        >
          {busy && !sent && <Loader2 className="h-4 w-4 animate-spin" />}
          {sent ? (cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code") : "Send verification code"}
        </button>
        {!sent && <span className="text-xs text-zinc-400">10-digit numbers default to +91.</span>}
      </div>
      {error && (
        <p className="text-sm text-rose-300" role="alert" data-testid="reg-otp-error">
          {error}
        </p>
      )}
    </div>
  );
}
