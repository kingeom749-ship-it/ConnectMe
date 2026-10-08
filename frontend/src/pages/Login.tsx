import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { GoogleButton } from "../components/GoogleButton";
import { PhoneVerify } from "../components/register/PhoneVerify";
import { api } from "../lib/api";
import { useRefresh } from "../lib/queries";
import { useSession } from "../lib/session";

export default function Login() {
  const { addProfile } = useSession();
  const refresh = useRefresh();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  const finish = async (verificationToken: string) => {
    setBusy(true);
    try {
      const res = await api.login(phone, verificationToken);
      addProfile({ id: res.person.id, name: res.person.name, token: res.token, picture: res.person.picture });
      refresh();
      toast.success(`Welcome back, ${res.person.name.split(" ")[0]}`);
      navigate("/directory");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't log you in");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative min-h-screen pt-28 md:pt-36" data-testid="login-page">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 pb-24 md:grid-cols-12 md:px-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="md:col-span-5">
          <p className="eyebrow mb-4">Welcome back</p>
          <h1 className="font-display text-4xl font-bold uppercase leading-[0.95] text-white sm:text-5xl lg:text-6xl">Log in with your number.</h1>
          <p className="mt-5 max-w-md text-zinc-300">
            We'll text a one-time code to the phone you registered with. No passwords, nothing to remember.
          </p>
          <p className="mt-8 text-sm text-zinc-400">
            New here?{" "}
            <Link to="/register" data-testid="login-register-link" className="text-[#ffb086] underline-offset-4 hover:underline">
              Create your profile →
            </Link>
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }} className="md:col-span-7">
          <div className="rounded-[28px] border border-white/10 bg-[#15111d] p-6 sm:p-8">
            <label className="grid gap-2">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">Phone number</span>
              <div className="flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 focus-within:border-[#ffb086]">
                <Smartphone className="h-4 w-4 text-zinc-500" />
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  data-testid="login-phone-input"
                  className="w-full bg-transparent text-white placeholder:text-zinc-500 focus:outline-none"
                />
              </div>
            </label>
            <div className="mt-5">
              <PhoneVerify phone={phone} verified={false} onVerified={(t) => void finish(t)} purpose="login" />
            </div>
            {busy && (
              <p className="mt-4 flex items-center gap-2 text-sm text-zinc-300" data-testid="login-busy">
                <Loader2 className="h-4 w-4 animate-spin" /> Opening your profile…
              </p>
            )}
            <div className="my-8 flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-zinc-500">
              <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
            </div>
            <GoogleButton testId="login-google-signin-btn" className="w-full" />
            <p className="mt-6 flex items-center gap-2 text-xs text-zinc-500">
              <ArrowRight className="h-3.5 w-3.5" /> Logging in on a new device keeps your other devices signed in.
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
