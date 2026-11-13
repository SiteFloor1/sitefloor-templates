// @ts-check
/**
 * The house at night, in 3D: a glass pavilion under a stone first floor, a sunken cinema court, a terrace, a lit pool
 * and a garden of cypresses, at blue hour. Built here from boxes and canvas textures (no model file), so it belongs to
 * no real home and stays light. Loaded only when a visitor taps "Light the house" (house-3d.js imports this file).
 *
 * Every fitting drawn is one the client lists in site.json ("house3d.rooms"): downlights in the ceilings and under the
 * terrace canopy, wall lights in pairs, pendants over the island and the table, strips under the cupboards and on the
 * cinema risers, uplights on the walls and the trees, path lights, wall grazers on the garden wall, pool lights. The
 * quote counts the same fittings, so what is lit is what is priced.
 *
 * Lights warm as they dim, the way good LED fittings do (dim-to-warm): full is the chosen colour, low is candle-warm.
 * Bloom gives the fittings their glow. Nothing moves with the page's scroll; the camera drifts slowly while nobody is
 * touching it (not with reduced motion), and drawing stops when the house is off screen.
 */
import {
  ACESFilmicToneMapping, AdditiveBlending, BackSide, BoxGeometry, BufferGeometry, CanvasTexture, CircleGeometry, Clock,
  Color, ConeGeometry, CylinderGeometry, DirectionalLight, DoubleSide, Float32BufferAttribute, FogExp2, Group,
  IcosahedronGeometry, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, Path, PCFSoftShadowMap,
  PerspectiveCamera, PlaneGeometry, PMREMGenerator, PointLight, Points, PointsMaterial, Raycaster, RepeatWrapping,
  Scene, ShaderMaterial, Shape, ShapeGeometry, SphereGeometry, SpotLight, SRGBColorSpace, Vector2, Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { ROOMS } from "../../lib/house.js";

const UP = new Vector3(0, 1, 0);
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = () => matchMedia("(pointer: coarse)").matches;
const clamp01 = (/** @type {number} */ v) => Math.min(1, Math.max(0, v));
const ease = (/** @type {number} */ t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Light colour at a temperature (kelvin), Tanner Helland's fit, into `out` (linear). @param {number} k @param {Color} out */
function kelvin(k, out) {
  const t = k / 100;
  const r = t <= 66 ? 255 : 329.698727446 * (t - 60) ** -0.1332047592;
  const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * (t - 60) ** -0.0755148492;
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  return out.setRGB(clamp01(r / 255), clamp01(g / 255), clamp01(b / 255), SRGBColorSpace);
}

/** A seeded random, so the garden is the same for everyone. */
function seeded(seed = 7) { let s = seed; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; }

/** @param {number} w @param {number} h @param {(g: CanvasRenderingContext2D, w: number, h: number) => void} draw */
function canvasTex(w, h, draw, colour = true) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(/** @type {CanvasRenderingContext2D} */ (c.getContext("2d")), w, h);
  const t = new CanvasTexture(c);
  if (colour) t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  t.anisotropy = 4;
  return t;
}
/** Speckle over a base colour. @param {CanvasRenderingContext2D} g */
function speckle(g, w, h, n, alpha, rnd) {
  for (let i = 0; i < n; i++) {
    const v = Math.floor(rnd() * 255);
    g.fillStyle = `rgba(${v},${v},${v},${alpha * rnd()})`;
    g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2);
  }
}

/** Coursed limestone, long thin courses, for the first floor and the garden wall. */
function limestone() {
  const rnd = seeded(11);
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = "#b3a891"; g.fillRect(0, 0, w, h);
    const course = 32;
    for (let y = 0; y < h; y += course) {
      let x = -rnd() * 200;
      while (x < w) {
        const len = 120 + rnd() * 220;
        const v = 168 + Math.floor(rnd() * 26);
        g.fillStyle = `rgb(${v},${v - 9},${v - 28})`;
        g.fillRect(x + 1, y + 1, len - 2, course - 2);
        x += len;
      }
      g.fillStyle = "rgba(60,52,40,.35)"; g.fillRect(0, y, w, 1);
    }
    speckle(g, w, h, 9000, 0.12, rnd);
  });
}
/** Board-marked pale concrete for the canopy and the slabs. */
function concrete() {
  const rnd = seeded(5);
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = "#cfcac0"; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 24) { g.fillStyle = `rgba(90,85,75,${0.04 + rnd() * 0.06})`; g.fillRect(x, 0, 1, h); }
    speckle(g, w, h, 12000, 0.1, rnd);
  });
}
/** Wide oak boards. */
function oakBoards() {
  const rnd = seeded(3);
  return canvasTex(512, 512, (g, w, h) => {
    for (let y = 0; y < h; y += 42) {
      const v = 112 + Math.floor(rnd() * 26);
      g.fillStyle = `rgb(${v},${Math.floor(v * 0.74)},${Math.floor(v * 0.5)})`; g.fillRect(0, y, w, 42);
      g.fillStyle = "rgba(30,20,10,.35)"; g.fillRect(0, y, w, 1);
      for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(40,25,10,${rnd() * 0.12})`; g.fillRect(0, y + rnd() * 42, w, 1); }
    }
  });
}
/** Large stone slabs for the terrace. */
function slabs() {
  const rnd = seeded(9);
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = "#8c867b"; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 128) for (let x = 0; x < w; x += 256) {
      const v = 128 + Math.floor(rnd() * 20);
      g.fillStyle = `rgb(${v},${v - 5},${v - 14})`; g.fillRect(x + 2, y + 2, 252, 124);
    }
    speckle(g, w, h, 8000, 0.12, rnd);
  });
}
/** Lawn at night: a dark, slightly mottled green. */
function lawnTex() {
  const rnd = seeded(21);
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = "#3d5243"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${20 + rnd() * 30},${40 + rnd() * 40},${24 + rnd() * 20},.5)`; g.fillRect(rnd() * w, rnd() * h, 1, 2 + rnd() * 3); }
  });
}
/** A painting for the living room wall: three quiet fields of colour. */
function painting() {
  return canvasTex(256, 192, (g, w, h) => {
    g.fillStyle = "#d7cbb5"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#b5643f"; g.fillRect(18, 18, w * 0.42, h - 36);
    g.fillStyle = "#2f3e5c"; g.fillRect(w * 0.52, 18, w * 0.4, h * 0.55);
    g.fillStyle = "#8d8a5a"; g.fillRect(w * 0.52, h * 0.62, w * 0.4, h * 0.26);
  });
}
/** A soft round glow, white centre to nothing. */
function glowTex() {
  return canvasTex(128, 128, (g) => {
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.3, "rgba(255,255,255,.45)"); r.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  }, false);
}
/** A beam: bright at the top, fading down and to the sides (for cones and wall washes). */
function beamTex() {
  return canvasTex(64, 256, (g) => {
    const v = g.createLinearGradient(0, 0, 0, 256);
    v.addColorStop(0, "rgba(255,255,255,1)"); v.addColorStop(0.35, "rgba(255,255,255,.4)"); v.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = v; g.fillRect(0, 0, 64, 256);
    g.globalCompositeOperation = "destination-in";
    const hz = g.createLinearGradient(0, 0, 64, 0);
    hz.addColorStop(0, "rgba(0,0,0,0)"); hz.addColorStop(0.5, "rgba(0,0,0,1)"); hz.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = hz; g.fillRect(0, 0, 64, 256);
  }, false);
}

