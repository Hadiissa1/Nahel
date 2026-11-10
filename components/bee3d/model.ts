import * as THREE from "three";

/**
 * A honey bee worker (Apis mellifera) modelled in code: three body segments,
 * hair, six jointed legs, elbowed antennae and four veined wings.
 * No free, licensed GLB model was available, so this stands in for one.
 * Axes: +X is forward (head), +Y is up, ±Z are the sides. Body length ≈ 2.6.
 */

export interface BeeModel {
  root: THREE.Group;
  /** Advances the wing beat and the small body motions; `t` in seconds. */
  update(t: number, flying: boolean): void;
  dispose(): void;
}

const TAWNY = ["#d9a441", "#c98f2c", "#e3b65a", "#b8862b", "#a87a2a"];

function canvasTexture(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext("2d")!);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Deterministic random numbers, so the bee looks the same on every visit. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

// Abdomen outline: radius along its length (s = 0 at the waist, 1 at the tip).
const ABDOMEN_LENGTH = 1.5;
const ABDOMEN_SEGMENTS = 6;
function abdomenRadius(s: number) {
  const belly = Math.pow(Math.sin(Math.PI * Math.min(1, s * 0.9 + 0.1)), 0.75) * (1 - 0.22 * s);
  return 0.46 * belly * (1 + 0.022 * Math.cos(2 * Math.PI * ABDOMEN_SEGMENTS * s));
}

/** Bands of the abdomen: a pale felt band at the front of each segment, dark behind. */
function abdomenTexture() {
  return canvasTexture(512, 512, (c) => {
    const rand = rng(7);
    const seg = 512 / ABDOMEN_SEGMENTS;
    for (let i = 0; i < ABDOMEN_SEGMENTS; i++) {
      const y = i * seg;
      const amber = i < 3; // the first segments are the most orange
      const g = c.createLinearGradient(0, y, 0, y + seg);
      g.addColorStop(0, amber ? "#e0a53a" : "#bfa05e");
      g.addColorStop(0.42, amber ? "#c9861f" : "#8a6a32");
      g.addColorStop(0.5, "#2a1a0c");
      g.addColorStop(1, "#1b1008");
      c.fillStyle = g;
      c.fillRect(0, y, 512, seg + 1);
    }
    // Fine hairs lying backwards.
    for (let i = 0; i < 9000; i++) {
      const x = rand() * 512;
      const y = rand() * 512;
      const pale = (y % seg) / seg < 0.45;
      c.strokeStyle = pale ? `rgba(255,236,180,${0.1 + rand() * 0.25})` : `rgba(120,90,50,${0.05 + rand() * 0.12})`;
      c.lineWidth = 0.6 + rand();
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + (rand() - 0.5) * 3, y + 4 + rand() * 9);
      c.stroke();
    }
  });
}

/** Wing membrane with its veins, on a transparent background. u = span, v = chord. */
function wingTexture(hind: boolean) {
  return canvasTexture(512, 256, (c) => {
    c.clearRect(0, 0, 512, 256);
    const g = c.createLinearGradient(0, 0, 512, 0);
    g.addColorStop(0, "rgba(200,170,110,0.42)");
    g.addColorStop(0.35, "rgba(214,228,236,0.26)");
    g.addColorStop(1, "rgba(226,238,246,0.2)");
    c.fillStyle = g;
    c.fillRect(0, 0, 512, 256);
    c.strokeStyle = "rgba(58,36,14,0.85)";
    c.lineCap = "round";
    const vein = (w: number, pts: number[]) => {
      c.lineWidth = w;
      c.beginPath();
      c.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
      c.stroke();
    };
    // Leading (costal) vein, then the long veins and the cross veins closing the cells.
    vein(5, [0, 70, 150, 40, 330, 34, 430, 60]);
    vein(3, [0, 110, 140, 96, 300, 104, 470, 140]);
    vein(2.5, [0, 150, 120, 150, 250, 170, 400, 214]);
    if (!hind) {
      vein(2.5, [140, 96, 190, 150, 250, 170]);
      vein(2, [300, 104, 290, 160, 330, 196]);
      vein(2, [330, 34, 350, 80, 300, 104]);
      vein(2, [350, 80, 430, 100, 470, 140]);
      vein(2, [430, 60, 430, 100]);
      vein(1.5, [190, 150, 180, 204, 250, 222]);
      // Stigma: the dark spot on the leading edge.
      c.fillStyle = "rgba(58,36,14,0.8)";
      c.beginPath();
      c.ellipse(335, 36, 22, 7, 0, 0, Math.PI * 2);
      c.fill();
    } else {
      vein(2, [140, 96, 170, 150]);
      vein(2, [300, 104, 280, 176]);
    }
  });
}

