import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hue: number;
}

const LINK = 150;
const COUNT_DESKTOP = 70;
const COUNT_MOBILE = 32;

/**
 * Landing-page backdrop: a constellation of "people" nodes that drift and link up.
 * Scrolling pushes the field (parallax) and energises the drift, so the background
 * visibly reacts as you move down the page. Canvas 2D, DPR-capped, paused when hidden.
 */
export function ScrollConstellation() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return undefined;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let nodes: Node[] = [];
    let frame = 0;
    let lastY = window.scrollY;
    let velocity = 0;
    let running = true;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = w < 768 ? COUNT_MOBILE : COUNT_DESKTOP;
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: 1 + Math.random() * 1.8,
        hue: Math.random() < 0.7 ? 22 : 230,
      }));
    };

    const onScroll = () => {
      const y = window.scrollY;
      velocity += (y - lastY) * 0.02;
      lastY = y;
    };

    const draw = () => {
      if (!running) return;
      velocity *= 0.92;
      const energy = Math.min(Math.abs(velocity), 6);
      const progress = Math.min(1, window.scrollY / Math.max(1, document.body.scrollHeight - h));
      ctx.clearRect(0, 0, w, h);

      for (const n of nodes) {
        n.x += n.vx * (1 + energy * 0.6);
        n.y += n.vy * (1 + energy * 0.6) - velocity * 0.6;
        if (n.x < -20) n.x = w + 20;
        if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20;
        if (n.y > h + 20) n.y = -20;
      }

      const link = LINK + energy * 18;
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > link * link) continue;
          const t = 1 - Math.sqrt(d2) / link;
          ctx.strokeStyle = `hsla(${22 + progress * 200}, 90%, 72%, ${t * (0.16 + energy * 0.04)})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (const n of nodes) {
        ctx.fillStyle = `hsla(${n.hue === 22 ? 22 + progress * 200 : n.hue}, 90%, 74%, ${0.55 + energy * 0.05})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + energy * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
      frame = requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      running = document.visibilityState === "visible";
      if (running) frame = requestAnimationFrame(draw);
      else cancelAnimationFrame(frame);
    };

    resize();
    frame = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={ref} aria-hidden data-testid="scroll-constellation" className="pointer-events-none fixed inset-0 z-0" />;
}
