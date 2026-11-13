// @ts-check
/**
 * The 3D house, loaded only when a visitor taps (esbuild puts it in its own chunk): a procedural house (terrace, semi
 * or detached, with its neighbours) and a rear extension in new brick with steel-framed sliding glass, a lit room
 * inside and a roof light or an all-glass roof. The same house shows a build stage by stage. No model file: walls,
 * roofs and glass are drawn from boxes, so the whole thing is the code (about 150 KB gzipped with three.js).
 *
 * It draws only when something changes (a drag, a choice, a short fade), never in a loop, so it costs nothing at
 * rest. A horizontal drag turns it; vertical swipes still scroll the page on a phone. Arrow keys turn it too.
 */
import {
  WebGLRenderer, Scene, Color, Fog, PerspectiveCamera, HemisphereLight, DirectionalLight, Group, Mesh, BoxGeometry,
  PlaneGeometry, CylinderGeometry, BufferGeometry, BufferAttribute, EdgesGeometry, LineSegments, LineBasicMaterial,
  LineDashedMaterial, Line, Vector3, MeshStandardMaterial, MeshPhysicalMaterial, CanvasTexture, RepeatWrapping, SRGBColorSpace,
  PCFSoftShadowMap, ACESFilmicToneMapping, DoubleSide, PMREMGenerator, Sprite, SpriteMaterial,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { HOUSES, WALL } from "../../lib/extension.js";
import { ROOF_MODEL, HIPS, dormerRange } from "../../lib/loft.js";

/** @typedef {import("../../lib/extension.js").House} House @typedef {import("../../lib/extension.js").Roof} Roof */
/** @typedef {"survey"|"groundworks"|"structure"|"envelope"|"firstfix"|"finish"} Phase */
/** @typedef {{ loft: string, width: number }} LoftState a conversion on the loft page: dormer, hip or both, and the dormer's width */
/** @typedef {{ house: House, depth: number, roof: Roof, show: "before"|"after", phase: Phase, loft?: LoftState | null }} State */

const PHASES = ["survey", "groundworks", "structure", "envelope", "firstfix", "finish"];
const H = 6.2;      // eaves height of the house
const D = ROOF_MODEL.depth; // depth of the house (the loft arithmetic uses the same roof)
const EXT_H = 3.0;  // height of the extension's walls

/**
 * The model's colours belong to the look: each is a CSS custom property (--model-lawn, --model-brick, …) read from the
 * canvas, so another look of this trade draws the same house in its own palette. A look that sets none falls back to
 * its own surface, line and text tokens. Every value is normalised to #rrggbb through a 2D context.
 * @param {HTMLCanvasElement} canvas
 */
function palette(canvas) {
  const css = getComputedStyle(canvas);
  const g = /** @type {CanvasRenderingContext2D} */ (document.createElement("canvas").getContext("2d"));
  /** @param {string} name @param {string} base a token every look sets */
  return (name, base) => {
    const v = css.getPropertyValue(`--model-${name}`).trim() || css.getPropertyValue(base).trim() || "grey";
    g.fillStyle = "black"; g.fillStyle = v;
    return /** @type {string} */ (g.fillStyle);
  };
}

/** A brick wall as a texture: stretcher bond, each brick a little different, lime mortar. @param {string} brick @param {string} mortar */
function brickTexture(brick, mortar) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 512;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext("2d"));
  g.fillStyle = mortar; g.fillRect(0, 0, 512, 512);
  let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const n = parseInt(brick.slice(1), 16), base = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  for (let y = 0; y < 512; y += 32) {
    const off = (y / 32) % 2 ? 48 : 0;
    for (let x = -96; x < 608; x += 96) {
      const l = 0.84 + rnd() * 0.24;
      g.fillStyle = `rgb(${base.map((v) => Math.min(255, v * l) | 0).join(",")})`;
      g.fillRect(x + off + 3, y + 3, 90, 26);
    }
  }
  const t = new CanvasTexture(c); t.wrapS = t.wrapT = RepeatWrapping; t.colorSpace = SRGBColorSpace; t.anisotropy = 8;
  return t;
}

