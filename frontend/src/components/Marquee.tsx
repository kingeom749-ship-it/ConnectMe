import { Fragment } from "react";
import { Asterisk } from "lucide-react";
import { DEPARTMENTS, INTERESTS } from "../lib/data";

const WORDS = [...INTERESTS.map((i) => i.label), ...DEPARTMENTS];

export function Marquee() {
  const row = (copy: number) => (
    <div className="flex shrink-0 items-center" aria-hidden={copy > 0}>
      {WORDS.map((w, i) => (
        <Fragment key={`${copy}-${w}`}>
          <span
            className={
              i % 2
                ? "text-outline px-6 font-display text-5xl font-semibold uppercase md:px-10 md:text-8xl"
                : "px-6 font-display text-5xl font-semibold uppercase text-[#f7f2ec] md:px-10 md:text-8xl"
            }
          >
            {w}
          </span>
          <Asterisk className="h-8 w-8 shrink-0 text-[#ffb086] md:h-12 md:w-12" />
        </Fragment>
      ))}
    </div>
  );

  return (
    <section data-testid="editorial-marquee" className="relative overflow-hidden border-y border-white/10 bg-[#15111d] py-8 md:py-12">
      <div className="marquee-track flex w-max">
        {row(0)}
        {row(1)}
      </div>
    </section>
  );
}
