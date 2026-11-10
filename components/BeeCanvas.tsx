"use client";

import { useEffect, useRef, useState } from "react";
import { Bee3D } from "@/components/Bee3D";
import type { BeeFlight } from "@/components/bee3d/scene";

/**
 * The 3D bee (Three.js, loaded only when this component appears). Falls back
 * to the lighter CSS bee when WebGL isn't available.
 */
export function BeeCanvas({ flight, className = "" }: { flight: BeeFlight; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let cancelled = false;
    let cleanup = () => {};
    const nav = navigator as Navigator & { deviceMemory?: number };
    const opts = {
      calm: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      lowPower: (nav.hardwareConcurrency ?? 8) <= 2 || (nav.deviceMemory ?? 8) <= 2,
    };

    import("@/components/bee3d/scene")
      .then(({ createBeeScene }) => {
        if (cancelled) return;
        const scene = createBeeScene(el, flight, opts);
        // Draw only while the bee is on screen and the tab is visible.
        let onScreen = false;
        const sync = () => scene.setRunning(onScreen && !document.hidden);
        const io = new IntersectionObserver(([e]) => {
          onScreen = e.isIntersecting;
          sync();
        });
        io.observe(el);
        const ro = new ResizeObserver(() => scene.resize());
        ro.observe(el);
        document.addEventListener("visibilitychange", sync);
        cleanup = () => {
          io.disconnect();
          ro.disconnect();
          document.removeEventListener("visibilitychange", sync);
          scene.dispose();
        };
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [flight]);

  if (failed) return <Bee3D className={className} />;
  return <canvas ref={canvas} className={`block ${className}`} aria-hidden="true" />;
}