/** Wing outline in a unit box (span 0→1, chord 0→1); UVs follow the same box. */
function wingShape(hind: boolean) {
  const s = new THREE.Shape();
  s.moveTo(0, 0.6);
  if (hind) {
    s.bezierCurveTo(0.3, 0.92, 0.75, 0.95, 1, 0.62);
    s.bezierCurveTo(0.98, 0.3, 0.6, 0.08, 0.25, 0.2);
    s.bezierCurveTo(0.1, 0.28, 0.02, 0.42, 0, 0.6);
  } else {
    s.bezierCurveTo(0.25, 0.9, 0.7, 0.98, 0.93, 0.78);
    s.bezierCurveTo(1.04, 0.62, 1, 0.38, 0.86, 0.24);
    s.bezierCurveTo(0.6, 0.02, 0.3, 0.12, 0.12, 0.3);
    s.bezierCurveTo(0.04, 0.4, 0, 0.5, 0, 0.6);
  }
  return s;
}

/** Hairs standing on a surface: `place` gives a point, its outward normal and a length. */
function hairs(
  count: number,
  seed: number,
  place: (rand: () => number) => { p: THREE.Vector3; n: THREE.Vector3; len: number },
) {
  const geo = new THREE.ConeGeometry(0.011, 1, 4, 1, true);
  geo.translate(0, 0.5, 0);
  const mat = new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0 });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const rand = rng(seed);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const color = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const { p, n, len } = place(rand);
    // Lean backwards (−X) and a little at random, like combed fur.
    n.add(new THREE.Vector3(-0.45 + (rand() - 0.5) * 0.4, (rand() - 0.5) * 0.4, (rand() - 0.5) * 0.4)).normalize();
    q.setFromUnitVectors(up, n);
    m.compose(p, q, new THREE.Vector3(1, len, 1));
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, color.set(TAWNY[Math.floor(rand() * TAWNY.length)]).multiplyScalar(0.75 + rand() * 0.4));
  }
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

function tube(points: [number, number, number][], radius: number, material: THREE.Material) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, "catmullrom", 0.15);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 24, radius, 8), material);
}