const WATER_VERT = /* glsl */ `
varying vec3 vPos;
void main() { vec4 w = modelMatrix * vec4(position, 1.0); vPos = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const WATER_FRAG = /* glsl */ `
uniform float uTime; uniform float uLevel; uniform vec3 uSky; uniform vec3 uLights[6]; uniform int uCount;
varying vec3 vPos;
float caustic(vec2 p, float t) {
  vec2 i = p; float c = 1.0; float inten = 0.006;
  for (int n = 0; n < 4; n++) {
    float tt = t * (1.0 - (3.5 / float(n + 1)));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
  }
  c /= 4.0; c = 1.17 - pow(c, 1.4);
  return clamp(pow(abs(c), 8.0), 0.0, 1.0);
}
void main() {
  vec3 view = normalize(cameraPosition - vPos);
  float fres = pow(1.0 - max(view.y, 0.0), 4.0);
  float k = caustic(vPos.xz * 1.1, uTime * 0.35);
  float spots = 0.0;
  for (int j = 0; j < 6; j++) { if (j >= uCount) break; vec2 d = vPos.xz - uLights[j].xz; spots += exp(-dot(d, d) * 0.55); }
  vec3 deep = vec3(0.012, 0.11, 0.16);
  vec3 bright = vec3(0.2, 0.6, 0.66);
  vec3 lit = mix(deep, bright, 0.15 + 0.85 * k) * (0.45 + 1.8 * spots);
  vec3 dark = vec3(0.006, 0.014, 0.026) + 0.02 * k;
  vec3 col = mix(dark, lit, uLevel);
  col = mix(col, uSky, fres * 0.4);
  gl_FragColor = vec4(col, 1.0);
}`;
const SCREEN_FRAG = /* glsl */ `
uniform float uTime; uniform float uOn; varying vec2 vUv;
void main() {
  float a = 0.5 + 0.5 * sin(uTime * 0.7 + vUv.x * 2.0);
  float b = 0.5 + 0.5 * sin(uTime * 1.3 + vUv.y * 3.0 + 1.7);
  vec3 c = mix(vec3(0.18, 0.32, 0.6), vec3(0.95, 0.55, 0.3), a * 0.6) * (0.55 + 0.45 * b);
  gl_FragColor = vec4(c * uOn * 2.2, 1.0);
}`;
const SKY_FRAG = /* glsl */ `
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 zenith = vec3(0.012, 0.022, 0.06);
  vec3 mid = vec3(0.03, 0.06, 0.14);
  vec3 band = vec3(0.16, 0.18, 0.34);
  vec3 col = mix(band, mid, smoothstep(0.0, 0.18, h));
  col = mix(col, zenith, smoothstep(0.18, 0.75, h));
  float glow = pow(max(dot(normalize(vec3(d.x, 0.0, d.z)), normalize(vec3(0.35, 0.0, -1.0))), 0.0), 6.0) * (1.0 - smoothstep(0.0, 0.28, h));
  col += vec3(0.32, 0.2, 0.24) * glow * 0.55;
  col = mix(vec3(0.02, 0.03, 0.05), col, smoothstep(-0.08, 0.0, h));
  gl_FragColor = vec4(col, 1.0);
}`;

/**
 * @typedef {{ id: string, fittings: Record<string, number> }} RoomCfg
 * @typedef {{ mat: MeshBasicMaterial, base: number, cool?: boolean }} Glow
 * @typedef {{ light: PointLight|SpotLight, base: number }} Lamp
 * @typedef {{ id: string, level: number, target: number, delay: number, lamps: Lamp[], glows: Glow[], centre: Vector3, view: { pos: Vector3, target: Vector3 } }} Room
 */

/**
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLElement} labels a layer over the canvas for the room names
 * @param {{ rooms: RoomCfg[], onPick: (id: string) => void, onFirstFrame?: () => void }} o
 */
export function villaScene(canvas, labels, o) {
  const phone = coarse();
  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, phone ? 1.4 : 1.75));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = !phone;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;

  const scene = new Scene();
  scene.fog = new FogExp2(0x0c1424, 0.0085);
  const world = new Group();
  scene.add(world);
  const disposables = /** @type {{ dispose: () => void }[]} */ ([]);

  // ------------------------------------------------------------------ sky, stars, moon, the far trees
  const skyMat = new ShaderMaterial({ vertexShader: "varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }", fragmentShader: SKY_FRAG, side: BackSide, depthWrite: false, fog: false });
  const sky = new Mesh(new SphereGeometry(500, 32, 16), skyMat);
  scene.add(sky);
  {
    const rnd = seeded(42); const pts = [];
    for (let i = 0; i < 1400; i++) {
      const az = rnd() * Math.PI * 2; const el = Math.asin(0.08 + rnd() * 0.92);
      pts.push(Math.cos(el) * Math.cos(az) * 450, Math.sin(el) * 450, Math.cos(el) * Math.sin(az) * 450);
    }
    const g = new BufferGeometry(); g.setAttribute("position", new Float32BufferAttribute(pts, 3));
    scene.add(new Points(g, new PointsMaterial({ color: 0xc9d3ff, size: 1.1, sizeAttenuation: false, transparent: true, opacity: 0.75, fog: false, depthWrite: false })));
    const moonDisc = new Mesh(new CircleGeometry(3.6, 32), new MeshBasicMaterial({ color: new Color(1.25, 1.28, 1.36), fog: false }));
    moonDisc.position.set(230, 100, -350); moonDisc.lookAt(0, 0, 0); scene.add(moonDisc);
    // the far tree line, a ragged dark band fading into the haze
    const rows = [];
    for (let i = 0; i <= 900; i++) {
      const a = (i / 900) * Math.PI * 2; const r = 240;
      const crown = Math.abs(Math.sin(i * 0.55)) ** 0.6 * 3.2 + Math.abs(Math.sin(i * 0.137 + 1)) * 4;
      rows.push([Math.cos(a) * r, Math.sin(a) * r, 2 + crown + rnd() * 0.8]);
    }
    const pos = [];
    for (let i = 0; i < rows.length - 1; i++) {
      const [x0, z0, t0] = rows[i]; const [x1, z1, t1] = rows[i + 1];
      pos.push(x0, -1, z0, x1, -1, z1, x1, t1, z1, x0, -1, z0, x1, t1, z1, x0, t0, z0);
    }
    const tg = new BufferGeometry(); tg.setAttribute("position", new Float32BufferAttribute(pos, 3));
    scene.add(new Mesh(tg, new MeshBasicMaterial({ color: 0x070c16, side: DoubleSide })));
  }
  // reflections in the glass and the water come from this sky alone
  const pmrem = new PMREMGenerator(renderer);
  const envScene = new Scene(); envScene.add(new Mesh(new SphereGeometry(10, 32, 16), skyMat));
  const env = pmrem.fromScene(envScene, 0.02).texture;
  scene.environment = env; scene.environmentIntensity = 0.75;
  pmrem.dispose();
  disposables.push(env);

  // ------------------------------------------------------------------ materials
  const T = { lime: limestone(), conc: concrete(), oak: oakBoards(), slab: slabs(), lawn: lawnTex(), art: painting(), glow: glowTex(), beam: beamTex() };
  for (const t of Object.values(T)) disposables.push(t);
  /** @param {any} t @param {number} [rx] @param {number} [ry] */
  const tex = (t, rx = 1, ry = 1) => { const c = t.clone(); c.repeat.set(rx, ry); c.needsUpdate = true; disposables.push(c); return c; };
  const std = (/** @type {any} */ p) => new MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...p });
  const M = {
    lime: std({ map: tex(T.lime, 3, 1), roughness: 0.92 }),
    limeWall: std({ map: tex(T.lime, 6, 0.6), roughness: 0.95 }),
    conc: std({ map: tex(T.conc, 4, 1), roughness: 0.9 }),
    plaster: std({ color: 0xe8e2d6, roughness: 0.95 }),
    ceiling: std({ color: 0xf0e9de, roughness: 0.95 }),
    oak: std({ map: tex(T.oak, 3, 3), roughness: 0.55 }),
    darkOak: std({ color: 0x3b2a1e, roughness: 0.5 }),
    slab: std({ map: tex(T.slab, 6, 3), roughness: 0.82 }),
    lawn: std({ map: tex(T.lawn, 0.25, 0.25), roughness: 1, envMapIntensity: 0.4 }),
    bronze: std({ color: 0x2b241c, roughness: 0.38, metalness: 0.75 }),
    ink: std({ color: 0x15171c, roughness: 0.6 }),
    fabric: std({ color: 0x8c8679, roughness: 1 }),
    velvet: std({ color: 0x3a2330, roughness: 0.95 }),
    stoneTop: std({ color: 0xe9e4da, roughness: 0.22 }),
    leaf: std({ color: 0x34493b, roughness: 1, envMapIntensity: 0.3 }),
    hedge: std({ color: 0x1f3024, roughness: 1 }),
    pot: std({ color: 0x5c5248, roughness: 0.9 }),
    linen: std({ color: 0xe5e0d6, roughness: 1 }),
    cinemaWall: std({ color: 0x1d1b22, roughness: 1 }),
    art: std({ map: T.art, roughness: 0.9 }),
    glass: new MeshPhysicalMaterial({ color: 0x9fb2c9, roughness: 0.03, metalness: 0, transparent: true, opacity: 0.2, envMapIntensity: 2.2, depthWrite: false, side: DoubleSide }),
    frosted: new MeshStandardMaterial({ color: 0xdfe4ea, roughness: 1, transparent: true, opacity: 0.7, emissive: 0x000000 }),
  };
  for (const m of Object.values(M)) disposables.push(m);

  /** A box from corner to corner. */
  const slab = (/** @type {number} */ x0, x1, y0, y1, z0, z1, /** @type {any} */ m, shadow = true, parent = world) => {
    const mesh = new Mesh(new BoxGeometry(x1 - x0, y1 - y0, z1 - z0), m);
    mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    mesh.castShadow = shadow; mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  // ------------------------------------------------------------------ rooms and their light
  const cfgById = Object.fromEntries(o.rooms.map((r) => [r.id, r]));
  /** @type {Record<string, Room>} */ const rooms = {};
  const warm = new Color();
  let warmth = 2700;
  /** @param {string} id */
  const room = (id) => {
    if (rooms[id]) return rooms[id];
    const b = /** @type {readonly number[]} */ (/** @type {any} */ (ROOMS)[id].box);
    const centre = new Vector3((b[0] + b[1]) / 2, (b[2] + b[3]) / 2, (b[4] + b[5]) / 2);
    const front = b[5];
    const view = { target: centre.clone(), pos: new Vector3(centre.x - 3, centre.y + 2.6, front + 11) };
    if (id === "cinema") { view.target.set(centre.x, -1.6, 2); view.pos.set(centre.x - 2, 5.5, 14); }
    if (id === "garden") { view.target.set(-2, 0.8, 8); view.pos.set(-16, 9, 30); }
    if (id === "pool") { view.target.set(4, 0, 10); view.pos.set(-6, 7, 24); }
    if (b[2] > 3) view.pos.y += 1.5;
    rooms[id] = { id, level: 0, target: 0, delay: 0, lamps: [], glows: [], centre, view };
    return rooms[id];
  };
  /** An emissive part of a fitting. `base` is how bright at full; cool = a pool light (stays white). */
  const glowMat = (/** @type {string} */ id, base, cool = false, additive = false, map = null) => {
    const m = new MeshBasicMaterial({ color: 0x000000, fog: true, ...(additive ? { transparent: true, blending: AdditiveBlending, depthWrite: false, map, side: DoubleSide } : {}) });
    room(id).glows.push({ mat: m, base, cool });
    disposables.push(m);
    return m;
  };
  const lamp = (/** @type {string} */ id, /** @type {PointLight|SpotLight} */ l, base) => { room(id).lamps.push({ light: l, base }); l.intensity = 0; world.add(l); if ("target" in l) world.add(l.target); };

  /** A flat additive glow (a pool of light on a floor, a wash on a wall). */
  const wash = (id, w, h, x, y, z, rot, base, map = T.glow) => {
    const m = glowMat(id, base, false, true, map);
    const p = new Mesh(new PlaneGeometry(w, h), m);
    p.position.set(x, y, z); p.rotation.set(rot[0], rot[1], rot[2]); p.renderOrder = 2;
    world.add(p);
    return p;
  };
  const floorPool = (id, x, y, z, r, base) => wash(id, r * 2, r * 2, x, y + 0.012, z, [-Math.PI / 2, 0, 0], base);
  const wallWashUp = (id, x, y, z, w, h, base, faceZ = 1) => wash(id, w, h, x, y + h / 2, z + 0.015 * faceZ, [Math.PI, faceZ > 0 ? 0 : Math.PI, 0], base, T.beam);
  const wallWashDown = (id, x, y, z, w, h, base, faceZ = 1) => wash(id, w, h, x, y - h / 2, z + 0.015 * faceZ, [0, faceZ > 0 ? 0 : Math.PI, 0], base, T.beam);
  const beamCone = (id, x, yTop, z, h, r, base) => {
    const m = glowMat(id, base, false, true, T.beam);
    const g = new ConeGeometry(r, h, 24, 1, true); g.translate(0, -h / 2, 0); g.rotateY(Math.PI);
    const c = new Mesh(g, m); c.position.set(x, yTop, z); c.renderOrder = 3;
    world.add(c);
  };
  const disc = (id, x, y, z, r, base, faceDown = true) => {
    const d = new Mesh(new CircleGeometry(r, 20), glowMat(id, base));
    d.position.set(x, y, z); d.rotation.x = faceDown ? Math.PI / 2 : -Math.PI / 2;
    world.add(d);
  };

  /** Spread n points across a span. */
  const spread = (n, a, b) => Array.from({ length: n }, (_, i) => a + ((i + 0.5) / n) * (b - a));

  /** Draws the fittings a client lists for an indoor room. */
  const fitIndoor = (/** @type {string} */ id) => {
    const f = cfgById[id]?.fittings; if (!f) return;
    const [x0, x1, y0, y1, z0, z1] = /** @type {any} */ (ROOMS)[id].box;
    const inX0 = x0 + 0.5, inX1 = x1 - 0.5, inZ0 = z0 + 0.6, inZ1 = z1 - 0.7;
    const ceil = id === "cinema" ? -0.63 : y0 > 3 ? 6.26 : 3.16;
    // one warm light for the room's air, two in a long room, placed towards the glass so light spills out
    const span = x1 - x0;
    for (const x of spread(span > 5.5 ? 2 : 1, x0, x1)) {
      const l = new PointLight(0xffffff, 0, 16, 2); l.position.set(x, ceil - 0.5, (z0 + z1) / 2 + 1);
      lamp(id, l, (id === "cinema" ? 12 : y0 > 3 ? 16 : 30) * (span > 5.5 ? 0.75 : 1));
    }
    // the warm bounce on the back wall, so a lit room glows from outside
    wash(id, span * 1.1, (y1 - y0) * 1.5, (x0 + x1) / 2, (y0 + y1) / 2 + 0.2, z0 + 0.32, [0, 0, 0], 0.4);
    const n = f.downlight ?? 0;
    if (n) {
      const cols = Math.max(1, Math.round(Math.sqrt((n * (inX1 - inX0)) / (inZ1 - inZ0))));
      const rows = Math.ceil(n / cols); let k = 0;
      for (const z of spread(rows, inZ0, inZ1)) for (const x of spread(cols, inX0, inX1)) {
        if (k++ >= n) break;
        disc(id, x, ceil - 0.005, z, 0.06, 7);
        floorPool(id, x, y0, z, 0.9, 0.16);
      }
    }
    const w = f.wall ?? 0;
    for (const x of spread(w, x0 + 0.8, x1 - 0.8)) {
      const y = y0 + 1.95;
      const p = new Mesh(new BoxGeometry(0.12, 0.2, 0.06), glowMat(id, 3)); p.position.set(x, y, z0 + 0.34); world.add(p);
      wallWashUp(id, x, y + 0.1, z0 + 0.3, 0.9, 1.2, 0.55); wallWashDown(id, x, y - 0.1, z0 + 0.3, 0.9, 1.4, 0.55);
    }
    // strips, one drawn for each listed: under the cupboards (or on the cinema's risers) first, then at the plinth, then
    // along the ceiling's edge
    const s = Math.min(3, f.strip ?? 0);
    const len = (inX1 - inX0) * (id === "cinema" ? 1 : 0.8);
    const stripAt = id === "cinema"
      ? [[y0 + 0.3, 2.2], [y0 + 0.55, 0.2], [y0 + 0.06, -3.4]]
      : [[id === "kitchen" ? y0 + 1.42 : id === "bedroom" ? y0 + 1.15 : y0 + 0.06, z0 + 0.5], [y0 + 0.06, z0 + 0.5], [ceil - 0.06, z0 + 0.5]];
    for (const [sy, sz] of stripAt.slice(0, s)) {
      const bar = new Mesh(new BoxGeometry(len, 0.025, 0.03), glowMat(id, 5)); bar.position.set((x0 + x1) / 2, sy, sz); world.add(bar);
      if (sz < z0 + 1) wallWashUp(id, (x0 + x1) / 2, sy, z0 + 0.3, len * 1.1, 0.9, 0.5);
    }
    for (const x of spread(f.uplight ?? 0, x0 + 0.6, x1 - 0.6)) {
      disc(id, x, y0 + 0.012, z0 + 0.45, 0.05, 5, false);
      wallWashUp(id, x, y0, z0 + 0.3, 0.7, 2.6, 0.6);
    }
    if (f.keypad) {
      const k = new Mesh(new BoxGeometry(0.08, 0.12, 0.01), glowMat(id, 1.6, true)); k.position.set(x0 + 0.42, y0 + 1.3, z0 + 0.32); world.add(k);
    }
    // pendants hang over the island or the table
    const pn = f.pendant ?? 0;
    const pz = id === "kitchen" ? 0.6 : 0.2;
    for (const x of spread(pn, (x0 + x1) / 2 - 1.2, (x0 + x1) / 2 + 1.2)) {
      const cord = new Mesh(new CylinderGeometry(0.006, 0.006, 1.1, 4), M.ink); cord.position.set(x, ceil - 0.55, pz); world.add(cord);
      const globe = new Mesh(new SphereGeometry(0.17, 20, 14), glowMat(id, 4.2)); globe.position.set(x, ceil - 1.2, pz); world.add(globe);
      floorPool(id, x, y0 + (id === "kitchen" ? 0.95 : 0.76), pz, 0.75, 0.22);
    }
  };

  // ------------------------------------------------------------------ the ground floor: a glass pavilion
  // floors and the deep canopy (it reaches over the terrace)
  slab(-9.4, 8.8, -0.35, 0, -4.4, 4.2, M.oak);
  const canopy = slab(-9.6, 9.0, 3.2, 3.45, -4.6, 6.4, M.conc);
  canopy.castShadow = true;
  slab(-9.4, 8.8, 0, 3.2, -4.4, -4.0, M.plaster); // back wall
  slab(-9.4, -9.0, 0, 3.2, -4.0, 4.0, M.lime); // stone end wall
  slab(-2.5, -2.3, 0, 3.2, -4.0, 0.2, M.plaster); // living | kitchen
  slab(3.5, 3.7, 0, 3.2, -4.0, -0.6, M.plaster); // kitchen | garden room
  // the inside of the canopy above the rooms, pale so the downlights read
  slab(-9.0, 8.4, 3.17, 3.2, -4.0, 4.0, M.ceiling, false);
  // glass: the long front and the garden room's end, in slim bronze frames
  slab(-9.0, 8.4, 0, 3.2, 3.99, 4.01, M.glass, false).renderOrder = 4;
  slab(8.39, 8.41, 0, 3.2, -4.0, 4.0, M.glass, false).renderOrder = 4;
  for (let x = -9.0; x <= 8.41; x += 1.75) slab(x - 0.03, x + 0.03, 0, 3.2, 3.95, 4.07, M.bronze);
  for (let z = -4.0; z <= 4.01; z += 2) slab(8.36, 8.46, 0, 3.2, z - 0.03, z + 0.03, M.bronze);
  slab(-9.0, 8.45, 3.12, 3.2, 3.94, 4.08, M.bronze, false);
  // canopy columns, very thin
  for (const x of [-2.4, 3.6, 8.9]) slab(x - 0.06, x + 0.06, 0, 3.2, 6.2, 6.32, M.bronze);

  // living room: a long sofa, a stone table, a painting, a fire in the end wall
  slab(-8.2, -4.4, 0, 0.42, -2.2, -1.2, M.fabric); slab(-8.2, -4.4, 0.42, 0.85, -2.25, -1.95, M.fabric);
  slab(-7.0, -5.4, 0, 0.36, -0.4, 0.6, M.stoneTop);
  { const r = new Mesh(new PlaneGeometry(5.2, 3.6), std({ color: 0x8b8173, roughness: 1 })); r.rotation.x = -Math.PI / 2; r.position.set(-6.2, 0.006, -0.6); r.receiveShadow = true; world.add(r); }
  { const a = new Mesh(new PlaneGeometry(1.9, 1.42), M.art); a.position.set(-6.3, 1.85, -3.95); world.add(a); }
  { const fire = new Mesh(new BoxGeometry(0.02, 0.18, 1.5), glowMat("living", 2.4)); fire.position.set(-8.97, 0.6, 0.6); world.add(fire); }
  // kitchen: oak wall of cupboards, a stone island, stools
  slab(-2.2, 3.3, 0, 0.9, -4.0, -3.4, M.darkOak); slab(-2.2, 3.3, 0.9, 0.94, -4.0, -3.35, M.stoneTop);
  slab(-2.2, 3.3, 1.5, 2.6, -4.0, -3.62, M.darkOak);
  slab(-1.2, 2.4, 0, 0.92, 0.1, 1.1, M.darkOak); slab(-1.3, 2.5, 0.92, 0.98, 0.0, 1.2, M.stoneTop);
  for (const x of [-0.5, 0.6, 1.7]) { const st = new Mesh(new CylinderGeometry(0.2, 0.18, 0.7, 16), M.bronze); st.position.set(x, 0.35, 1.6); world.add(st); }
  // garden room: an oak table, chairs, an olive in a pot
  slab(4.7, 7.3, 0.72, 0.78, -0.6, 0.9, M.oak); slab(5.0, 5.1, 0, 0.72, -0.3, 0.6, M.darkOak); slab(6.9, 7.0, 0, 0.72, -0.3, 0.6, M.darkOak);
  for (const x of [5.2, 6.0, 6.8]) for (const z of [-1.1, 1.4]) slab(x - 0.22, x + 0.22, 0, 0.46, z - 0.22, z + 0.22, M.linen);
  { const p = new Mesh(new CylinderGeometry(0.36, 0.28, 0.6, 18), M.pot); p.position.set(7.8, 0.3, -3.2); world.add(p);
    const c = new Mesh(new IcosahedronGeometry(0.6, 2), M.leaf); c.position.set(7.8, 1.5, -3.3); c.scale.set(1, 0.85, 1); world.add(c); }

  // ------------------------------------------------------------------ the first floor: a stone box, ribbon windows
  const ff = { x0: -11, x1: 2.6, y0: 3.45, y1: 6.6, z0: -4.6, z1: 3.4 };
  slab(ff.x0, ff.x1, ff.y0 - 0.02, ff.y0, ff.z0, ff.z1, M.oak); // its floor (over the cantilever too)
  slab(-11, -9.6, 3.2, 3.45, -4.6, 3.4, M.conc); // the cantilevered floor's underside
  slab(ff.x0, ff.x1, 6.3, ff.y1, ff.z0, ff.z1, M.lime); // roof
  slab(ff.x0, ff.x1, 6.27, 6.3, ff.z0 + 0.3, ff.z1 - 0.3, M.ceiling, false);
  slab(ff.x0, ff.x1, ff.y0, 6.3, ff.z0, ff.z0 + 0.3, M.lime); // back
  slab(ff.x0, ff.x0 + 0.3, ff.y0, 6.3, ff.z0, ff.z1, M.lime); // ends
  slab(ff.x1 - 0.3, ff.x1, ff.y0, 6.3, ff.z0, ff.z1, M.lime);
  slab(-4.45, -4.35, ff.y0, 6.3, ff.z0, ff.z1 - 0.3, M.plaster); slab(-1.65, -1.55, ff.y0, 6.3, ff.z0, ff.z1 - 0.3, M.plaster);
  // front: sill, head, piers, and the window glass (frosted for the bathroom)
  const winY0 = 4.3, winY1 = 5.8;
  slab(ff.x0, ff.x1, ff.y0, winY0, ff.z1 - 0.3, ff.z1, M.lime);
  slab(ff.x0, ff.x1, winY1, 6.3, ff.z1 - 0.3, ff.z1, M.lime);
  const wins = [[-10.5, -4.9, "bedroom"], [-3.9, -2.1, "hall"], [-1.1, 2.1, "bathroom"]];
  let px = ff.x0;
  for (const [a, b] of wins) { slab(px, /** @type {number} */ (a), winY0, winY1, ff.z1 - 0.3, ff.z1, M.lime); px = /** @type {number} */ (b); }
  slab(px, ff.x1, winY0, winY1, ff.z1 - 0.3, ff.z1, M.lime);
  for (const [a, b, id] of wins) {
    const m = id === "bathroom" ? M.frosted : M.glass;
    const g = slab(/** @type {number} */ (a), /** @type {number} */ (b), winY0, winY1, ff.z1 - 0.16, ff.z1 - 0.14, m, false); g.renderOrder = 4;
    slab(/** @type {number} */ (a), /** @type {number} */ (b), winY0 - 0.04, winY0, ff.z1 - 0.32, ff.z1 + 0.02, M.bronze, false);
  }
  // bedroom: a low bed against the back wall, side tables
  slab(-9.4, -6.6, ff.y0, ff.y0 + 0.45, -4.3, -2.0, M.linen); slab(-9.5, -6.5, ff.y0, ff.y0 + 1.25, -4.3, -4.12, M.velvet);
  slab(-10.1, -9.6, ff.y0, ff.y0 + 0.5, -4.3, -3.8, M.darkOak); slab(-6.4, -5.9, ff.y0, ff.y0 + 0.5, -4.3, -3.8, M.darkOak);
  // landing: a glass-sided stair head and a bench
  slab(-4.2, -1.8, ff.y0, ff.y0 + 0.45, -4.2, -3.8, M.darkOak);
  // bathroom: a stone bath, a vanity
  slab(-1.2, 0.6, ff.y0, ff.y0 + 0.58, -4.25, -3.4, M.stoneTop); slab(0.9, 2.2, ff.y0 + 0.5, ff.y0 + 0.9, -4.3, -3.8, M.darkOak);

  // ------------------------------------------------------------------ the cinema below, seen through its sunken court
  slab(-9.4, -2.0, -3.75, -3.4, -4.4, 7.8, M.slab); // cinema and court floor
  slab(-9.4, -9.0, -3.4, -0.35, -4.4, 7.8, M.lime); // court and cinema walls
  slab(-3.4, -3.0, -3.4, -0.3, 4.0, 7.8, M.lime);
  slab(-9.0, -3.0, -3.4, -0.3, 7.4, 7.8, M.lime);
  slab(-9.45, -2.95, -0.3, -0.24, 7.35, 7.85, M.conc); slab(-3.45, -2.95, -0.3, -0.24, 4.0, 7.85, M.conc); slab(-9.45, -8.95, -0.3, -0.24, 4.2, 7.85, M.conc);
  slab(-9.0, -2.4, -3.4, -0.35, -4.4, -4.0, M.cinemaWall);
  slab(-2.8, -2.4, -3.4, -0.35, -4.0, 4.0, M.cinemaWall);
  slab(-9.0, -2.4, -0.62, -0.35, -4.0, 4.0, M.cinemaWall, false); // its ceiling (under the living room floor)
  slab(-9.0, -3.4, -3.4, -0.35, 3.99, 4.01, M.glass, false).renderOrder = 4;
  for (let x = -9.0; x <= -3.39; x += 1.4) slab(x - 0.03, x + 0.03, -3.4, -0.35, 3.95, 4.07, M.bronze);
  // seats on two risers, facing the screen on the back wall
  slab(-8.6, -2.8, -3.4, -3.1, 0.6, 3.6, M.cinemaWall);
  for (const [zr, yr] of [[-0.8, -3.4], [1.8, -3.1]]) for (const x of [-7.6, -6.3, -5.0, -3.7]) {
    slab(x - 0.5, x + 0.5, yr, yr + 0.45, zr - 0.45, zr + 0.45, M.velvet); slab(x - 0.5, x + 0.5, yr + 0.45, yr + 1.0, zr + 0.3, zr + 0.48, M.velvet);
  }
  const screenMat = new ShaderMaterial({ uniforms: { uTime: { value: 0 }, uOn: { value: 0 } }, vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }", fragmentShader: SCREEN_FRAG });
  disposables.push(screenMat);
  { const s = new Mesh(new PlaneGeometry(4.6, 2.1), screenMat); s.position.set(-5.7, -1.75, -3.98); world.add(s); }
  // a lit stair down into the court
  for (let i = 0; i < 9; i++) slab(-4.6, -3.4, -3.4, -3.4 + (i + 1) * 0.38, 7.4 - (i + 1) * 0.36, 7.4 - i * 0.36, M.slab);

  // ------------------------------------------------------------------ terrace, pool, lawn, garden
  slab(-3.0, 9.6, -0.32, 0, 4.0, 7.5, M.slab); // terrace
  slab(-3.0, 9.6, -0.32, 0, 7.5, 8.6, M.slab); slab(-3.0, 9.6, -0.32, 0, 11.4, 12.3, M.slab);
  slab(-3.0, -1.0, -0.32, 0, 8.6, 11.4, M.slab); slab(9.0, 9.6, -0.32, 0, 8.6, 11.4, M.slab);
  const waterMat = new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uLevel: { value: 0 }, uSky: { value: new Color(0.06, 0.08, 0.17) }, uLights: { value: Array.from({ length: 6 }, () => new Vector3()) }, uCount: { value: 0 } },
    vertexShader: WATER_VERT, fragmentShader: WATER_FRAG,
  });
  disposables.push(waterMat);
  { const w = new Mesh(new PlaneGeometry(10, 2.8, 1, 1), waterMat); w.rotation.x = -Math.PI / 2; w.position.set(4, -0.1, 10); world.add(w); }
  // the lawn, with holes for the court and the pool
  {
    const s = new Shape(); s.moveTo(-400, -400); s.lineTo(400, -400); s.lineTo(400, 400); s.lineTo(-400, 400); s.lineTo(-400, -400);
    // the shape is drawn in (x, -z) so it can lie face up
    const hole = (x0, z0, x1, z1) => { const p = new Path(); p.moveTo(x0, -z0); p.lineTo(x1, -z0); p.lineTo(x1, -z1); p.lineTo(x0, -z1); p.lineTo(x0, -z0); s.holes.push(p); };
    hole(-9.4, -4.4, 8.8, 4.0); hole(-9.4, 4.0, -3.0, 7.8); hole(-3.0, 4.0, 9.6, 12.3);
    const g = new ShapeGeometry(s); g.rotateX(-Math.PI / 2);
    const lawn = new Mesh(g, M.lawn); lawn.position.y = -0.3; lawn.receiveShadow = true; world.add(lawn);
  }
  // the garden wall on the right, long and low
  slab(12.0, 12.45, -0.3, 2.2, -9, 15, M.limeWall);
  // a hedge along the front and low clipped shrubs by the terrace
  { const rnd = seeded(3); for (const [x, z] of [[-1.6, 13.4], [0.4, 13.2], [6.8, 13.3], [9.8, 13.6], [10.9, 4.8], [10.7, 0.6]]) { const b = new Mesh(new IcosahedronGeometry(0.55 + rnd() * 0.25, 1), M.hedge); b.position.set(x, 0.1, z); b.scale.y = 0.75; b.castShadow = true; world.add(b); } }
  // cypresses: tall, dark, slightly irregular
  const cypress = (x, z, h) => {
    const g = new SphereGeometry(1, 48, 40); const p = g.attributes.position; const r0 = seeded(Math.round(Math.abs(x * 13 + z * 7) + 99));
    const lumps = Array.from({ length: 40 }, () => new Vector3(r0() * 2 - 1, r0() * 2 - 1, r0() * 2 - 1).normalize());
    const v = new Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i); const n = v.clone().normalize();
      let bump = 0; for (const l of lumps) bump = Math.max(bump, n.dot(l));
      v.multiplyScalar(0.86 + 0.16 * Math.max(0, bump) ** 4 + 0.03 * Math.sin(v.y * 9 + v.x * 5));
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    const t = new Mesh(g, M.leaf); t.scale.set(0.75, h / 2, 0.75); t.position.set(x, h / 2 - 0.1, z); t.castShadow = true; t.receiveShadow = true; world.add(t);
  };
  // nearest the house first: those are the ones a client's uplights go to
  const trees = [[-13.2, 9.5, 7.5], [10.8, 9.8, 7.0], [-14.6, 3.2, 8.4], [11.0, -2.8, 8.2], [-13.6, -3.4, 9.0], [-12.4, -8.6, 8.8], [10.6, -8.0, 7.6]];
  for (const [x, z, h] of trees) cypress(x, z, h);
  // a path of stepping stones from the front of the garden to the terrace steps
  const path = [];
  for (let i = 0; i < 9; i++) { const t = i / 8; const x = -12 + t * 9.4; const z = 15 - t * 7.2; path.push([x, z]); slab(x - 0.55, x + 0.55, -0.3, -0.26, z - 0.32, z + 0.32, M.slab, false); }

  // ------------------------------------------------------------------ fittings: the rooms
  for (const id of ["living", "kitchen", "garden-room", "hall", "bedroom", "bathroom", "cinema"]) if (cfgById[id]) fitIndoor(id);
  if (cfgById.cinema) room("cinema");
  // the bathroom's frosted window glows with the room
  if (cfgById.bathroom) room("bathroom").glows.push({ mat: /** @type {any} */ (M.frosted), base: 0.9 });
  // a star ceiling, when the client lists one in the cinema
  if (cfgById.cinema?.fittings?.starlight) {
    const rnd = seeded(8); const pts = [];
    for (let i = 0; i < 160; i++) pts.push(-8.8 + rnd() * 6.2, -0.64, -3.8 + rnd() * 7.6);
    const g = new BufferGeometry(); g.setAttribute("position", new Float32BufferAttribute(pts, 3));
    const pm = new PointsMaterial({ color: 0x000000, size: 2, sizeAttenuation: false });
    room("cinema").glows.push({ mat: /** @type {any} */ (pm), base: 3 });
    world.add(new Points(g, pm));
  }

  // ------------------------------------------------------------------ fittings: the garden and the pool
  const gf = cfgById.garden?.fittings;
  if (gf) {
    // downlights in the canopy over the terrace, each with its beam and its pool of light
    for (const x of spread(gf.downlight ?? 0, -2.2, 8.6)) {
      disc("garden", x, 3.195, 5.4, 0.06, 8);
      beamCone("garden", x, 3.19, 5.4, 3.2, 0.9, 0.05);
      floorPool("garden", x, 0, 5.4, 1.15, 0.3);
    }
    if (gf.downlight) { const l = new PointLight(0xffffff, 0, 14, 2); l.position.set(3, 2.6, 6); lamp("garden", l, 14); }
    // uplights on the trees nearest the house: the first three are real lights, the rest glow
    trees.slice(0, gf.uplight ?? 0).forEach(([x, z, h], i) => {
      disc("garden", x + 0.9, -0.28, z + 0.9, 0.07, 6, false);
      if (i < 3) {
        const s = new SpotLight(0xffffff, 0, h + 6, 0.5, 0.7, 1.3);
        s.position.set(x + 0.8, -0.15, z + 0.9); s.target.position.set(x, h * 0.55, z);
        lamp("garden", s, 160);
      } else beamCone("garden", x, h * 0.9, z + 0.4, h, 0.9, 0.04);
    });
    // path lights beside the stepping stones
    const nb = gf.bollard ?? 0;
    for (let i = 0; i < nb; i++) {
      const [x, z] = path[Math.min(path.length - 1, Math.round((i / Math.max(1, nb - 1)) * (path.length - 1)))];
      const bx = x + 0.95, bz = z + 0.55;
      const post = new Mesh(new BoxGeometry(0.12, 0.62, 0.12), M.bronze); post.position.set(bx, 0.01, bz); post.castShadow = true; world.add(post);
      const lens = new Mesh(new BoxGeometry(0.125, 0.06, 0.125), glowMat("garden", 3)); lens.position.set(bx, 0.24, bz); world.add(lens);
      floorPool("garden", bx, -0.3, bz, 1.1, 0.38);
    }
    // grazers at the foot of the garden wall: light running up the stone
    for (const z of spread(gf.wall ?? 0, -6, 13)) {
      disc("garden", 11.85, -0.28, z, 0.06, 5, false);
      wallWashUp("garden", 11.98, -0.3, z, 2.2, 2.6, 0.55, -1);
    }
    if (gf.wall) { const l = new PointLight(0xffffff, 0, 10, 2); l.position.set(10.6, 0.6, 3.5); lamp("garden", l, 8); }
  }
  const pf = cfgById.pool?.fittings;
  /** @type {Vector3[]} */ const poolSpots = [];
  if (pf) {
    for (const x of spread(pf.underwater ?? 0, -0.4, 8.4)) poolSpots.push(new Vector3(x, -0.1, 8.9));
    waterMat.uniforms.uCount.value = Math.min(6, poolSpots.length);
    poolSpots.slice(0, 6).forEach((v, i) => waterMat.uniforms.uLights.value[i].copy(v));
    const l = new PointLight(0x9fe8f0, 0, 12, 2); l.position.set(4, 0.25, 10); lamp("pool", l, 16);
    room("pool");
  }
  // every room the client lists exists, even one the model only prices
  for (const r of o.rooms) room(r.id);

  // ------------------------------------------------------------------ the moon, and how the house is seen
  const moon = new DirectionalLight(0x8fa4d8, 0.3);
  moon.position.set(22, 30, 26); moon.castShadow = !phone;
  moon.shadow.mapSize.set(2048, 2048); moon.shadow.radius = 4; moon.shadow.bias = -0.0005;
  Object.assign(moon.shadow.camera, { left: -26, right: 26, top: 22, bottom: -14, near: 5, far: 90 });
  scene.add(moon);

  const camera = new PerspectiveCamera(30, 1, 0.5, 1200);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = !reduced();
  controls.dampingFactor = 0.07;
  controls.enablePan = false;
  controls.minDistance = 10; controls.maxDistance = 70;
  controls.minPolarAngle = 0.75; controls.maxPolarAngle = 1.5;
  const home = { target: new Vector3(-0.4, 2.3, 2.5), pos: new Vector3(-17.5, 4.3, 29.5) };
  const tallHome = { target: new Vector3(0.6, 2.9, 3), pos: new Vector3(-13.5, 4.4, 29) };
  const homeView = () => (camera.aspect < 0.9 ? tallHome : home);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new Vector2(256, 256), 0.62, 0.55, 0.92);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const size = () => {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false); composer.setSize(w, h);
    bloom.resolution.set(w / 2, h / 2);
    const wasTall = camera.aspect < 0.9;
    camera.aspect = w / h; camera.fov = camera.aspect < 0.9 ? 44 : 30; camera.updateProjectionMatrix();
    if (!flying && wasTall !== camera.aspect < 0.9) { const v = homeView(); camera.position.copy(v.pos); controls.target.copy(v.target); }
    wake();
  };

  // ------------------------------------------------------------------ labels, picking, flying
  const picks = /** @type {Mesh[]} */ ([]);
  const pickMat = new MeshBasicMaterial({ visible: false });
  for (const id of Object.keys(rooms)) {
    const b = /** @type {any} */ (ROOMS)[id].box;
    const y1 = id === "garden" ? 0.6 : id === "pool" ? 0.2 : b[3];
    const m = new Mesh(new BoxGeometry(b[1] - b[0], y1 - b[2], b[5] - b[4]), pickMat);
    m.position.set((b[0] + b[1]) / 2, (b[2] + y1) / 2, (b[4] + b[5]) / 2); m.userData.room = id; m.visible = true;
    world.add(m); picks.push(m);
  }
  /** @type {Record<string, HTMLElement>} */ const tags = {};
  for (const id of Object.keys(rooms)) {
    const t = document.createElement("span"); t.className = "el-h3-tag"; t.textContent = /** @type {any} */ (ROOMS)[id].label;
    labels.append(t); tags[id] = t;
  }
  let hovered = "", selected = "";
  const ray = new Raycaster(); const ndc = new Vector2();
  /** @param {PointerEvent} e */
  const hit = (e) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return /** @type {string} */ (ray.intersectObjects(picks, false)[0]?.object.userData.room ?? "");
  };
  let down = /** @type {{x:number,y:number}|null} */ (null);
  const onDown = (/** @type {PointerEvent} */ e) => { down = { x: e.clientX, y: e.clientY }; };
  const onUp = (/** @type {PointerEvent} */ e) => {
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6) { const id = hit(e); if (id) o.onPick(id); }
    down = null;
  };
  const onMove = (/** @type {PointerEvent} */ e) => {
    if (e.pointerType !== "mouse" || down) return;
    const id = hit(e); if (id !== hovered) { hovered = id; canvas.style.cursor = id ? "pointer" : ""; wake(); }
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointermove", onMove);

  /** @type {{ from: {pos: Vector3, target: Vector3}, to: {pos: Vector3, target: Vector3}, t: number } | null} */
  let flight = null; let flying = false;
  const flyTo = (/** @type {{pos: Vector3, target: Vector3}} */ to) => {
    const from = { pos: camera.position.clone(), target: controls.target.clone() };
    if (reduced()) { camera.position.copy(to.pos); controls.target.copy(to.target); wake(); return; }
    flight = { from, to, t: 0 }; flying = true; wake();
  };

  // the camera drifts a few degrees and back while nobody is touching it
  let idleFor = 0, drift = 0, driftBase = 0;
  let touching = false;
  controls.addEventListener("start", () => { touching = true; idleFor = 0; flight = null; flying = false; wake(); });
  controls.addEventListener("end", () => { touching = false; idleFor = 0; });
  controls.addEventListener("change", () => wake());

  // ------------------------------------------------------------------ the loop (stops when nothing changes or off screen)
  const clock = new Clock();
  let raf = 0, time = 0, onScreen = true, firstFrame = true, screenOn = 0, screenTarget = 0, dirty = true;
  const animating = () => dirty || Object.values(rooms).some((r) => r.delay > 0 || Math.abs(r.level - r.target) > 0.002) || Math.abs(screenOn - screenTarget) > 0.002;
  const liveWater = () => (rooms.pool?.level ?? 0) > 0.01 && !reduced();
  const tick = () => {
    raf = 0;
    const dt = Math.min(clock.getDelta(), 0.05); time += dt;
    // lights: wait their turn, then come up like a filament (fast at first, settling) and fade down more slowly
    for (const r of Object.values(rooms)) {
      if (r.delay > 0) { r.delay -= dt; continue; }
      const up = r.target > r.level;
      const k = reduced() ? 1 : 1 - Math.exp(-dt * (up ? 2.6 : 1.7));
      r.level += (r.target - r.level) * k;
      if (Math.abs(r.target - r.level) < 0.002) r.level = r.target;
      const lv = r.level;
      const kel = 2100 + (warmth - 2100) * Math.sqrt(lv);
      kelvin(kel, warm);
      for (const l of r.lamps) { l.light.intensity = l.base * lv * lv; l.light.color.copy(warm); }
      for (const g of r.glows) {
        const v = g.base * lv;
        if (g.mat === /** @type {any} */ (M.frosted)) { /** @type {any} */ (g.mat).emissive.copy(warm).multiplyScalar(v); continue; }
        if (g.cool) g.mat.color.setRGB(0.75 * v, 0.78 * v, 1 * v); else g.mat.color.copy(warm).multiplyScalar(v);
        if (g.mat.transparent && "opacity" in g.mat) g.mat.opacity = Math.min(1, lv * 1.4);
      }
    }
    dirty = false;
    if (rooms.pool) waterMat.uniforms.uLevel.value = rooms.pool.level;
    waterMat.uniforms.uTime.value = time;
    screenOn += (screenTarget - screenOn) * (reduced() ? 1 : 1 - Math.exp(-dt * 1.5));
    screenMat.uniforms.uOn.value = screenOn; screenMat.uniforms.uTime.value = time;
    // camera: a flight to a room, or the slow drift
    if (flight) {
      flight.t = Math.min(1, flight.t + dt / 2.2);
      const e = ease(flight.t);
      camera.position.lerpVectors(flight.from.pos, flight.to.pos, e);
      controls.target.lerpVectors(flight.from.target, flight.to.target, e);
      if (flight.t >= 1) { flight = null; flying = false; idleFor = 0; }
    } else if (!touching && !reduced()) {
      idleFor += dt;
      if (idleFor > 6) {
        if (drift === 0) driftBase = time;
        drift = 0.14 * 0.09 * Math.cos((time - driftBase) * 0.09) * dt || 1e-9;
        const off = camera.position.clone().sub(controls.target);
        off.applyAxisAngle(UP, drift);
        camera.position.copy(controls.target).add(off);
      }
    } else drift = 0;
    controls.update();
    // the label of the room under the pointer, or the one chosen
    for (const [id, t] of Object.entries(tags)) {
      const show = id === hovered || id === selected;
      t.classList.toggle("on", show);
      if (!show) continue;
      const p = rooms[id].centre.clone();
      if (id === "garden") p.set(-9, 1.2, 12); if (id === "pool") p.set(4, 0.4, 10);
      p.project(camera);
      t.style.transform = `translate(${((p.x + 1) / 2) * canvas.clientWidth}px, ${((1 - p.y) / 2) * canvas.clientHeight}px) translate(-50%, -140%)`;
    }
    if (firstFrame || animating()) renderer.shadowMap.needsUpdate = firstFrame;
    composer.render(dt);
    if (firstFrame) { firstFrame = false; o.onFirstFrame?.(); }
    const keepGoing = onScreen && !document.hidden && (animating() || flying || liveWater() || screenOn > 0.01 || (!reduced() && !touching) || controls.enableDamping);
    if (keepGoing) raf = requestAnimationFrame(tick);
  };
  const wake = () => { if (!raf && onScreen) { clock.getDelta(); raf = requestAnimationFrame(tick); } };
  const ro = new ResizeObserver(size); ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; if (onScreen) wake(); }, { threshold: 0.02 });
  io.observe(canvas);
  const onVis = () => { if (!document.hidden) wake(); };
  document.addEventListener("visibilitychange", onVis);
  { const v = homeView(); camera.position.copy(v.pos); controls.target.copy(v.target); }
  size();

  return {
    /**
     * Sets how bright each room should be. With `order`, rooms wait their turn in that order (`gap` seconds apart);
     * with `instant`, they are simply at that level (used for the first frame, so it matches the still).
     * @param {Record<string, number>} levels @param {{ order?: string[], gap?: number, instant?: boolean }} [opt]
     */
    setLevels(levels, opt = {}) {
      const order = opt.order ?? [];
      for (const r of Object.values(rooms)) {
        const next = clamp01(levels[r.id] ?? 0);
        const i = order.indexOf(r.id);
        r.delay = i >= 0 && !reduced() ? 0.35 + i * (opt.gap ?? 0.5) : 0;
        r.target = next;
        if (opt.instant) { r.level = next; r.delay = 0; }
      }
      dirty = true;
      wake();
    },
    /** @param {boolean} on */
    setScreen(on) { screenTarget = on ? 1 : 0; wake(); },
    /** The colour of every light at full, in kelvin. @param {number} k */
    setWarmth(k) { warmth = Math.min(4000, Math.max(2000, k)); dirty = true; wake(); },
    /** Fly to a room, or back to the whole house with "". @param {string} id */
    focus(id) { selected = id; flyTo(id && rooms[id] ? rooms[id].view : homeView()); },
    /** @param {string} id */
    select(id) { selected = id; wake(); },
    dispose() {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); controls.dispose();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointerdown", onDown); canvas.removeEventListener("pointerup", onUp); canvas.removeEventListener("pointermove", onMove);
      scene.traverse((obj) => { const m = /** @type {Mesh} */ (obj); if (m.geometry) m.geometry.dispose(); });
      for (const d of disposables) d.dispose();
      skyMat.dispose(); pickMat.dispose(); composer.dispose(); renderer.dispose(); labels.replaceChildren();
    },
  };
}
