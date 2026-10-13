import { useRef } from "react";
import type { PointerEvent } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "motion/react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { MaskLines } from "./Reveal";
import { INTERESTS } from "../lib/data";
import { useMeta } from "../lib/queries";

const ORBIT = INTERESTS.filter((it) => it.trending).concat(INTERESTS.filter((it) => !it.trending)).slice(0, 8);

function Orbit() {
  return (
    <div className="relative mx-auto h-[300px] w-full [--card-h:150px] [--card-w:110px] [--r:190px] [perspective:1100px] sm:h-[380px] sm:[--r:240px] lg:h-[560px] lg:[--card-h:250px] lg:[--card-w:180px] lg:[--r:320px]">
      <div className="orbit-ring absolute left-1/2 top-1/2">
        {ORBIT.map((it, i) => (
          <div
            key={it.id}
            className="absolute left-0 top-0 overflow-hidden rounded-2xl ring-1 ring-white/20"
            style={{
              width: "var(--card-w)",
              height: "var(--card-h)",
              marginLeft: "calc(var(--card-w) / -2)",
              marginTop: "calc(var(--card-h) / -2)",
              transform: `rotateY(${(i * 360) / ORBIT.length}deg) translateZ(var(--r))`,
            }}
          >
            <img src={it.image} alt={it.label} loading={i < 3 ? "eager" : "lazy"} decoding="async" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <span className="absolute bottom-2 left-3 font-display text-[10px] font-semibold uppercase tracking-wider text-white lg:bottom-3 lg:text-sm">
              {it.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const meta = useMeta();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotX = useSpring(useTransform(my, [-0.5, 0.5], [6, -18]), { stiffness: 80, damping: 18 });
  const rotY = useSpring(useTransform(mx, [-0.5, 0.5], [-16, 16]), { stiffness: 80, damping: 18 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const textY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const orbitScale = useTransform(scrollYProgress, [0, 1], [1, 0.75]);

  const onMove = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    mx.set(e.clientX / window.innerWidth - 0.5);
    my.set(e.clientY / window.innerHeight - 0.5);
  };

  return (
    <section ref={ref} onPointerMove={onMove} className="grain relative min-h-[100svh] overflow-hidden pt-28 md:pt-36" data-testid="hero-section">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-20 h-[520px] w-[520px] rounded-full bg-[#ffb086]/10 blur-[140px]" />
        <div className="absolute -right-20 top-40 h-[480px] w-[480px] rounded-full bg-[#8b91ff]/15 blur-[140px]" />
        <div className="absolute inset-x-0 bottom-0 h-[45%] [perspective:600px]">
          <div className="grid-floor absolute inset-x-[-50%] bottom-[-30%] h-[160%] [transform:rotateX(72deg)]" />
        </div>
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl gap-6 px-5 md:px-8 lg:grid-cols-12 lg:items-center">
        <motion.div style={{ y: textY }} className="lg:col-span-7">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="eyebrow mb-6">
            Find People <span className="text-[#ffb086]">•</span> Build Connections · {INTERESTS.length} scenes
          </motion.p>
          <h1 className="font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight text-[#f7f2ec] sm:text-6xl lg:text-7xl">
            <MaskLines
              delay={0.2}
              lines={[
                "Find your",
                "people by",
                <>
                  what they <span className="font-serif font-normal normal-case italic text-[#ffb086]">love.</span>
                </>,
              ]}
            />
          </h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="mt-8 max-w-xl text-base text-zinc-300 md:text-lg">
              ConnectMe groups students by passion and department. Register with your name and number, pick your scenes,
              and meet the dancers, gamers, athletes, writers and singers around you.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                to="/register"
                data-testid="hero-register-cta"
                className="group inline-flex items-center gap-3 rounded-full bg-[#ffb086] py-4 pl-7 pr-4 font-semibold text-[#0c0a12] transition-transform hover:scale-[1.03] active:scale-95"
              >
                Start registration
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#0c0a12] text-[#ffb086] transition-transform duration-500 group-hover:rotate-[-45deg]">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
              <Link
                to="/directory"
                data-testid="hero-directory-cta"
                className="rounded-full border border-white/15 px-7 py-4 font-medium text-white transition-colors hover:border-white/40 hover:bg-white/5"
              >
                Browse directory
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <div data-testid="hero-member-count">
                <p className="font-display text-3xl font-semibold text-white">{meta?.total ?? "—"}</p>
                <p className="text-xs uppercase tracking-widest text-zinc-400">members</p>
              </div>
              <div className="flex max-w-xs items-start gap-3 rounded-2xl border border-[#34d399]/30 bg-[#34d399]/5 px-4 py-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#34d399]" />
                <p className="text-sm text-zinc-300">Location is shared only when a person says yes. Never from a phone number.</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="lg:col-span-5"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div style={{ rotateX: rotX, rotateY: rotY, scale: orbitScale, transformPerspective: 1200 }} className="relative [transform-style:preserve-3d]">
            <Orbit />
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d]" data-testid="hero-logo-hub">
              <div className="absolute inset-0 -m-10 rounded-full bg-[#2fb8ff]/20 blur-3xl" />
              <img src="/logo-mark.png" alt="ConnectMe" className="logo-float relative h-24 w-24 drop-shadow-[0_0_30px_rgba(47,184,255,0.55)] sm:h-32 sm:w-32 lg:h-44 lg:w-44" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