export function createBee(detail: "high" | "low"): BeeModel {
  const root = new THREE.Group();
  const hairScale = detail === "high" ? 1 : 0.35;

  const chitin = new THREE.MeshPhysicalMaterial({ color: "#1c120a", roughness: 0.55, clearcoat: 0.35, clearcoatRoughness: 0.5 });
  const eyeMat = new THREE.MeshPhysicalMaterial({ color: "#0d0906", roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.12 });

  // ---- Thorax
  const thorax = new THREE.Mesh(new THREE.SphereGeometry(0.46, 40, 28), new THREE.MeshStandardMaterial({ color: "#3a2613", roughness: 0.95 }));
  thorax.scale.set(1.12, 0.96, 1);
  root.add(thorax);
  root.add(
    hairs(Math.round(2600 * hairScale), 11, (rand) => {
      const n = new THREE.Vector3().randomDirection();
      // Fewer hairs underneath, where the legs attach.
      if (n.y < -0.55 && rand() < 0.7) n.y *= -1;
      return { p: new THREE.Vector3(n.x * 0.5, n.y * 0.43, n.z * 0.45), n, len: 0.13 + rand() * 0.1 };
    }),
  );

  // ---- Head
  const head = new THREE.Group();
  head.position.set(0.68, -0.05, 0);
  root.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 24), chitin);
  skull.scale.set(0.82, 1, 1.08);
  head.add(skull);
  for (const side of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 20), eyeMat);
    eye.scale.set(0.6, 1.05, 0.55);
    eye.position.set(0.03, 0.04, side * 0.235);
    head.add(eye);
  }
  head.add(
    hairs(Math.round(500 * hairScale), 23, (rand) => {
      const n = new THREE.Vector3().randomDirection();
      n.y = Math.abs(n.y) * 0.9 + 0.1;
      n.normalize();
      return { p: new THREE.Vector3(n.x * 0.24, n.y * 0.29, n.z * 0.3), n, len: 0.06 + rand() * 0.06 };
    }),
  );
  // Tongue sheath and jaws, folded under the head.
  const mouth = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.26, 10), chitin);
  mouth.position.set(0.1, -0.32, 0);
  mouth.rotation.z = -0.5;
  head.add(mouth);
  const antennae = [1, -1].map((side) => {
    const g = new THREE.Group();
    g.position.set(0.2, 0.12, side * 0.09);
    g.add(tube([[0, 0, 0], [0.1, 0.2, side * 0.05], [0.14, 0.24, side * 0.07]], 0.02, chitin));
    g.add(tube([[0.14, 0.24, side * 0.07], [0.32, 0.22, side * 0.14], [0.5, 0.1, side * 0.2], [0.6, -0.04, side * 0.23]], 0.017, chitin));
    head.add(g);
    return g;
  });

  // ---- Abdomen (a turned shape, then laid along −X and tipped down a little)
  const profile: THREE.Vector2[] = [];
  for (let i = 0; i <= 64; i++) profile.push(new THREE.Vector2(Math.max(0.001, abdomenRadius(i / 64)), -(i / 64) * ABDOMEN_LENGTH));
  const abdomenGeo = new THREE.LatheGeometry(profile, 48);
  abdomenGeo.rotateZ(-Math.PI / 2); // length axis −Y → −X
  const abdomen = new THREE.Group();
  abdomen.position.set(-0.36, -0.02, 0);
  abdomen.rotation.z = 0.2;
  const abdomenSkin = new THREE.Mesh(abdomenGeo, new THREE.MeshPhysicalMaterial({ map: abdomenTexture(), roughness: 0.6, clearcoat: 0.25, clearcoatRoughness: 0.6 }));
  abdomen.add(abdomenSkin);
  abdomen.add(
    hairs(Math.round(1500 * hairScale), 37, (rand) => {
      // Only on the pale felt bands.
      const s = (Math.floor(rand() * ABDOMEN_SEGMENTS) + rand() * 0.42) / ABDOMEN_SEGMENTS;
      const a = rand() * Math.PI * 2;
      const r = abdomenRadius(s);
      const n = new THREE.Vector3(0, Math.cos(a), Math.sin(a));
      return { p: new THREE.Vector3(-s * ABDOMEN_LENGTH, n.y * r, n.z * r), n, len: 0.04 + rand() * 0.05 };
    }),
  );
  const sting = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.14, 8), chitin);
  sting.rotation.z = Math.PI / 2;
  sting.position.set(-ABDOMEN_LENGTH - 0.03, 0, 0);
  abdomen.add(sting);
  root.add(abdomen);

  // ---- Six legs, hanging and trailing as in flight (coxa → femur → tibia → tarsus)
  const LEGS: { at: [number, number, number]; path: [number, number, number][] }[] = [
    { at: [0.26, -0.3, 0.2], path: [[0, 0, 0], [0.16, -0.22, 0.16], [0.24, -0.5, 0.14], [0.2, -0.68, 0.1]] },
    { at: [0.02, -0.34, 0.24], path: [[0, 0, 0], [0, -0.26, 0.24], [-0.14, -0.6, 0.22], [-0.28, -0.76, 0.18]] },
    { at: [-0.24, -0.3, 0.22], path: [[0, 0, 0], [-0.24, -0.24, 0.22], [-0.6, -0.62, 0.2], [-0.86, -0.82, 0.16]] },
  ];
  const legs: THREE.Group[] = [];
  LEGS.forEach((leg, pair) => {
    for (const side of [1, -1]) {
      const g = new THREE.Group();
      g.position.set(leg.at[0], leg.at[1], leg.at[2] * side);
      const pts = leg.path.map(([x, y, z]) => [x, y, z * side] as [number, number, number]);
      g.add(tube(pts.slice(0, 3), 0.032, chitin));
      g.add(tube(pts.slice(2), 0.02, chitin));
      for (const p of pts.slice(1, 3)) {
        const joint = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), chitin);
        joint.position.set(...p);
        g.add(joint);
      }
      if (pair === 2) {
        // Hind legs: the wide, flat tibia that carries pollen.
        const a = new THREE.Vector3(...pts[1]);
        const b = new THREE.Vector3(...pts[2]);
        const basket = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), chitin);
        basket.scale.set(0.05, a.distanceTo(b) * 0.42, 0.085);
        basket.position.copy(a).lerp(b, 0.55);
        basket.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
        g.add(basket);
      }
      root.add(g);
      legs.push(g);
    }
  });

  // ---- Four wings: on each side a fore wing and a smaller hind wing
  const wings: { pivot: THREE.Group; side: number; hind: boolean }[] = [];
  for (const hind of [false, true]) {
    const map = wingTexture(hind);
    const mat = new THREE.MeshPhysicalMaterial({
      map,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      roughness: 0.15,
      iridescence: 1,
      iridescenceIOR: 1.3,
    });
    const span = hind ? 0.95 : 1.4;
    const chord = hind ? 0.42 : 0.56;
    for (const side of [1, -1]) {
      const geo = new THREE.ShapeGeometry(wingShape(hind), 24);
      // Shape (span, chord) → wing lying flat: span along ±Z, leading edge towards +X.
      geo.applyMatrix4(new THREE.Matrix4().set(0, chord, 0, -chord * 0.6, 0, 0, 1, 0, side * span, 0, 0, 0, 0, 0, 0, 1));
      const pivot = new THREE.Group();
      pivot.position.set(hind ? -0.08 : 0.12, 0.36, side * 0.2);
      const sweep = new THREE.Group();
      sweep.rotation.y = side * (hind ? 0.75 : 0.3); // swept back
      sweep.add(new THREE.Mesh(geo, mat));
      pivot.add(sweep);
      root.add(pivot);
      wings.push({ pivot, side, hind });
    }
  }

  root.traverse((o) => {
    if (o instanceof THREE.Mesh && !(o.material as THREE.Material).transparent) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });

  return {
    root,
    update(t, flying) {
      // Real bees beat their wings about 230 times a second; a screen can't show
      // that, so the beat is slowed to stay readable.
      const beat = flying ? Math.sin(t * 95) : 0;
      for (const w of wings) {
        const lift = 0.3 + 0.85 * (w.hind ? Math.sin(t * 95 - 0.35) * (flying ? 1 : 0) : beat);
        w.pivot.rotation.x = -w.side * lift;
      }
      if (!flying) return;
      abdomen.rotation.z = 0.2 + Math.sin(t * 3.1) * 0.035;
      head.rotation.y = Math.sin(t * 1.3) * 0.08;
      antennae.forEach((a, i) => (a.rotation.z = Math.sin(t * 5 + i * 1.7) * 0.07));
      legs.forEach((l, i) => (l.rotation.z = Math.sin(t * 2.3 + i) * 0.05));
    },
    dispose() {
      root.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return;
        o.geometry.dispose();
        for (const m of [o.material].flat() as THREE.MeshStandardMaterial[]) {
          m.map?.dispose();
          m.dispose();
        }
      });
    },
  };
}