/** Concrete blocks: big grey units with thin joints. */
/** @param {string} tone */
function blockTexture(tone) {
  const c = document.createElement("canvas"); c.width = 256; c.height = 256;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext("2d"));
  const n = parseInt(tone.slice(1), 16), base = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  g.fillStyle = `rgb(${base.map((v) => (v * 0.85) | 0).join(",")})`; g.fillRect(0, 0, 256, 256);
  let seed = 5; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let y = 0; y < 256; y += 64) for (let x = -128; x < 384; x += 128) {
    const off = (y / 64) % 2 ? 64 : 0, l = 0.92 + rnd() * 0.12;
    g.fillStyle = `rgb(${base.map((v) => Math.min(255, v * l) | 0).join(",")})`; g.fillRect(x + off + 2, y + 2, 124, 60);
  }
  const t = new CanvasTexture(c); t.wrapS = t.wrapT = RepeatWrapping; t.colorSpace = SRGBColorSpace;
  return t;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Partial<State>} start
 * @param {{ reduceMotion?: boolean, onTurn?: () => void, view?: "loft" }} [opts]
 */
export function createHouse(canvas, start, opts = {}) {
  /** @type {State} */
  const state = { house: "terrace", depth: 4, roof: "lantern", show: "after", phase: "finish", ...start };
  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = SRGBColorSpace;

  const tone = palette(canvas);
  const scene = new Scene();
  const sky = new Color(tone("sky", "--surface"));
  scene.background = sky; scene.fog = new Fog(sky, 45, 95);
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const camera = new PerspectiveCamera(32, 1, 0.1, 200);
  const hemi = new HemisphereLight(tone("light-sky", "--bg"), tone("light-ground", "--muted"), 0.85);
  scene.add(hemi);
  const sun = new DirectionalLight(tone("sun", "--bg"), 2.5);
  sun.position.set(-12, 18, 14); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 60 });
  sun.shadow.bias = -0.0004; sun.shadow.radius = 4;
  scene.add(sun);

  const oldBrick = brickTexture(tone("brick", "--line-2"), tone("mortar", "--surface"));
  const newBrick = brickTexture(tone("new-brick", "--line-2"), tone("new-mortar", "--bg"));
  const M = {
    lawn: new MeshStandardMaterial({ color: tone("lawn", "--surface-2"), roughness: 1 }),
    soil: new MeshStandardMaterial({ color: tone("soil", "--muted"), roughness: 1 }),
    paving: new MeshStandardMaterial({ color: tone("paving", "--surface"), roughness: 0.9 }),
    concrete: new MeshStandardMaterial({ color: tone("concrete", "--line-2"), roughness: 0.95 }),
    blocks: new MeshStandardMaterial({ map: blockTexture(tone("blocks", "--line-2")), roughness: 0.95 }),
    wall: new MeshStandardMaterial({ map: oldBrick, roughness: 0.92 }),
    neighbour: new MeshStandardMaterial({ color: tone("neighbour", "--surface"), roughness: 1 }),
    neighbourRoof: new MeshStandardMaterial({ color: tone("neighbour-roof", "--line-2"), roughness: 1, side: DoubleSide }),
    fence: new MeshStandardMaterial({ color: tone("fence", "--muted"), roughness: 0.95 }),
    roof: new MeshStandardMaterial({ color: tone("roof", "--text"), roughness: 0.75, side: DoubleSide }),
    frame: new MeshStandardMaterial({ color: tone("frame", "--text"), roughness: 0.45, metalness: 0.6 }),
    steel: new MeshStandardMaterial({ color: tone("steel", "--text"), roughness: 0.5, metalness: 0.7 }),
    trim: new MeshStandardMaterial({ color: tone("trim", "--bg"), roughness: 0.6 }),
    plaster: new MeshStandardMaterial({ color: tone("plaster", "--surface-2"), roughness: 0.95 }),
    glass: new MeshPhysicalMaterial({ color: tone("glass", "--accent-soft"), roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.45, envMapIntensity: 2.2, clearcoat: 1 }),
    glow: new MeshStandardMaterial({ color: tone("glow", "--bg"), emissive: tone("glow-light", "--bg"), emissiveIntensity: 0.55, roughness: 0.8 }),
    ext: new MeshStandardMaterial({ map: newBrick, roughness: 0.9 }),
    deck: new MeshStandardMaterial({ color: tone("deck", "--muted"), roughness: 0.8 }),
    oak: new MeshStandardMaterial({ color: tone("oak", "--line-2"), roughness: 0.7 }),
    timber: new MeshStandardMaterial({ color: tone("timber", "--line"), roughness: 0.85 }),
    line: new LineBasicMaterial({ color: tone("line", "--text"), transparent: true, opacity: 0.55 }),
    dash: new LineDashedMaterial({ color: tone("line", "--text"), dashSize: 0.35, gapSize: 0.22 }),
  };

  const ground = new Mesh(new PlaneGeometry(220, 220), M.lawn);
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  /** @type {Group} */ let house = new Group();
  /** @type {Group} */ let ext = new Group();
  scene.add(house, ext);

  /** @param {number} w @param {number} h @param {number} d @param {any} m @param {number} x @param {number} y @param {number} z @param {Group} into */
  const box = (w, h, d, m, x, y, z, into) => {
    const o = new Mesh(new BoxGeometry(w, h, d), m); o.position.set(x, y, z);
    o.castShadow = m !== M.glass; o.receiveShadow = true; // sunlight passes through the glass into the room
    into.add(o); return o;
  };
  /** A brick material repeated to the wall's size. @param {MeshStandardMaterial} mat @param {number} w @param {number} h */
  const sized = (mat, w, h) => { const m = mat.clone(); if (mat.map) { m.map = mat.map.clone(); m.map.needsUpdate = true; m.map.repeat.set(w / 2.2, h / 1.3); } return m; };

  const R = ROOF_MODEL.rise;
  /**
   * A pitched roof with its ridge across the width; either end hipped (equal pitch, so the hip runs in half the depth).
   * @param {number} cx @param {number} w @param {any} mat @param {Group} into @param {boolean} [hipL] @param {boolean} [hipR]
   */
  function roof(cx, w, mat, into, hipL = false, hipR = false) {
    const g = new BufferGeometry(), hw = w / 2 + 0.02, top = H + R, zr = -D / 2, zf = 0.2, zb = -D - 0.2;
    const xl = hipL ? -w / 2 + D / 2 : -hw, xr = hipR ? w / 2 - D / 2 : hw;
    const v = [
      -hw, H, zf, hw, H, zf, xr, top, zr, -hw, H, zf, xr, top, zr, xl, top, zr,
      -hw, H, zb, xl, top, zr, xr, top, zr, -hw, H, zb, xr, top, zr, hw, H, zb,
    ];
    if (hipL) v.push(-hw, H, zf, xl, top, zr, -hw, H, zb);
    if (hipR) v.push(hw, H, zf, hw, H, zb, xr, top, zr);
    g.setAttribute("position", new BufferAttribute(new Float32Array(v), 3));
    g.computeVertexNormals();
    const m = new Mesh(g, mat); m.position.x = cx; m.castShadow = m.receiveShadow = true; into.add(m);
  }

  /** A new gable wall where a hip was, in new brick. @param {number} x the end wall's position */
  function gable(x) {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(new Float32Array([x, H, 0, x, H, -D, x, H + R, -D / 2]), 3));
    g.setAttribute("uv", new BufferAttribute(new Float32Array([0, 0, D / 2.2, 0, D / 4.4, R / 1.3]), 2));
    g.computeVertexNormals();
    const mat = sized(M.ext, 1, 1); mat.side = DoubleSide; mat.map?.repeat.set(1, 1);
    const m = new Mesh(g, mat); m.castShadow = m.receiveShadow = true; house.add(m);
  }

  /** A rear dormer, the same shape as lib/loft.js dormerSection(): from just below the ridge to its face, back from the eaves. @param {number} w @param {number} x0 */
  function dormer(w, x0) {
    const run = D / 2, h = R - ROOF_MODEL.dormerDrop, s0 = run * (1 - h / R);
    const a = run - ROOF_MODEL.eavesBack * Math.cos(Math.atan2(R, run));
    const z1 = -run + s0, z2 = -run + a, yb = H + 0.04, len = z2 - z1;
    box(w, h - 0.04, len, M.roof, x0, (yb + H + h) / 2, (z1 + z2) / 2, house);
    box(w + 0.12, 0.08, len + 0.1, M.frame, x0, H + h + 0.04, (z1 + z2) / 2 + 0.03, house);
    const gw = Math.min(w - 0.5, 3.2);
    box(gw + 0.12, 1.34, 0.05, M.trim, x0, H + h - 0.9, z2 + 0.03, house);
    box(gw, 1.2, 0.06, M.glass, x0, H + h - 0.9, z2 + 0.05, house);
  }

  /** The house's own roof: plain, or on the loft page with its hips, new gables and dormer. @param {number} W */
  function houseRoof(W) {
    const lf = state.loft, after = !!lf && state.show === "after";
    const hips = lf ? (HIPS[state.house] ?? 0) : 0;
    // A semi's outer end is the right; a detached house is hipped at both. A hip-to-gable makes them gables.
    const gabled = after && lf?.loft !== "dormer";
    const hipR = hips >= 1 && !gabled, hipL = hips >= 2 && !gabled;
    roof(0, W, M.roof, house, hipL, hipR);
    if (gabled) { if (hips >= 1) gable(W / 2); if (hips >= 2) gable(-W / 2); }
    const range = lf ? dormerRange(state.house, lf.loft) : null;
    if (!after || !range || !lf || lf.width <= 0) return;
    const w = Math.min(range.max, Math.max(range.min, lf.width));
    const left = -W / 2 + WALL + (hipL ? D / 2 : 0), right = W / 2 - WALL - (hipR ? D / 2 : 0);
    dormer(w, (left + right) / 2);
  }

  function buildHouse() {
    scene.remove(house); dispose(house); house = new Group(); scene.add(house);
    const spec = HOUSES[state.house] ?? HOUSES.terrace, W = spec.width;
    box(W, H, D, sized(M.wall, W, H), 0, H / 2, -D / 2, house);
    houseRoof(W);
    const n = state.house === "detached" ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * (W / n);
      box(1.05, 1.5, 0.06, M.trim, x, 4.35, 0.03, house); box(0.9, 1.35, 0.07, M.glass, x, 4.35, 0.05, house);
    }
    const nb = (/** @type {number} */ x) => {
      box(W, H, D, M.neighbour, x, H / 2, -D / 2, house); roof(x, W, M.neighbourRoof, house);
      box(0.06, 1.2, 9, M.fence, x > 0 ? x - W / 2 : x + W / 2, 0.6, 4.5, house); // the garden fence on the boundary
    };
    if (spec.neighbours.includes("left")) nb(-W - 0.02);
    if (spec.neighbours.includes("right")) nb(W + 0.02);
  }

  /** The back of the house where the extension meets it: a door and a window before, an opening after. @param {boolean} opened @param {number} x0 @param {number} w */
  function oldBack(opened, x0, w) {
    if (opened) return;
    box(0.95, 2.1, 0.06, M.trim, x0 - w * 0.22, 1.05, 0.03, ext); box(0.8, 1.95, 0.07, M.frame, x0 - w * 0.22, 1.02, 0.05, ext);
    box(1.4, 1.3, 0.06, M.trim, x0 + w * 0.18, 1.6, 0.03, ext); box(1.25, 1.15, 0.07, M.glass, x0 + w * 0.18, 1.6, 0.05, ext);
    const pav = new Mesh(new PlaneGeometry(w + 0.6, 3), M.paving); pav.rotation.x = -Math.PI / 2; pav.position.set(x0, 0.01, 1.5); pav.receiveShadow = true; ext.add(pav);
  }

  function buildExt() {
    scene.remove(ext); dispose(ext); ext = new Group(); scene.add(ext);
    const spec = HOUSES[state.house] ?? HOUSES.terrace;
    const W = spec.extWidth, d = state.depth;
    const x0 = state.house === "detached" ? -spec.width / 2 + W / 2 + 0.4 : 0;
    const p = PHASES.indexOf(state.phase);
    if (state.show === "before" || state.loft) { oldBack(false, x0, W); return; }
    oldBack(p >= PHASES.indexOf("structure"), x0, W);

    if (p === 0) { // survey: the extension pegged out on the lawn
      const pts = [[-W / 2, 0], [W / 2, 0], [W / 2, d], [-W / 2, d], [-W / 2, 0]].map(([x, z]) => new Vector3(x0 + x, 0.04, z));
      const l = new Line(new BufferGeometry().setFromPoints(pts), M.dash); l.computeLineDistances(); ext.add(l);
      for (const [x, z] of [[-W / 2, d], [W / 2, d], [-W / 2, 0.2], [W / 2, 0.2]]) box(0.06, 0.5, 0.06, M.timber, x0 + x, 0.25, z, ext);
      return;
    }
    if (p === 1) { // groundworks: the trench dug and the footings poured
      for (const [w, dd, x, z] of [[W, 0.7, 0, d - 0.35], [0.7, d, -W / 2 + 0.35, d / 2], [0.7, d, W / 2 - 0.35, d / 2]]) {
        box(w, 0.06, dd, M.soil, x0 + x, 0.02, z, ext);
        box(w * 0.86, 0.12, dd * 0.86, M.concrete, x0 + x, 0.07, z, ext);
      }
      for (const [x, z] of [[-W / 2 - 1.2, d + 1.2], [W / 2 + 1.4, d + 0.6]]) box(1.6, 0.5, 1.2, M.soil, x0 + x, 0.25, z, ext); // spoil, neatly heaped
      return;
    }
    // From the structure on: a slab, walls, steel.
    box(W, 0.15, d, M.concrete, x0, 0.075, d / 2, ext);
    const wallH = p === 2 ? EXT_H * 0.55 : EXT_H;
    const wallMat = p === 2 ? sized(M.blocks, d, wallH) : sized(M.ext, d, EXT_H);
    box(WALL, wallH, d, wallMat, x0 - W / 2 + WALL / 2, wallH / 2, d / 2, ext);
    box(WALL, wallH, d, wallMat, x0 + W / 2 - WALL / 2, wallH / 2, d / 2, ext);
    box(W, 0.36, 0.36, M.steel, x0, EXT_H - 0.12, d - 0.04, ext);                       // the steel over the opening
    box(0.2, EXT_H - 0.3, 0.2, M.steel, x0 - W / 2 + 0.45, (EXT_H - 0.3) / 2, d - 0.1, ext);
    box(0.2, EXT_H - 0.3, 0.2, M.steel, x0 + W / 2 - 0.45, (EXT_H - 0.3) / 2, d - 0.1, ext);
    if (p === 2) return;

    // The envelope: the roof on and the glass in. Dry from here.
    const panels = 4, pw = (W - 2 * WALL) / panels;
    for (let i = 0; i < panels; i++) {
      const px = x0 - (W - 2 * WALL) / 2 + pw * (i + 0.5);
      box(pw - 0.06, EXT_H - 0.45, 0.04, M.glass, px, (EXT_H - 0.45) / 2 + 0.12, d - 0.02, ext);
      box(0.06, EXT_H - 0.4, 0.1, M.frame, px - pw / 2, (EXT_H - 0.4) / 2 + 0.1, d - 0.02, ext);
    }
    box(W - 2 * WALL, 0.1, 0.12, M.frame, x0, EXT_H - 0.28, d - 0.02, ext);
    if (state.roof === "lantern") {
      box(W, 0.25, d, M.deck, x0, EXT_H + 0.12, d / 2, ext);
      const lw = Math.min(W - 1.8, 3.2), ld = Math.max(1.2, d - 2), ly = EXT_H + 0.25;
      box(lw + 0.16, 0.18, ld + 0.16, M.frame, x0, ly + 0.09, d / 2, ext);
      const pitch = new Mesh(new CylinderGeometry(0.001, (lw / 2) * 1.15, 0.75, 4, 1), M.glass); pitch.castShadow = false;
      pitch.scale.set(1, 1, ld / lw); pitch.rotation.y = Math.PI / 4; pitch.position.set(x0, ly + 0.55, d / 2); ext.add(pitch);
      pitch.add(new LineSegments(new EdgesGeometry(pitch.geometry), M.line));
    } else {
      const len = Math.hypot(d, 0.7), tilt = Math.atan2(0.7, d);
      const g = new Mesh(new BoxGeometry(W - 0.4, 0.05, len), M.glass); g.position.set(x0, EXT_H + 0.2, d / 2); g.rotation.x = tilt; g.receiveShadow = true; ext.add(g);
      for (let i = 0; i <= 4; i++) box(0.06, 0.08, len, M.frame, x0 - (W - 0.4) / 2 + (i * (W - 0.4)) / 4, EXT_H + 0.24, d / 2, ext).rotation.x = tilt;
    }
    if (p === 3) return;
    // Inside: first fix is bare plaster; the finish is oak, light and a kitchen.
    if (p === 4) { box(W - 0.8, EXT_H - 0.4, 0.05, M.plaster, x0, EXT_H / 2, 0.08, ext); return; }
    box(W - 2 * WALL, 0.12, d, M.oak, x0, 0.16, d / 2, ext);
    box(W - 0.8, EXT_H - 0.4, 0.05, M.glow, x0, EXT_H / 2, 0.08, ext);
    box(Math.min(2.2, W - 2), 0.9, 0.8, M.trim, x0 - 0.2, 0.67, d * 0.45, ext);
    const pav = new Mesh(new PlaneGeometry(W + 0.6, 2.2), M.paving); pav.rotation.x = -Math.PI / 2; pav.position.set(x0, 0.012, d + 1.1); pav.receiveShadow = true; ext.add(pav);
    const outline = new LineSegments(new EdgesGeometry(new BoxGeometry(W, EXT_H + 0.25, d)), M.line);
    outline.position.set(x0, (EXT_H + 0.25) / 2, d / 2); ext.add(outline);
  }

  /** @param {Group} g */
  function dispose(g) {
    g.traverse((o) => {
      const m = /** @type {any} */ (o);
      m.geometry?.dispose?.();
      // Sized brick materials are clones made for this group; the shared ones in M are kept.
      if (m.material && !Object.values(M).includes(m.material)) { m.material.map?.dispose?.(); m.material.dispose?.(); }
    });
  }

  // The view: turn round the back of the house within a limited arc, from a little above the garden.
  const loftView = opts.view === "loft";
  const target = loftView ? new Vector3(0, H + 0.6, -D / 2 + 1.2) : new Vector3(0, 3.2, 1.0);
  // The loft view starts from the right: a semi's outer end, where a hip-to-gable shows.
  let az = loftView ? 0.62 : -0.62, azFrom = az;
  const AZ_MIN = -1.15, AZ_MAX = 1.15;
  function place() {
    const W = (HOUSES[state.house] ?? HOUSES.terrace).width;
    const tall = canvas.clientWidth < canvas.clientHeight;
    const dist = (18 + W * 0.8) * (tall ? 1.02 : 1) * (loftView && !tall ? 1.3 : 1);
    const y = loftView ? (tall ? H + 6.5 : H + 4.6) : (tall ? 7.5 : 5.6);
    camera.position.set(target.x + Math.sin(az) * dist, y, target.z + Math.cos(az) * dist);
    camera.lookAt(target);
  }
  function size() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w < h ? 42 : 32; camera.updateProjectionMatrix();
  }

  let frame = 0;
  const draw = () => { frame = 0; place(); renderer.render(scene, camera); };
  const redraw = () => { if (!frame) frame = requestAnimationFrame(draw); };
  const ro = new ResizeObserver(() => { size(); redraw(); });
  ro.observe(canvas);

  // Drag to turn: horizontal only on touch, so the page still scrolls; keys for anyone not using a pointer.
  /** @type {{ x: number, az: number } | null} */ let drag = null;
  canvas.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, az }; try { canvas.setPointerCapture(e.pointerId); } catch { /* the pointer has already gone */ } });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag) return;
    az = Math.max(AZ_MIN, Math.min(AZ_MAX, drag.az - ((e.clientX - drag.x) / Math.max(320, canvas.clientWidth)) * 2.4));
    opts.onTurn?.(); redraw();
  });
  const end = () => { drag = null; };
  canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
  canvas.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault(); az = Math.max(AZ_MIN, Math.min(AZ_MAX, az + (e.key === "ArrowLeft" ? 0.12 : -0.12))); opts.onTurn?.(); redraw();
  });

  // One slow quarter-turn into the resting view when it first appears, then still.
  function settle() {
    if (opts.reduceMotion) { redraw(); return; }
    azFrom = az + 0.35; const goal = az; const t0 = performance.now();
    const step = (/** @type {number} */ t) => {
      const k = Math.min(1, (t - t0) / 2400), e = 1 - (1 - k) ** 3;
      if (!drag) az = azFrom + (goal - azFrom) * e;
      draw(); if (k < 1 && !drag) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  buildHouse(); buildExt(); size(); settle();

  // The planning guide: the permitted-development depth and the prior-approval depth drawn across the garden.
  /** @type {Group} */ let limits = new Group(); scene.add(limits);
  /** A small label drawn on a canvas, always facing the camera. @param {string} text @param {string} colour */
  const label = (text, colour) => {
    const c = document.createElement("canvas"); c.width = 256; c.height = 96;
    const g = /** @type {CanvasRenderingContext2D} */ (c.getContext("2d"));
    g.font = "600 60px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillStyle = tone("label-bg", "--bg"); g.fillRect(28, 12, 200, 72);
    g.fillStyle = colour; g.fillText(text, 128, 50);
    const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace;
    const sp = new Sprite(new SpriteMaterial({ map: t, depthTest: false })); sp.scale.set(2.2, 0.82, 1); sp.renderOrder = 10;
    return sp;
  };
  /** @param {{ pd: number, prior: number } | null} l */
  function setLimits(l) {
    scene.remove(limits); dispose(limits); limits = new Group(); scene.add(limits);
    if (!l) { redraw(); return; }
    const W = (HOUSES[state.house] ?? HOUSES.terrace).width + 1.2;
    for (const [d, key] of /** @type {[number, string][]} */ ([[l.pd, "limit"], [l.prior, "limit-far"]])) {
      const colour = tone(key, key === "limit" ? "--accent" : "--muted");
      const mat = new LineDashedMaterial({ color: colour, dashSize: 0.3, gapSize: 0.18, depthTest: false });
      const line = new Line(new BufferGeometry().setFromPoints([new Vector3(-W / 2, 0.06, d), new Vector3(W / 2, 0.06, d)]), mat);
      line.computeLineDistances(); line.renderOrder = 9; limits.add(line);
      const tag = label(`${d} m`, colour); tag.position.set(W / 2 + 0.6, 0.5, d); limits.add(tag);
    }
    redraw();
  }

  // The light study: the sun moved to its real height and bearing, the garden turned to face its own way.
  const day = { sky: new Color(tone("sky", "--surface")), night: new Color(tone("sky-night", "--text")) };
  /** @param {{ elevation: number, azimuth: number, facing: number } | null} sunAt */
  function setSun(sunAt) {
    if (!sunAt) { sun.position.set(-12, 18, 14); sun.intensity = 2.5; hemi.intensity = 0.85; scene.environmentIntensity = 1; scene.background = day.sky; redraw(); return; }
    const el = sunAt.elevation * Math.PI / 180, rel = (sunAt.azimuth - sunAt.facing) * Math.PI / 180;
    const up = Math.max(0, Math.sin(el));
    // The garden faces +z; looking out from the house, a bearing clockwise of it is on the left of the scene (-x).
    sun.position.set(-Math.sin(rel) * Math.cos(el) * 30, Math.max(0.5, Math.sin(el) * 30), Math.cos(rel) * Math.cos(el) * 30);
    sun.intensity = sunAt.elevation > 0 ? 1.2 + 2.4 * Math.min(1, up * 2.2) : 0;
    hemi.intensity = sunAt.elevation > 0 ? 0.22 + 0.3 * Math.min(1, up * 3) : 0.16;
    scene.environmentIntensity = sunAt.elevation > 0 ? 0.35 + 0.35 * Math.min(1, up * 3) : 0.12;
    const sky = day.night.clone().lerp(day.sky, Math.min(1, Math.max(0, (sunAt.elevation + 6) / 16)));
    scene.background = sky; /** @type {Fog} */ (scene.fog).color = sky;
    M.glow.emissiveIntensity = sunAt.elevation > 2 ? 0.12 : 1.1;
    redraw();
  }

  return {
    setLimits,
    setSun,
    /** @param {Partial<State>} next */
    set(next) {
      const houseChanged = (next.house !== undefined && next.house !== state.house) || next.loft !== undefined || (state.loft && next.show !== undefined);
      Object.assign(state, next);
      if (houseChanged) buildHouse();
      buildExt(); redraw();
    },
    /** The current turn, for tests and the page: -1.15 (left) to 1.15 (right). */
    get turn() { return az; },
    get state() { return { ...state }; },
    destroy() { ro.disconnect(); dispose(house); dispose(ext); renderer.dispose(); },
  };
}
