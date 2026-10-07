import type { ReactNode } from "react";
import { Check, MapPin, Phone, ShieldCheck, UserRound, X } from "lucide-react";
import { Reveal } from "./Reveal";
import { DEPARTMENTS } from "../lib/data";
import { cn } from "../lib/utils";

function Tile({ children, className, delay = 0, testId }: { children: ReactNode; className?: string; delay?: number; testId: string }) {
  return (
    <Reveal delay={delay} className={cn("h-full", className)}>
      <div data-testid={testId} className="relative flex h-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0e1016] p-6 sm:p-8">
        {children}
      </div>
    </Reveal>
  );
}

function StepChip({ n, label, done }: { n: number; label: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <span className={cn("grid h-7 w-7 place-items-center rounded-full font-mono text-xs", done ? "bg-[#2fb8ff] text-[#07080c]" : "border border-white/20 text-zinc-300")}>
        {done ? <Check className="h-3.5 w-3.5" /> : n}
      </span>
      <span className="text-sm text-zinc-200">{label}</span>
    </div>
  );
}

function MockRequest() {
  return (
    <div className="mt-auto rounded-2xl border border-white/10 bg-[#161922] p-5">
      <div className="flex items-center gap-3">
        <span className="relative grid h-10 w-10 place-items-center rounded-full bg-[#34d399]/15">
          <span className="pulse-ring absolute inset-0 rounded-full border border-[#34d399]" />
          <MapPin className="h-4 w-4 text-[#34d399]" />
        </span>
        <div>
          <p className="text-sm font-semibold text-white">Diya asks for your approximate location</p>
          <p className="text-xs text-zinc-400">Rounded to ~1 km · expires after 60 min</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <span className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#34d399] py-2.5 text-sm font-semibold text-[#07080c]">
          <Check className="h-4 w-4" /> Share
        </span>
        <span className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 py-2.5 text-sm text-white">
          <X className="h-4 w-4" /> Decline
        </span>
      </div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32" data-testid="how-it-works-section">
      <Reveal className="mb-12 max-w-2xl">
        <p className="eyebrow mb-5">02 — How it works</p>
        <h2 className="font-display text-3xl font-semibold uppercase leading-[1.02] tracking-tight text-[#f4f4f0] sm:text-5xl">
          Four steps. <span className="text-[#2fb8ff]">Zero</span> creepiness.
        </h2>
      </Reveal>
      <div className="grid auto-rows-[minmax(280px,auto)] grid-cols-1 gap-4 md:grid-cols-6">
        <Tile testId="bento-register" className="md:col-span-4">
          <UserRound className="h-6 w-6 text-[#2fb8ff]" />
          <h3 className="mt-6 font-display text-xl font-semibold uppercase text-white">Register in a minute</h3>
          <p className="mt-3 max-w-md text-sm text-zinc-300">Name and phone number, your scenes, your department. That's the whole form.</p>
          <div className="mt-auto grid gap-2 pt-8 sm:grid-cols-2">
            <StepChip n={1} label="Name & phone" done />
            <StepChip n={2} label="Interests" done />
            <StepChip n={3} label="Department" />
            <StepChip n={4} label="Location consent" />
          </div>
        </Tile>
        <Tile testId="bento-departments" className="md:col-span-2" delay={0.08}>
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">Departments</p>
          <div className="mt-auto flex flex-wrap gap-2">
            {DEPARTMENTS.map((d) => (
              <span key={d} className="rounded-full border border-white/15 px-4 py-2 font-display text-sm uppercase text-white">
                {d}
              </span>
            ))}
          </div>
        </Tile>
        <Tile testId="bento-phone" className="md:col-span-2" delay={0.12}>
          <Phone className="h-6 w-6 text-[#8b91ff]" />
          <h3 className="mt-6 font-display text-xl font-semibold uppercase text-white">A number identifies</h3>
          <p className="mt-3 text-sm text-zinc-300">
            Search the directory by full phone number to find a registered person. Numbers are masked for everyone else — and are never used to locate anyone.
          </p>
        </Tile>
        <Tile testId="bento-consent" className="md:col-span-4" delay={0.16}>
          <div className="grid h-full gap-6 sm:grid-cols-2">
            <div>
              <ShieldCheck className="h-6 w-6 text-[#34d399]" />
              <h3 className="mt-6 font-display text-xl font-semibold uppercase text-white">Location needs a yes</h3>
              <p className="mt-3 text-sm text-zinc-300">
                Ask someone for their location; they choose to share or decline. Their browser asks permission too — and they can revoke it any time.
              </p>
            </div>
            <MockRequest />
          </div>
        </Tile>
      </div>
    </section>
  );
}
