import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const KEY = "connectme.intro.v1";
const WORDS = ["Find", "People.", "Build", "Connections."];
const EASE = [0.22, 1, 0.36, 1] as const;

/** One-time intro: the tagline types itself in letter by letter, then the curtain lifts to reveal the site. */
export function IntroOverlay() {
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    return !sessionStorage.getItem(KEY);
  });

  useEffect(() => {
    if (!show) return undefined;
    document.documentElement.style.overflow = "hidden";
    const t = window.setTimeout(() => {
      sessionStorage.setItem(KEY, "1");
      setShow(false);
    }, 2600);
    return () => {
      window.clearTimeout(t);
      document.documentElement.style.overflow = "";
    };
  }, [show]);

  let letterIndex = 0;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          data-testid="intro-overlay"
          className="fixed inset-0 z-[100] grid place-items-center bg-[#0c0a12]"
          exit={{ y: "-100%", transition: { duration: 0.9, ease: EASE } }}
          aria-hidden
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute left-1/2 top-1/2 h-[60vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ffb086]/20 blur-3xl"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1.1, opacity: 1 }}
              transition={{ duration: 2.2, ease: "easeOut" }}
            />
          </div>
          <div className="relative px-6 text-center">
            <motion.img
              src="/logo-mark.png"
              alt=""
              className="mx-auto mb-8 h-16 w-16 drop-shadow-[0_0_30px_rgba(47,184,255,0.55)] sm:h-20 sm:w-20"
              initial={{ scale: 0, rotate: -30, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: EASE }}
            />
            <h1 className="font-display text-3xl font-bold uppercase leading-[1.05] text-white sm:text-5xl lg:text-6xl">
              {WORDS.map((word, wi) => (
                <span key={word} className={wi === 1 || wi === 3 ? "mr-[0.35em] inline-block whitespace-nowrap font-serif font-normal normal-case italic text-[#ffb086]" : "mr-[0.35em] inline-block whitespace-nowrap"}>
                  {word.split("").map((ch, ci) => {
                    const i = letterIndex++;
                    return (
                      <motion.span
                        key={`${wi}-${ci}`}
                        className="inline-block"
                        initial={{ y: "110%", opacity: 0, rotateX: -60 }}
                        animate={{ y: 0, opacity: 1, rotateX: 0 }}
                        transition={{ delay: 0.35 + i * 0.045, duration: 0.6, ease: EASE }}
                      >
                        {ch}
                      </motion.span>
                    );
                  })}
                </span>
              ))}
            </h1>
            <motion.p
              className="mt-6 font-mono text-[11px] uppercase tracking-[0.35em] text-zinc-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6, duration: 0.5 }}
            >
              ConnectMe · campus network
            </motion.p>
            <motion.span
              className="mx-auto mt-6 block h-px w-24 origin-left bg-[#ffb086]"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.4, duration: 2.1, ease: "linear" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
