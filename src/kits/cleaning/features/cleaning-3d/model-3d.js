// @ts-check
/**
 * Room by room in 3D (cleaning kit, Signature): an illustration of a two-bedroom flat, drawn from boxes with three.js,
 * loaded only when a visitor taps (esbuild puts it in its own chunk). Low walls, so every room shows from above; tap a
 * room to pick it. No model file. It draws only when something changes (a drag, a pick), never in a loop.
 * Colours are the look's: --model-* custom properties on the canvas, falling back to its surface, line and text tokens.
 */
import {
  WebGLRenderer, Scene, Color, PerspectiveCamera, HemisphereLight, DirectionalLight, Group, Mesh,
  BoxGeometry, EdgesGeometry, LineSegments, LineBasicMaterial, MeshStandardMaterial, Raycaster, Vector2, Vector3,
  PCFSoftShadowMap, SRGBColorSpace, ACESFilmicToneMapping,
} from "three";

export const PLANS = {
  home: {
    size: [10, 8],
    rooms: [
      { id: "kitchen", name: "Kitchen and living", x: 0, z: 0, w: 6, d: 4.5, floor: "wood" },
      { id: "hall", name: "Hall", x: 6, z: 0, w: 1.4, d: 8, floor: "stone" },
      { id: "bath", name: "Bathroom", x: 7.4, z: 0, w: 2.6, d: 2.6, floor: "tile" },
      { id: "bed1", name: "Bedroom one", x: 7.4, z: 2.6, w: 2.6, d: 5.4, floor: "carpet" },
      { id: "bed2", name: "Bedroom two", x: 0, z: 4.5, w: 4, d: 3.5, floor: "carpet" },
      { id: "shower", name: "Shower room", x: 4, z: 4.5, w: 2, d: 3.5, floor: "tile" },
    ],
    // [room, x, z, w, d, h, kind]
    things: [
      ["kitchen", 0.15, 0.15, 3.6, 0.65, 0.92, "unit"], ["kitchen", 1.4, 1.9, 1.9, 0.9, 0.92, "unit"],
      ["kitchen", 3.9, 3.3, 1.9, 0.9, 0.75, "soft"], ["kitchen", 4.3, 2.3, 1.0, 0.6, 0.4, "wood"],
      ["kitchen", 0.3, 3.2, 1.2, 0.8, 0.75, "wood"],
      ["bath", 7.55, 0.15, 2.3, 0.8, 0.58, "white"], ["bath", 9.3, 1.7, 0.55, 0.7, 0.85, "white"], ["bath", 7.55, 1.9, 0.5, 0.55, 0.42, "white"],
      ["bed1", 8.0, 5.0, 1.8, 2.1, 0.5, "soft"], ["bed1", 7.55, 2.8, 0.6, 1.8, 1.1, "wood"],
      ["bed2", 0.3, 5.6, 1.5, 2.1, 0.5, "soft"], ["bed2", 2.9, 7.3, 1.0, 0.5, 0.75, "wood"],
      ["shower", 4.15, 4.65, 0.95, 0.95, 0.08, "white"], ["shower", 5.3, 6.6, 0.55, 0.7, 0.42, "white"], ["shower", 4.15, 7.3, 0.6, 0.5, 0.85, "white"],
      // detail: worktops, sofa back, pillows, duvet, glass screen frame
      ["kitchen", 0.12, 0.12, 3.66, 0.71, 0.96, "stone"], ["kitchen", 1.36, 1.86, 1.98, 0.98, 0.96, "stone"],
      ["kitchen", 3.9, 3.95, 1.9, 0.25, 1.0, "soft"], ["kitchen", 0.5, 3.0, 0.4, 0.4, 0.95, "soft"], ["kitchen", 1.1, 3.0, 0.4, 0.4, 0.95, "soft"],
      ["bed1", 8.15, 6.6, 1.5, 0.4, 0.68, "white"], ["bed1", 8.0, 5.0, 1.8, 1.4, 0.56, "white"],
      ["bed2", 0.45, 7.2, 1.2, 0.35, 0.68, "white"], ["bed2", 0.3, 5.6, 1.5, 1.4, 0.56, "white"],
      ["bath", 7.55, 0.95, 1.2, 0.04, 1.4, "white"],
    ],
    door: [6.4, 8],
  },
};

