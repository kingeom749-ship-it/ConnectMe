import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "./Reveal";
import { TiltCard } from "./TiltCard";
import { DEPARTMENTS, DEPARTMENT_INFO, slug } from "../lib/data";
import { useMeta } from "../lib/queries";

export function DepartmentsSection() {
  const meta = useMeta();
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32" data-testid="departments-section">
      <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow mb-5">03 — Departments</p>
          <h2 className="font-display text-3xl font-semibold uppercase leading-[1.02] tracking-tight text-[#f4f4f0] sm:text-5xl">
            Same passion,
            <br />
            different <span className="text-outline">desks.</span>
          </h2>
        </div>
      </Reveal>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {DEPARTMENTS.map((d, i) => {
          const Icon = DEPARTMENT_INFO[d].icon;
          return (
            <Reveal key={d} delay={i * 0.06}>
              <TiltCard>
                <Link
                  to={`/directory?department=${encodeURIComponent(d)}`}
                  data-testid={`dept-tile-${slug(d)}`}
                  className="group flex h-64 flex-col justify-between rounded-[28px] border border-white/10 bg-gradient-to-b from-[#161922] to-[#0e1016] p-6 transition-colors hover:border-[#d7ff3a]/60"
                >
                  <div className="flex items-start justify-between">
                    <Icon className="h-6 w-6 text-[#d7ff3a]" />
                    <ArrowUpRight className="h-5 w-5 text-zinc-400 transition-transform duration-500 group-hover:rotate-45 group-hover:text-white" />
                  </div>
                  <div>
                    <p className="font-display text-2xl font-semibold uppercase text-white lg:text-xl">{d}</p>
                    <p className="mt-2 text-sm text-zinc-400">{DEPARTMENT_INFO[d].full}</p>
                    <p className="mt-4 font-mono text-xs text-zinc-300">{meta?.departments?.[d] ?? 0} members</p>
                  </div>
                </Link>
              </TiltCard>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
