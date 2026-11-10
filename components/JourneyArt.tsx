/** Illustrations for the six steps of "how bees make honey" (decorative). */

const hex = (cx: number, cy: number, r: number) =>
  Array.from({ length: 6 }, (_, k) => {
    const a = (Math.PI / 3) * k + Math.PI / 6;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");

/** A patch of honeycomb; `kind(i)` says how each cell looks. */
function Comb({ kind }: { kind: (i: number, col: number, row: number) => "empty" | "nectar" | "honey" | "capped" }) {
  const r = 26;
  const w = Math.sqrt(3) * r;
  const cells = [];
  let i = 0;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 8; col++) {
      const cx = col * w + (row % 2 ? w / 2 : 0) - 6;
      const cy = row * r * 1.5 + 4;
      const k = kind(i++, col, row);
      const fill = k === "empty" ? "#8a5a22" : k === "nectar" ? "url(#j-nectar)" : k === "honey" ? "url(#j-honey)" : "#f1dba6";
      cells.push(
        <g key={`${row}-${col}`}>
          <polygon points={hex(cx, cy, r - 2)} fill={fill} stroke="#e8b54a" strokeWidth="3" strokeLinejoin="round" />
          {(k === "nectar" || k === "honey") && <ellipse cx={cx - 7} cy={cy - 9} rx="6" ry="3" fill="#fff" opacity="0.45" />}
          {k === "capped" && <circle cx={cx + 5} cy={cy + 4} r="2" fill="#d9b972" />}
        </g>,
      );
    }
  }
  return <>{cells}</>;
}

function MiniBee({ x, y, s = 1, flip = false }: { x: number; y: number; s?: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <ellipse cx="-4" cy="-13" rx="13" ry="7" fill="#fff" opacity="0.8" stroke="#c9d6e2" transform="rotate(-25 -4 -13)" />
      <ellipse cx="8" cy="-13" rx="12" ry="6" fill="#fff" opacity="0.7" stroke="#c9d6e2" transform="rotate(15 8 -13)" />
      <ellipse cx="0" cy="0" rx="18" ry="12" fill="#f0b740" />
      <path d="M-6 -11v22M3 -12v24M11 -9v18" stroke="#2b1d0e" strokeWidth="5" strokeLinecap="round" />
      <circle cx="20" cy="-1" r="8" fill="#2b1d0e" />
      <circle cx="23" cy="-3" r="2" fill="#fff" />
    </g>
  );
}

