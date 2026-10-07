import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionTemplate, useScroll, useTransform } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Wordmark } from "./Logo";

const MANIFESTO =
  "We never locate anyone from a phone number. A location appears only when its owner says yes — and disappears the moment they take it back.";

export function Manifesto() {
  const words = MANIFESTO.split(" ");
  return (
    <section className="mx-auto max-w-6xl px-5 py-24 md:px-8 md:py-36" data-testid="manifesto-section">
      <p className="eyebrow mb-8">04 — Our promise</p>
      <motion.p
        className="font-display text-2xl font-medium leading-[1.25] tracking-tight text-[#f7f2ec] sm:text-4xl lg:text-5xl"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        transition={{ staggerChildren: 0.035 }}
      >
        {words.map((w, i) => (
          <motion.span
            key={i}
            className={`mr-[0.28em] inline-block ${w.startsWith("yes") || w === "never" ? "text-[#ffb086]" : ""}`}
            variants={{ hidden: { opacity: 0.15, y: 14, filter: "blur(6px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)" } }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {w}
          </motion.span>
        ))}
      </motion.p>
    </section>
  );
}

export function FinalCta() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const sideInset = useTransform(scrollYProgress, [0, 1], [22, 0]);
  const vInset = useTransform(scrollYProgress, [0, 1], [14, 0]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.25, 1]);
  const clip = useMotionTemplate`inset(${vInset}% ${sideInset}% round 32px)`;

  return (
    <section className="px-3 pb-6 md:px-6" data-testid="final-cta-section">
      <div ref={ref} className="relative">
        <motion.div style={{ clipPath: clip }} className="relative h-[78vh] min-h-[520px] overflow-hidden rounded-[32px]">
          <motion.img style={{ scale: imgScale }} src="/images/crowd.jpg" alt="Crowd making heart hands at a concert" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a12] via-[#0c0a12]/50 to-[#0c0a12]/20" />
          <div className="relative flex h-full flex-col justify-end p-6 md:p-14">
            <h2 className="font-display text-4xl font-bold uppercase leading-[0.95] text-white sm:text-6xl lg:text-7xl">
              Your people
              <br />
              are <span className="text-[#ffb086]">already here.</span>
            </h2>
            <Link
              to="/register"
              data-testid="final-register-cta"
              className="group mt-8 inline-flex w-fit items-center gap-3 rounded-full bg-[#ffb086] py-4 pl-7 pr-4 font-semibold text-[#0c0a12] transition-transform hover:scale-[1.03]"
            >
              Create my profile
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#0c0a12] text-[#ffb086] transition-transform duration-500 group-hover:rotate-[-45deg]">
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between md:px-8" data-testid="site-footer">
      <Wordmark tagline />
      <p className="text-sm text-zinc-400">Consent-first campus network · © 2026 ConnectMe</p>
      <Link to="/directory" data-testid="footer-directory-link" className="text-sm text-zinc-300 hover:text-white">
        Open the directory →
      </Link>
    </footer>
  );
}