/** The model's colours belong to the look: --model-* custom properties on the canvas, else the look's own tokens. */
const MODEL = { bg: "--surface", wall: "--bg", edge: "--text", wood: "--surface-2", stone: "--surface-2", tile: "--surface", carpet: "--surface-2", unit: "--bg", white: "--bg", soft: "--line-2", pick: "--accent" };
/** @param {HTMLCanvasElement} canvas @returns {Record<string, any>} */
function palette(canvas) {
  const css = getComputedStyle(canvas), g = /** @type {CanvasRenderingContext2D} */ (document.createElement("canvas").getContext("2d"));
  /** @type {Record<string, any>} */ const out = { dim: 0.45 };
  for (const [k, base] of Object.entries(MODEL)) {
    const v = css.getPropertyValue(`--model-${k}`).trim() || css.getPropertyValue(base).trim() || "grey";
    g.fillStyle = "black"; g.fillStyle = v; out[k] = g.fillStyle;
  }
  return out;
}

/** @param {HTMLCanvasElement} canvas @param {any} opts */
export function createModel(canvas, opts) {
  const plan = PLANS.home, C = palette(canvas);
  const [W, D] = plan.size, cx = W / 2, cz = D / 2;
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.outputColorSpace = SRGBColorSpace; renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = PCFSoftShadowMap;
  const scene = new Scene(); scene.background = new Color(C.bg);
  const span = Math.max(W, D);
  const camera = new PerspectiveCamera(32, 1, 0.1, 200);
  scene.add(new HemisphereLight("#ffffff", "#c9ccd1", 1.5));
  const sun = new DirectionalLight("#ffffff", 2.2);
  sun.position.set(-span * 0.6, span * 1.2, span * 0.9); sun.castShadow = true;
  Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span }); sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005;
  scene.add(sun);
  const root = new Group(); root.position.set(-cx, 0, -cz); scene.add(root);
  const lines = new LineBasicMaterial({ color: C.edge, transparent: true, opacity: 0.35 });
  const pickable = [], byRoom = {};
  const mat = (hex, rough = 0.85) => new MeshStandardMaterial({ color: hex, roughness: rough, metalness: 0 });
  function box(w, h, d, x, y, z, m, room, edges = true) {
    const g = new BoxGeometry(w, h, d), mesh = new Mesh(g, m);
    mesh.position.set(x + w / 2, y + h / 2, z + d / 2); mesh.castShadow = mesh.receiveShadow = true;
    root.add(mesh);
    if (edges) { const l = new LineSegments(new EdgesGeometry(g), lines); l.position.copy(mesh.position); root.add(l); }
    if (room) { mesh.userData.room = room; pickable.push(mesh); (byRoom[room] ||= []).push(mesh); }
    return mesh;
  }
  // floors
  for (const r of plan.rooms) box(r.w - 0.02, 0.06, r.d - 0.02, r.x + 0.01, 0, r.z + 0.01, mat(C[r.floor], r.floor === "tile" ? 0.4 : 0.9), r.id, false).userData.floor = true;
  // walls: every room edge, low cutaway height; outer walls a little taller
  const T = 0.12, Hin = 1.1, Hout = Hin + 0.35, wm = mat(C.wall, 0.95);
  const seen = new Set();
  const wall = (x1, z1, x2, z2) => {
    const k = [x1, z1, x2, z2].map((v) => v.toFixed(2)).join(); if (seen.has(k)) return; seen.add(k);
    const outer = (x1 === x2 && (x1 === 0 || x1 === W)) || (z1 === z2 && (z1 === 0 || z1 === D)), h = outer ? Hout : Hin;
    if (x1 === x2) box(T, h, z2 - z1, x1 - T / 2, 0.06, z1, wm); else box(x2 - x1, h, T, x1, 0.06, z1 - T / 2, wm);
  };
  for (const r of plan.rooms) { wall(r.x, r.z, r.x + r.w, r.z); wall(r.x, r.z + r.d, r.x + r.w, r.z + r.d); wall(r.x, r.z, r.x, r.z + r.d); wall(r.x + r.w, r.z, r.x + r.w, r.z + r.d); }
  for (const [room, x, z, w, d, h, kind] of plan.things) box(w, h, d, x, 0.06, z, mat(C[kind], kind === "white" ? 0.3 : 0.8), room);
  // camera fit
  let yaw = opts.yaw ?? -0.62, raf = 0;
  const tilt = 0.86, dist = span * (opts.far || 1.65);
  function size() {
    const w = canvas.clientWidth || 600, h = canvas.clientHeight || 400; renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.fov = w / h < 1 ? 46 : 30;
    if (opts.shift && w > 760) camera.setViewOffset(w, h, w * opts.shift, 0, w, h); else camera.clearViewOffset?.();
    camera.updateProjectionMatrix();
  }
  function place() { camera.position.set(Math.sin(yaw) * Math.cos(tilt) * dist, Math.sin(tilt) * dist, Math.cos(yaw) * Math.cos(tilt) * dist); camera.lookAt(0, 0, 0); }
  function draw() { raf = 0; place(); renderer.render(scene, camera); opts.onDraw?.(); }
  const ask = () => { if (!raf) raf = requestAnimationFrame(draw); };
  function pick(id) {
    for (const [rid, meshes] of Object.entries(byRoom)) for (const m of meshes) {
      const base = new Color(m.userData.base ||= "#" + m.material.color.getHexString());
      const c = !id ? base : rid === id ? base.clone().lerp(new Color(C.pick), m.userData.floor ? 0.85 : 0.25) : base.clone().lerp(new Color(C.bg), C.dim);
      m.material.color.copy(c);
    }
    ask(); opts.onPick?.(id);
  }
  // pointer: horizontal drag turns, a tap picks
  const ray = new Raycaster(), p = new Vector2(); let down = null;
  canvas.style.touchAction = "pan-y";
  canvas.addEventListener("pointerdown", (e) => { down = { x: e.clientX, yaw, moved: false }; });
  canvas.addEventListener("pointermove", (e) => { if (!down) return; const dx = e.clientX - down.x; if (Math.abs(dx) > 4) { down.moved = true; yaw = down.yaw - dx * 0.008; ask(); } });
  canvas.addEventListener("pointerup", (e) => {
    if (down && !down.moved) { const r = canvas.getBoundingClientRect(); p.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(p, camera); const hit = ray.intersectObjects(pickable)[0]; pick(hit ? hit.object.userData.room : null); }
    down = null;
  });
  canvas.tabIndex = 0;
  canvas.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { yaw += e.key === "ArrowLeft" ? 0.12 : -0.12; ask(); e.preventDefault(); } });
  addEventListener("resize", () => { size(); ask(); });
  size(); ask();
  // screen position of each room's centre, for the look's own labels
  function anchors() {
    const out = {}; const r = canvas.getBoundingClientRect();
    for (const room of plan.rooms) { const v = new Vector3(room.x + room.w / 2 - cx, 0.1, room.z + room.d / 2 - cz).project(camera);
      out[room.id] = { x: ((v.x + 1) / 2) * r.width, y: ((1 - v.y) / 2) * r.height }; }
    return out;
  }
  return { pick, anchors, rooms: plan.rooms, turn(d) { yaw += d; ask(); } };
}
