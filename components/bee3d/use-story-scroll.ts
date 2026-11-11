"use client";

import { useEffect, useRef, useState } from "react";
import type { BeeFlight } from "@/components/bee3d/scene";

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

/**
 * Drives a pinned "scroll story": a tall block whose content stays on screen
 * while the visitor scrolls through it. Everything depends only on how far
 * the block has been scrolled (0 → 1): the scene shown, the progress bar and
 * where the bee is. Scroll up and it all plays backwards.
 */
export function useStoryScroll(sceneCount: number) {
  const story = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const bee = useRef<HTMLDivElement>(null);
  const halo = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  // Written here on every scroll, read by the 3D scene on every frame.
  const flight = useRef<BeeFlight>({ dir: 1, dive: 0 });
  const [scene, setScene] = useState(0);

  useEffect(() => {
    const el = story.current;
    if (!el) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let queued = 0;
    let lastX = 0;
    let lastP = 0;

    const render = () => {
      queued = 0;
      const rect = el.getBoundingClientRect();
      const p = clamp(-rect.top / Math.max(1, el.offsetHeight - window.innerHeight));
      setScene(Math.min(sceneCount - 1, Math.floor(p * sceneCount)));
      if (bar.current) bar.current.style.transform = `scaleX(${p.toFixed(4)})`;
      if (halo.current) {
        halo.current.style.opacity = (0.35 + p * 0.5).toFixed(3);
        halo.current.style.transform = `scale(${(0.8 + p * 0.35).toFixed(3)})`;
      }
      const box = stage.current;
      if (bee.current && box) {
        // Zigzag: at the middle of each scene the bee is fully right, left, right, left…
        // As wide as the stage allows while the whole bee stays on screen.
        const beeWidth = (bee.current.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0;
        const reach = Math.max(0, Math.min(box.clientWidth * 0.36, (box.clientWidth - beeWidth * 1.15) / 2));
        const x = calm ? 0 : Math.cos(Math.PI * (p * sceneCount - 0.5)) * reach;
        const y = (p - 0.5) * box.clientHeight * 0.5;
        if (Math.abs(x - lastX) > 0.5) flight.current.dir = x > lastX ? 1 : -1;
        flight.current.dive = clamp((p - lastP) * 40, -1, 1);
        lastX = x;
        lastP = p;
        bee.current.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(0.85 + p * 0.15).toFixed(3)})`;
      }
    };
    const onScroll = () => {
      queued ||= requestAnimationFrame(render);
    };
    // The dive eases back to level flight once the scroll stops.
    const level = setInterval(() => {
      flight.current.dive *= 0.6;
    }, 120);
    render();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(queued);
      clearInterval(level);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sceneCount]);

  return { story, stage, bee, halo, bar, flight, scene };
}
