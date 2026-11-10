"use client";

import { useEffect, useRef, useState } from "react";
import type { BeeFlight } from "@/components/bee3d/scene";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (u: number) => u * u * (3 - 2 * u);

/**
 * Ties a flying marker to the scroll position of a vertical timeline.
 * The marker's height follows the middle of the screen; sideways it weaves
 * from one step to the next (right, left, right…). Nothing moves by itself:
 * the same scroll position always gives the same place.
 *
 * Returns the refs to attach, the mutable `flight` (direction and dive, read
 * by the 3D bee every frame) and the index of the step being visited.
 */
export function useScrollFlight(stepCount: number) {
  const track = useRef<HTMLDivElement>(null);
  const marker = useRef<HTMLDivElement>(null);
  const trail = useRef<HTMLDivElement>(null);
  const steps = useRef<(HTMLElement | null)[]>([]);
  // One object for the life of the component: written here, read by the 3D scene.
  const [flight] = useState<BeeFlight>(() => ({ dir: 1, dive: 0 }));
  const [active, setActive] = useState(-1);
  const [reached, setReached] = useState(-1);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let x = 0;
    let y = 0;
    let started = false;
    let visible = false;
    let last = performance.now();

    /** Where the marker belongs for the current scroll position. */
    const target = () => {
      const rect = el.getBoundingClientRect();
      const ty = clamp(window.innerHeight * 0.5 - rect.top, 0, rect.height);
      // Step centres are the turning points of the zigzag.
      const centres = steps.current.slice(0, stepCount).map((s) => (s ? s.offsetTop + s.offsetHeight / 2 : 0));
      const side = (i: number) => (i % 2 === 0 ? 1 : -1);
      let k = -1;
      while (k + 1 < centres.length && ty >= centres[k + 1]) k++;
      const from = k < 0 ? 0 : centres[k];
      const to = k + 1 < centres.length ? centres[k + 1] : rect.height;
      const u = smooth(clamp((ty - from) / Math.max(1, to - from), 0, 1));
      const a = k < 0 ? 0 : side(k);
      const b = k + 1 < centres.length ? side(k + 1) : 0;
      const amp = calm ? 0 : window.innerWidth >= 1024 ? 54 : 4;
      let near = -1;
      steps.current.forEach((s, i) => {
        if (s && ty >= s.offsetTop + s.offsetHeight * 0.2) near = i;
      });
      return { tx: (a + (b - a) * u) * amp, ty, near };
    };

    const tick = (now: number) => {
      frame = 0;
      // Real elapsed time (not capped low): on a slow device the bee still
      // catches up in the same time, in fewer, larger moves.
      const dt = Math.min((now - last) / 1000, 0.5);
      last = now;
      const { tx, ty, near } = target();
      // Glides to its place (or jumps there when motion is reduced).
      const ease = calm || !started ? 1 : 1 - Math.exp(-dt * 7);
      const dx = (tx - x) * ease;
      const dy = (ty - y) * ease;
      x += dx;
      y += dy;
      started = true;
      if (Math.abs(tx - x) > 1.5) flight.dir = tx > x ? 1 : -1;
      flight.dive = clamp(dy / Math.max(dt, 0.001) / 900, -1, 1);
      if (marker.current) marker.current.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      if (trail.current) trail.current.style.height = `${y.toFixed(0)}px`;
      setActive(near);
      setReached((r) => Math.max(r, near));
      // Keep going until it has arrived; then wait for the next scroll.
      if (visible && (Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3)) frame = requestAnimationFrame(tick);
      else flight.dive = 0;
    };
    const wake = () => {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) wake();
    });
    io.observe(el);
    wake();
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake);
    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", wake);
    };
  }, [stepCount, flight]);

  return { track, marker, trail, steps, flight, active, reached };
}
