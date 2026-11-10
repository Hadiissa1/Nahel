import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { createBee } from "@/components/bee3d/model";

/** What the page tells the bee on each frame (written by the scroll code). */
export interface BeeFlight {
  /** +1 flying towards the right of the screen, −1 towards the left. */
  dir: 1 | -1;
  /** Vertical speed, −1 (climbing fast) … +1 (diving fast). */
  dive: number;
}

export interface BeeScene {
  resize(): void;
  /** Starts or stops drawing (stopped while the section is off screen). */
  setRunning(on: boolean): void;
  dispose(): void;
}

/**
 * Draws the bee on a transparent canvas. Throws if WebGL can't start, so the
 * caller can show a simpler bee instead.
 */
export function createBeeScene(canvas: HTMLCanvasElement, flight: BeeFlight, opts: { calm: boolean; lowPower: boolean }): BeeScene {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !opts.lowPower, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, opts.lowPower ? 1 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = !opts.lowPower;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  // Soft studio reflections for the eyes, the wings and the shiny body parts.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = env.texture;
  scene.environmentIntensity = 0.55;

  // Daylight: warm sun from the upper left, sky above, earth-coloured bounce below.
  scene.add(new THREE.HemisphereLight("#fff6dc", "#6b4a22", 0.9));
  const sun = new THREE.DirectionalLight("#fff1d0", 2.6);
  sun.position.set(-3, 6, 5);
  sun.castShadow = !opts.lowPower;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 1, far: 20 });
  sun.shadow.bias = -0.002;
  scene.add(sun);
  const rim = new THREE.DirectionalLight("#cfe4ff", 0.9);
  rim.position.set(4, 2, -5);
  scene.add(rim);

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
  camera.position.set(0, 0.5, 10.5);
  camera.lookAt(0, -0.1, 0);

  const bee = createBee(opts.lowPower ? "low" : "high");
  // The body turns inside this group; `bee.root` keeps its own small motions.
  const body = new THREE.Group();
  body.add(bee.root);
  scene.add(body);

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();

  let last = performance.now();
  let t = 0;
  // Three-quarter view: the bee faces its direction of travel, a little towards us.
  const yawFor = (dir: number) => (dir > 0 ? -0.5 : Math.PI + 0.5);
  let yaw = yawFor(flight.dir);
  let pitch = 0;
  let frame = 0;

  const draw = () => {
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    t += dt;
    const ease = opts.calm ? 1 : 1 - Math.exp(-dt * 5);
    const before = yaw;
    yaw += (yawFor(flight.dir) - yaw) * ease;
    pitch += (-0.12 - flight.dive * 0.4 - pitch) * ease;
    body.rotation.set(0, yaw, 0);
    // Nose down when diving; banks into its turns.
    bee.root.rotation.set(opts.calm ? 0 : THREE.MathUtils.clamp((yaw - before) / Math.max(dt, 0.001), -4, 4) * 0.12, 0, pitch);
    bee.root.position.y = opts.calm ? 0 : Math.sin(t * 2.2) * 0.07;
    bee.update(t, !opts.calm);
    renderer.render(scene, camera);
  };
  const loop = () => {
    draw();
    frame = requestAnimationFrame(loop);
  };

  return {
    resize() {
      resize();
      if (!frame) draw();
    },
    setRunning(on) {
      cancelAnimationFrame(frame);
      frame = 0;
      last = performance.now(); // forget the time spent off screen
      // With reduced motion a single still picture is drawn, no loop.
      if (on && !opts.calm) loop();
      else draw();
    },
    dispose() {
      cancelAnimationFrame(frame);
      bee.dispose();
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
