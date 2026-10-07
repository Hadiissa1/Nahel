"use client";

import { useEffect, useRef, useState } from "react";

/**
 * One-series bar chart (one bar per day): thin bars with rounded tops on a
 * shared baseline, a recessive grid, sparse axis labels, and a tooltip per
 * bar. The caller always offers the same numbers as a table too.
 */
export function BarChart({
  data,
  format,
  label,
  color = "#b9740f",
}: {
  data: { key: string; label: string; value: number }[];
  format: (v: number) => string;
  /** Accessible name of the chart. */
  label: string;
  color?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  // Drawn at the real width (not scaled), so labels keep a readable size on phones.
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(640);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = 200, PAD_L = 44, PAD_B = 22, PAD_T = 12;
  const max = Math.max(...data.map((d) => d.value), 0);
  // Round the top of the scale to a readable number.
  const step = max <= 0 ? 1 : Math.pow(10, Math.floor(Math.log10(max)));
  const top = max <= 0 ? 1 : Math.ceil(max / step) * step;
  const n = data.length || 1;
  const slot = (W - PAD_L) / n;
  const barW = Math.max(2, Math.min(28, slot - 2)); // 2px surface gap between bars
  const y = (v: number) => PAD_T + (H - PAD_T - PAD_B) * (1 - v / top);
  const every = Math.ceil(n / Math.max(3, Math.floor(W / 70))); // labels never collide

  return (
    // Time runs left to right in both languages.
    <div ref={box} className="relative" dir="ltr">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={label} className="block max-w-full">
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={PAD_L} x2={W} y1={y(top * f)} y2={y(top * f)} stroke="currentColor" strokeOpacity={f === 0 ? 0.25 : 0.08} />
            <text x={PAD_L - 6} y={y(top * f) + 4} textAnchor="end" fontSize="11" fill="currentColor" fillOpacity={0.55}>
              {format(top * f)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = PAD_L + i * slot + (slot - barW) / 2;
          const h = Math.max(0, H - PAD_B - y(d.value));
          const r = Math.min(4, barW / 2, h);
          return (
            <g key={d.key} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              {/* Hit target taller than the bar. */}
              <rect x={PAD_L + i * slot} y={PAD_T} width={slot} height={H - PAD_T - PAD_B} fill="transparent" />
              {h > 0 && (
                <path
                  d={`M${x},${H - PAD_B} V${H - PAD_B - h + r} Q${x},${H - PAD_B - h} ${x + r},${H - PAD_B - h} H${x + barW - r} Q${x + barW},${H - PAD_B - h} ${x + barW},${H - PAD_B - h + r} V${H - PAD_B} Z`}
                  fill={color}
                  fillOpacity={hover === null || hover === i ? 1 : 0.55}
                />
              )}
              {(i % every === 0 || i === n - 1) && (
                <text x={PAD_L + i * slot + slot / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="currentColor" fillOpacity={0.55}>
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && data[hover] && (
        <div
          role="tooltip"
          className="pointer-events-none absolute top-0 rounded-lg border border-bark/10 bg-white px-2.5 py-1.5 text-xs shadow"
          style={{ left: `${((PAD_L + hover * slot + slot / 2) / W) * 100}%`, transform: "translateX(-50%)" }}
          dir="ltr"
        >
          <span className="text-bark/60">{data[hover].key}</span> · <span className="font-semibold text-bark-deep">{format(data[hover].value)}</span>
        </div>
      )}
    </div>
  );
}
