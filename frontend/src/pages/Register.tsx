import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { StepIdentity } from "../components/register/StepIdentity";
import { StepInterests } from "../components/register/StepInterests";
import { StepDepartment } from "../components/register/StepDepartment";
import { StepConsent } from "../components/register/StepConsent";
import { RegisterDone } from "../components/register/RegisterDone";
import { api } from "../lib/api";
import type { Me } from "../lib/api";
import type { Department, InterestId } from "../lib/data";
import { useSession } from "../lib/session";
import { useRefresh } from "../lib/queries";
import { cn } from "../lib/utils";

const STEPS = [
  { title: "Who are you?", hint: "Your name, and a quick code to prove the number is yours." },
  { title: "What do you love?", hint: "Pick one or more scenes. You can belong to many." },
  { title: "Your department", hint: "So people can find you by course, too." },
  { title: "Location consent", hint: "You're in control. Review and decide." },
];

export default function Register() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [interests, setInterests] = useState<InterestId[]>([]);
  const [department, setDepartment] = useState<Department | null>(null);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<Me | null>(null);
  const [verification, setVerification] = useState<{ phone: string; token: string } | null>(null);
  const verified = verification?.phone === phone;
  const { addProfile } = useSession();
  const refresh = useRefresh();

  const validateIdentity = () => {
    const e: { name?: string; phone?: string } = {};
    if (name.trim().length < 2) e.name = "Please enter your name.";
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) e.phone = "Enter a valid phone number (10–15 digits).";
    setErrors(e);
    return !e.name && !e.phone;
  };

  const canNext = [verified, interests.length > 0, department !== null, true][step];

  const next = async () => {
    if (step === 0 && !validateIdentity()) return;
    if (step < 3) return setStep(step + 1);
    if (!department || !verification) return;
    setSaving(true);
    try {
      const res = await api.register({
        name,
        phone,
        interests,
        department,
        accepts_location_requests: consent,
        verification_token: verification.token,
      });
      addProfile({ id: res.person.id, name: res.person.name, token: res.token });
      setCreated(res.person);
      refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      toast.error(msg);
      if (/phone|verify/i.test(msg)) {
        setErrors({ phone: msg });
        setVerification(null);
        setStep(0);
      }
    } finally {
      setSaving(false);
    }
  };

  if (created) return <RegisterDone person={created} />;

  return (
    <main className="grain relative min-h-screen overflow-hidden pt-28 md:pt-36" data-testid="register-page">
      <div className="pointer-events-none absolute -right-40 top-10 h-[520px] w-[520px] rounded-full bg-[#8b91ff]/10 blur-[140px]" />
      <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-5 pb-24 md:px-8 lg:grid-cols-12">
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-36">
            <p className="eyebrow mb-4">Registration · Step {step + 1} of 4</p>
            <div className="overflow-hidden">
              <motion.h1
                key={step}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="font-display text-4xl font-bold uppercase leading-[0.95] text-white sm:text-5xl"
              >
                {STEPS[step].title}
              </motion.h1>
            </div>
            <p className="mt-4 text-zinc-300">{STEPS[step].hint}</p>
            <ol className="mt-8 hidden gap-2 lg:grid" aria-label="Progress">
              {STEPS.map((s, i) => (
                <li key={s.title} className={cn("flex items-center gap-3 text-sm", i <= step ? "text-white" : "text-zinc-400")}>
                  <span className={cn("grid h-7 w-7 place-items-center rounded-full font-mono text-xs", i < step ? "bg-[#2fb8ff] text-[#07080c]" : i === step ? "border border-[#2fb8ff] text-[#2fb8ff]" : "border border-white/15")}>
                    {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  {s.title}
                </li>
              ))}
            </ol>
          </div>
        </aside>

        <section className="lg:col-span-8">
          <div className="mb-8 flex gap-1.5" aria-hidden>
            {STEPS.map((s, i) => (
              <div key={s.title} className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                <motion.div className="h-full bg-[#2fb8ff]" initial={false} animate={{ width: i <= step ? "100%" : "0%" }} transition={{ duration: 0.6 }} />
              </div>
            ))}
          </div>

          <motion.div key={step} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            {step === 0 && (
              <StepIdentity
                name={name}
                phone={phone}
                onName={setName}
                onPhone={setPhone}
                errors={errors}
                verified={verified}
                onVerified={(token) => setVerification({ phone, token })}
              />
            )}
            {step === 1 && <StepInterests value={interests} onChange={setInterests} />}
            {step === 2 && <StepDepartment value={department} onChange={setDepartment} />}
            {step === 3 && <StepConsent consent={consent} onConsent={setConsent} summary={{ name, phone, interests, department }} />}
          </motion.div>

          <div className="mt-10 flex items-center justify-between gap-3">
            {step > 0 ? (
              <button onClick={() => setStep(step - 1)} data-testid="reg-back-btn" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-4 text-white transition-colors hover:bg-white/5">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            ) : (
              <Link to="/" data-testid="reg-cancel-link" className="px-2 text-sm text-zinc-400 hover:text-white">
                Cancel
              </Link>
            )}
            <button
              onClick={next}
              disabled={!canNext || saving}
              data-testid={step === 3 ? "reg-step4-submit-btn" : `reg-step${step + 1}-next-btn`}
              className="group inline-flex items-center gap-3 rounded-full bg-[#2fb8ff] py-4 pl-7 pr-4 font-semibold text-[#07080c] transition-[transform,opacity] hover:scale-[1.03] active:scale-95 disabled:pointer-events-none disabled:opacity-40"
            >
              {step === 3 ? "Create profile" : "Continue"}
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#07080c] text-[#2fb8ff]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
              </span>
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
