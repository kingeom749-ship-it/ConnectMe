import { Reveal } from "./Reveal";
import { InteractiveHoverLinks } from "./ui/interactive-hover-links";
import { INTERESTS } from "../lib/data";
import { useMeta } from "../lib/queries";

export function InterestsSection() {
  const meta = useMeta();
  const items = INTERESTS.map((it) => ({
    id: it.id,
    label: it.label,
    href: `/directory?interest=${it.id}`,
    image: it.image,
    caption: it.tagline,
    meta: (
      <>
        {it.trending && <span className="mb-1 inline-block rounded-full border border-[#ffb086]/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#ffb086]" data-testid={`interest-trending-${it.id}`}>Trending 2026</span>}
        <span className="block text-zinc-300">{it.tagline}</span>
        <span className="font-mono text-xs text-zinc-400">{meta?.interests?.[it.id] ?? 0} {meta?.interests?.[it.id] === 1 ? "member" : "members"}</span>
      </>
    ),
  }));

  return (
    <section id="interests" className="relative mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-36" data-testid="interests-section">
      <Reveal className="mb-12 grid gap-6 md:mb-16 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <p className="eyebrow mb-5">01 — Twelve scenes</p>
          <h2 className="font-display text-3xl font-semibold uppercase leading-[1.02] tracking-tight text-[#f7f2ec] sm:text-5xl">
            Pick a scene.
            <br />
            <span className="text-outline">Meet its people.</span>
          </h2>
        </div>
        <p className="text-base text-zinc-300 md:col-span-5 md:text-lg">
          Hover a scene to preview it, tap to open everyone who listed it — filtered and grouped by department.
        </p>
      </Reveal>
      <Reveal delay={0.1}>
        <InteractiveHoverLinks items={items} />
      </Reveal>
    </section>
  );
}