const SCENES = [
  // 1. A forager on a flower.
  <>
    <rect width="320" height="200" fill="url(#j-sky)" />
    <circle cx="262" cy="42" r="24" fill="#f7cf6b" />
    <path d="M0 160q80-40 160-12t160-20v72H0z" fill="#8aa05f" />
    <path d="M0 176q90-26 170-6t150-14v44H0z" fill="#6b7d4a" />
    <path d="M120 200q-6-50 4-92" stroke="#4d6133" strokeWidth="6" fill="none" strokeLinecap="round" />
    <path d="M122 160q-26-4-34-24 26-2 34 24z" fill="#6b7d4a" />
    {[0, 60, 120, 180, 240, 300].map((a) => (
      <ellipse key={a} cx="124" cy="78" rx="13" ry="24" fill="#fff5f7" stroke="#f3b9c6" strokeWidth="2" transform={`rotate(${a} 124 104)`} />
    ))}
    <circle cx="124" cy="104" r="15" fill="#f0b740" stroke="#d99a18" strokeWidth="3" />
    <path d="M250 96q-40-30-78-6" stroke="#b9740f" strokeWidth="2" strokeDasharray="3 6" fill="none" strokeLinecap="round" />
    <MiniBee x={168} y={84} flip />
  </>,
  // 2. Passing the nectar from bee to bee.
  <>
    <rect width="320" height="200" fill="#5a3413" />
    <g opacity="0.35"><Comb kind={() => "empty"} /></g>
    <MiniBee x={96} y={108} s={2.1} />
    <MiniBee x={226} y={108} s={2.1} flip />
    <path d="M161 92c7 9 11 15 11 21a11 11 0 0 1-22 0c0-6 4-12 11-21z" fill="url(#j-honey)" stroke="#fff3" />
    {[[161, 62], [138, 72], [184, 72]].map(([x, y]) => (
      <path key={x} d={`M${x} ${y - 6}v12M${x - 6} ${y}h12`} stroke="#f7cf6b" strokeWidth="2.5" strokeLinecap="round" />
    ))}
  </>,
  // 3. Nectar placed in the wax cells.
  <>
    <rect width="320" height="200" fill="#5a3413" />
    <Comb kind={(i, col, row) => (row >= 3 || (row === 2 && col < 5) ? "nectar" : "empty")} />
    <MiniBee x={236} y={62} s={1.7} flip />
    <path d="M196 74c4 5 6 9 6 12a6 6 0 0 1-12 0c0-3 2-7 6-12z" fill="#f7cf6b" />
  </>,
  // 4. Fanning: the water evaporates.
  <>
    <rect width="320" height="200" fill="#5a3413" />
    <Comb kind={(i, col, row) => (row >= 1 ? "nectar" : "empty")} />
    {[70, 150, 230].map((x) => (
      <path key={x} d={`M${x} 150q-14-16 0-32t0-32 0-32`} stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.75" />
    ))}
    {[[110, 40], [190, 26], [268, 44], [36, 30]].map(([x, y]) => (
      <path key={x} d={`M${x} ${y}c3 4 5 7 5 9a5 5 0 0 1-10 0c0-2 2-5 5-9z`} fill="#cfe6f5" />
    ))}
    <MiniBee x={56} y={168} s={1.3} />
    <MiniBee x={262} y={170} s={1.3} flip />
  </>,
  // 5. Ripe honey sealed with wax caps.
  <>
    <rect width="320" height="200" fill="#5a3413" />
    <Comb kind={(i, col, row) => (row * 8 + col < 27 ? "capped" : "honey")} />
    <MiniBee x={238} y={150} s={1.5} flip />
  </>,
  // 6. Extracted, strained, in the jar.
  <>
    <rect width="320" height="200" fill="url(#j-sky)" />
    <rect x="0" y="162" width="320" height="38" fill="#c79a5b" />
    <rect x="0" y="162" width="320" height="6" fill="#a97b3f" />
    <g>
      <rect x="34" y="52" width="92" height="112" rx="6" fill="#a97b3f" />
      <rect x="44" y="62" width="72" height="92" rx="3" fill="#f1dba6" />
      {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <polygon key={`${r}${c}`} points={hex(58 + c * 22 + (r % 2 ? 11 : 0), 80 + r * 26, 11)} fill="#f0b740" stroke="#d99a18" strokeWidth="2" />))}
    </g>
    <rect x="186" y="56" width="84" height="16" rx="5" fill="#6b3f1d" />
    <path d="M194 72h68c8 8 14 16 14 28v50a14 14 0 0 1-14 14h-68a14 14 0 0 1-14-14v-50c0-12 6-20 14-28z" fill="#fff" opacity="0.55" stroke="#fff" strokeWidth="2" />
    <path d="M184 104h88v46a12 12 0 0 1-12 12h-64a12 12 0 0 1-12-12z" fill="url(#j-honey)" />
    <ellipse cx="228" cy="104" rx="44" ry="5" fill="#f7cf6b" />
    <path d="M196 84v58" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
    <polygon points={hex(228, 136, 15)} fill="#fbf6ec" stroke="#b9740f" strokeWidth="2" />
    <path d="M228 128c3 4 5 7 5 10a5 5 0 0 1-10 0c0-3 2-6 5-10z" fill="#b9740f" />
    <path d="M150 40v70" stroke="#d99a18" strokeWidth="5" strokeLinecap="round" />
    <path d="M150 108c5 7 8 11 8 16a8 8 0 0 1-16 0c0-5 3-9 8-16z" fill="#d99a18" />
  </>,
];

export function JourneyArt({ step, className = "" }: { step: number; className?: string }) {
  return (
    <svg viewBox="0 0 320 200" className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="j-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fdf3d9" />
          <stop offset="1" stopColor="#f6dfa6" />
        </linearGradient>
        <linearGradient id="j-nectar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f9dc86" />
          <stop offset="1" stopColor="#f0b740" />
        </linearGradient>
        <linearGradient id="j-honey" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9a521" />
          <stop offset="1" stopColor="#b9740f" />
        </linearGradient>
      </defs>
      {SCENES[step]}
    </svg>
  );
}
