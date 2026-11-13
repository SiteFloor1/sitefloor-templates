// @ts-check
/**
 * The bay in 3D, for the detailing kit's two 3D features: the visitor's size of car (a hatch, a saloon or an SUV, the
 * shared models in src/core/assets/cars, CC BY 4.0, credited on the stage) in a dark bay lit by strip lights, drawn
 * with three.js. Loaded only when a visitor
 * asks for it (the features import this file on tap), so pages stay light.
 *
 *   "correction": a masking-tape line runs down the middle of the bonnet and roof. One side carries swirl marks, the
 *     other is corrected, and a strip light the visitor moves sweeps along the car, showing the difference the way a
 *     detailer's inspection light does. It is an illustration of what correction removes, labelled as one on the page.
 *   "protection": the paint a film package covers (front end, full front, track pack or full body) lights up and takes
 *     the film's extra gloss, and the film's edges are drawn as thin lit lines on the car.
 *
 * Both effects are drawn on the paint in its shader from the car's own shape (where a point sits along the car and
 * which way the surface faces), so they don't depend on how the model is split into parts.
 * Kept cool on phones: nothing is redrawn unless the car turns, the light moves or the coverage changes.
 */
import {
  ACESFilmicToneMapping, BackSide, Box3, BoxGeometry, CanvasTexture, Color, Group, HemisphereLight, Mesh, MeshBasicMaterial, MeshPhysicalMaterial,
  MeshStandardMaterial, MultiplyBlending, PerspectiveCamera, PlaneGeometry, PMREMGenerator, Scene,
  SRGBColorSpace, Vector3, WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { FINISH_LOOK } from "../../lib/paint.js";

/**
 * Where the camera sits for each mode, for a car 4.6 m long: [position], [looks at], from the middle of the car on the
 * ground. Longer or shorter cars move the camera in proportion. The car's nose points to +z.
 */
export const VIEWS = {
  correction: [[1.7, 1.55, 3.9], [0, 0.62, 0.95]],
  protection: [[5.4, 1.35, 4.7], [0, 0.5, 0.1]],
};
const REF_LENGTH = 4.6;

/**
 * What each film package covers, drawn on the paint: `side` and `top` say how far along the car (0 tail, 1 nose) the
 * film starts on side- and top-facing paint; `lower` covers the lower sides (sills, behind the wheels) up to that
 * share of the car's height; `all` is the whole car. Typical coverages, as an illustration.
 */
export const COVER = {
  "front-end": { side: 0.87, top: 0.8, lower: 0, all: 0 },
  "full-front": { side: 0.74, top: 0.64, lower: 0, all: 0 },
  track: { side: 0.74, top: 0.64, lower: 0.3, all: 0 },
  whole: { side: 1.2, top: 1.2, lower: 0, all: 1 },
};

/**
 * @typedef {object} Bay
 * @property {(t: number) => void} light move the strip light along the car, 0 (tail) to 1 (nose)
 * @property {(area: keyof typeof COVER) => void} cover show a film coverage
 * @property {(body: string) => Promise<void>} car show another car (loaded once, then kept)
 * @property {(hex: string, finish: string) => void} paint repaint the car in a colour from the studio's chart
 * @property {() => void} dispose
 */

/**
 * @param {HTMLElement} host the box the canvas fills
 * @param {{ models: Record<string, string>, body: string, mode: "correction"|"protection", paint: string, ground: string, line: string, tape: string, still: boolean, onFrame?: () => void }} o
 *   models: each car's file by body ("hatch", "saloon", "suv"); body: the one to show first
 *   paint, ground, line and tape are the look's colours; still = the visitor prefers less motion
 * @returns {Promise<Bay>}
 */
export async function bay(host, o) {
  const renderer = new WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(new Color(o.ground));
  host.append(renderer.domElement);
  renderer.domElement.setAttribute("aria-hidden", "true");

  const scene = new Scene();
  scene.background = new Color(o.ground);
  // The bay for reflections: a dark room with long strip lights overhead, blurred once into an environment map.
  const room = new Scene();
  room.add(new Mesh(new BoxGeometry(30, 12, 30), new MeshBasicMaterial({ color: 0x07090a, side: BackSide })));
  const k = o.mode === "correction" ? 3.2 : 5;
  const tubeMat = new MeshBasicMaterial({ color: new Color(k, k, k) });
  for (const z of [-4.2, -2.1, 0, 2.1, 4.2]) { const t = new Mesh(new BoxGeometry(9, 0.06, 0.14), tubeMat); t.position.set(0, 5.6, z); room.add(t); }
  for (const x of [-6, 6]) { const t = new Mesh(new BoxGeometry(0.12, 0.08, 12), tubeMat); t.position.set(x, 3.4, 0); room.add(t); }
  const wall = new Mesh(new BoxGeometry(12, 4, 0.1), new MeshBasicMaterial({ color: new Color(0.05, 0.055, 0.06) }));
  wall.position.set(0, 2, 9); room.add(wall);
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(room, 0.03).texture;
  pmrem.dispose();

  // The strip light the visitor moves (correction) is a long bar across the car above it. Its reflection is drawn in the
  // paint's shader (uLightPos below): a bar that long reflects wherever the reflection's angle along the car meets it.
  scene.add(new HemisphereLight(0xdfe6ea, 0x101315, o.mode === "correction" ? 1.1 : 1.5));

  const camera = new PerspectiveCamera(30, 1, 0.1, 60);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = !o.still;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minPolarAngle = 0.35;
  controls.maxPolarAngle = 1.45;

  // The floor: dark resin that catches the strip light, with a soft shadow under the car.
  const floor = new Mesh(new PlaneGeometry(40, 40), new MeshStandardMaterial({ color: new Color(o.ground).multiplyScalar(1.4), roughness: 0.38, metalness: 0 }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const shade = document.createElement("canvas");
  shade.width = shade.height = 128;
  const g = /** @type {CanvasRenderingContext2D} */ (shade.getContext("2d"));
  const grad = g.createRadialGradient(64, 64, 6, 64, 64, 64);
  grad.addColorStop(0, "rgba(0,0,0,0.85)"); grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  const contact = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: new CanvasTexture(shade), transparent: true, blending: MultiplyBlending, depthWrite: false, premultipliedAlpha: true }));
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = 0.004;
  scene.add(contact);

  // The paint, with the swirls, the tape and the film drawn in its shader.
  const uniforms = {
    uLen: { value: new Vector3(0, 1, 0) }, // x: tail z, y: length, z: roof height
    uBase: { value: new Vector3(0, 0, 0) }, // x: the car's middle across, y: its lowest point
    uLower: { value: 0 }, uAll: { value: 0 },
    uLight: { value: 0.5 },
    uFilmSide: { value: COVER["full-front"].side }, uFilmTop: { value: COVER["full-front"].top },
    uMode: { value: o.mode === "correction" ? 0 : 1 }, uLightPos: { value: new Vector3(0, 2.5, 0.9) }, uStrip: { value: o.mode === "correction" ? 2.4 : 0.9 },
    uTape: { value: new Color(o.tape) }, uLine: { value: new Color(o.line) },
  };
  const paint = new MeshPhysicalMaterial({ color: new Color(o.paint), metalness: 0.5, roughness: o.mode === "correction" ? 0.1 : 0.22, clearcoat: o.mode === "correction" ? 0 : 1, clearcoatRoughness: 0.04, envMapIntensity: 1.7 });
  paint.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vBayPos;")
      .replace("#include <project_vertex>", "#include <project_vertex>\nvBayPos = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>
varying vec3 vBayPos;
uniform vec3 uLen, uBase; uniform float uLight, uFilmSide, uFilmTop, uLower, uAll, uMode, uStrip; uniform vec3 uTape, uLine, uLightPos;
float bayHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
// Swirl marks: arcs of fine scratches round each place a polishing pad turned. Returns the tilt across the scratches
// (xy) and how much scratch is here (z).
vec3 swirl(vec2 q) {
  vec2 cell = floor(q), f = fract(q);
  vec3 acc = vec3(0.0);
  for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) {
    vec2 g = vec2(float(i), float(j));
    vec2 c = g + vec2(bayHash(cell + g), bayHash(cell + g + 7.3)) - f;
    float r = length(c);
    float seed = bayHash(cell + g + 3.1) * 40.0;
    float ring = sin(r * 420.0 + seed);
    float arc = smoothstep(0.35, 0.9, sin(atan(c.y, c.x) * 3.0 + seed));
    float line = smoothstep(0.86, 0.99, ring) * arc * smoothstep(0.75, 0.12, r);
    acc += vec3(normalize(c + 1e-4) * line, line);
  }
  return acc;
}`)
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
vec3 bayWn = normalize((vec4(normal, 0.0) * viewMatrix).xyz);
float bayU = (vBayPos.z - uLen.x) / uLen.y;
float bayTop = smoothstep(0.55, 0.8, bayWn.y);
float bayX = vBayPos.x - uBase.x;
// The tape: down the middle of the bonnet and roof (correction).
float bayTape = uMode < 0.5 ? (1.0 - smoothstep(0.012, 0.016, abs(bayX))) * bayTop : 0.0;
diffuseColor.rgb = mix(diffuseColor.rgb, uTape, bayTape);
roughnessFactor = mix(roughnessFactor, 0.9, bayTape);
metalnessFactor = mix(metalnessFactor, 0.0, bayTape);
// The film (protection): from where it starts along the car (further back on top-facing paint), plus the lower sides
// for a track pack, or everything. Its edges are where the cover passes through one half.
float bayStart = mix(uFilmSide, uFilmTop, bayTop);
float bayH = (vBayPos.y - uBase.y) / max(uLen.z - uBase.y, 0.01);
float bayFront = smoothstep(bayStart - 0.003, bayStart + 0.003, bayU);
float bayLow = uLower > 0.0 ? 1.0 - smoothstep(uLower - 0.012, uLower + 0.012, bayH) : 0.0;
float bayFilm = uMode > 0.5 ? max(max(bayFront, bayLow), uAll) : 0.0;
float bayEdge = uMode > 0.5 ? clamp(4.0 * bayFilm * (1.0 - bayFilm), 0.0, 1.0) * (1.0 - uAll) : 0.0;
roughnessFactor = mix(roughnessFactor, roughnessFactor * 0.85, bayFilm);
// Swirls on the uncorrected side of the tape (correction): a slight tilt across each scratch, and a glint where the
// strip light's reflection passes near it, which is how swirls show under an inspection light.
float bayLines = 0.0;
if (uMode < 0.5 && bayX < 0.0) {
  vec2 q = bayTop > 0.5 ? vBayPos.xz : (abs(bayWn.x) > abs(bayWn.z) ? vBayPos.zy : vBayPos.xy);
  vec3 s = swirl(q * 3.2) * (1.0 - bayTape);
  bayLines = clamp(s.z, 0.0, 1.0);
  // Swirled paint looks hazy: a little rougher, a little lifted, less depth.
  roughnessFactor = max(roughnessFactor, 0.26);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.32, 0.36, 0.36), 0.1);
  vec3 tilt = bayTop > 0.5 ? vec3(s.x, 0.0, s.y) : (abs(bayWn.x) > abs(bayWn.z) ? vec3(0.0, s.y, s.x) : vec3(s.x, s.y, 0.0));
  normal = normalize(normal + (viewMatrix * vec4(tilt, 0.0)).xyz * 0.25);
}`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
totalEmissiveRadiance += uLine * bayEdge * 2.2;
// Covered paint lights up a little, so the package reads at a glance.
totalEmissiveRadiance += uLine * bayFilm * 0.025;
if (uMode < 0.5 && bayX < 0.0) totalEmissiveRadiance += vec3(0.005, 0.006, 0.006) * (1.0 - bayTape);
// The strip light's reflection: sharp on clear paint, spread and dimmer on swirled paint.
vec3 bayNw = normalize((vec4(normal, 0.0) * viewMatrix).xyz);
vec3 bayRr = reflect(-normalize(cameraPosition - vBayPos), bayNw);
float bayAlign = max(dot(normalize(bayRr.yz + vec2(1e-4)), normalize((uLightPos - vBayPos).yz)), 0.0) * step(0.0, bayRr.y);
bool baySwirled = uMode < 0.5 && bayX < 0.0;
float bayStrip = baySwirled ? pow(bayAlign, 70.0) * 0.45 : pow(bayAlign, 900.0);
totalEmissiveRadiance += vec3(bayStrip * uStrip * (1.0 - bayTape));
if (bayLines > 0.0) {
  vec3 bayR = reflect(-normalize(cameraPosition - vBayPos), bayWn);
  // The strip runs across the car, so only the reflection's angle along the car (y and z) has to meet it.
  vec2 bayToL = (uLightPos - vBayPos).yz;
  float bayGlint = pow(max(dot(normalize(bayR.yz), normalize(bayToL)), 0.0), 60.0) * step(0.0, bayR.y);
  totalEmissiveRadiance += vec3(bayLines * bayGlint * 2.6);
}`);
  };
  paint.customProgramCacheKey = () => `bay-${o.mode}`;

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  /** @type {Map<string, Promise<import("three").Group>>} */
  const cars = new Map();
  /** @type {import("three").Group|null} */ let car = null;
  const box = new Box3();
  const load = (/** @type {string} */ body) => {
    if (!cars.has(body)) {
      cars.set(body, loader.loadAsync(o.models[body]).then((gltf) => {
        gltf.scene.traverse((x) => {
          const m = /** @type {Mesh} */ (x);
          if (m.isMesh && /^Paint/.test(/** @type {any} */ (m.material)?.name ?? "")) m.material = paint;
        });
        // Any car model: long side along z, nose to +z (the windscreen in front of the middle), centred, on the floor.
        const s = gltf.scene, size = new Box3().setFromObject(s).getSize(new Vector3());
        if (size.x > size.z) s.rotation.y = Math.PI / 2;
        s.updateMatrixWorld(true);
        const screen = new Box3();
        s.traverse((x) => { const m = /** @type {Mesh} */ (x); if (m.isMesh && /windscreen$|Windshield/i.test(`${/** @type {any} */ (m.material)?.name ?? ""} ${m.name}`)) screen.expandByObject(m); });
        if (!screen.isEmpty() && screen.getCenter(new Vector3()).z < new Box3().setFromObject(s).getCenter(new Vector3()).z) s.rotation.y += Math.PI;
        s.updateMatrixWorld(true);
        const b = new Box3().setFromObject(s), c = b.getCenter(new Vector3());
        s.position.set(-c.x, -b.min.y, -c.z);
        const g = new Group();
        g.add(s);
        return g;
      }));
    }
    return /** @type {Promise<import("three").Group>} */ (cars.get(body));
  };
  /** Puts a car on the floor, measures it for the paint's shader and frames it, keeping the visitor's angle. */
  const show = async (/** @type {string} */ body) => {
    const next = await load(body);
    if (car) scene.remove(car);
    car = next;
    scene.add(car);
    box.setFromObject(car);
    const len = box.max.z - box.min.z, k = len / REF_LENGTH, mid = (box.min.x + box.max.x) / 2, midZ = (box.min.z + box.max.z) / 2;
    uniforms.uLen.value.set(box.min.z, len, box.max.y);
    uniforms.uBase.value.set(mid, box.min.y, 0);
    contact.scale.set((box.max.x - box.min.x) * 1.5, len * 1.25, 1);
    contact.position.set(mid, 0.004, midZ);
    const [pos, at] = VIEWS[o.mode];
    const target = new Vector3(mid + at[0] * k, box.min.y + at[1] * k, midZ + at[2] * k);
    const first = !controls.target.lengthSq() && !camera.position.lengthSq();
    const dir = first ? new Vector3(pos[0] - at[0], pos[1] - at[1], pos[2] - at[2]) : camera.position.clone().sub(controls.target).normalize().multiplyScalar(new Vector3(pos[0] - at[0], pos[1] - at[1], pos[2] - at[2]).length());
    controls.target.copy(target);
    camera.position.copy(target).add(dir.multiplyScalar(k));
    controls.minDistance = (o.mode === "correction" ? 2.6 : 4) * k;
    controls.maxDistance = 9 * k;
    controls.update();
  };
  await show(o.body in o.models ? o.body : Object.keys(o.models)[0]);

  let width = 0, height = 0, queued = false;
  /** The film edge's slide to a new coverage: from, to, and when it started (it takes SLIDE_MS whatever the frame rate). */
  const now = () => ({ side: uniforms.uFilmSide.value, top: uniforms.uFilmTop.value, lower: uniforms.uLower.value, all: uniforms.uAll.value });
  let slide = { from: now(), to: now(), at: 0 };
  const SLIDE_MS = 900;
  const resize = () => {
    const r = host.getBoundingClientRect();
    if (r.width === width && r.height === height) return;
    width = r.width; height = r.height;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
  };
  const frame = () => {
    queued = false;
    resize();
    const moving = controls.update();
    // The film's edge slides to a new coverage in under a second, unless motion is turned down.
    const k = Math.min(1, (performance.now() - slide.at) / SLIDE_MS), e = 1 - Math.pow(1 - k, 3);
    const sliding = k < 1;
    uniforms.uFilmSide.value = slide.from.side + (slide.to.side - slide.from.side) * e;
    uniforms.uFilmTop.value = slide.from.top + (slide.to.top - slide.from.top) * e;
    uniforms.uLower.value = slide.from.lower + (slide.to.lower - slide.from.lower) * e;
    uniforms.uAll.value = slide.from.all + (slide.to.all - slide.from.all) * e;
    renderer.render(scene, camera);
    o.onFrame?.();
    if (moving || sliding) request();
  };
  const request = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };
  controls.addEventListener("change", request);
  const ro = new ResizeObserver(request);
  ro.observe(host);
  request();

  return {
    light(t) {
      // From over the roof to just past the nose, so the reflection crosses the bonnet seen from the front.
      const len = box.max.z - box.min.z, z = box.min.z + len * 0.35 + Math.max(0, Math.min(1, t)) * len * 1.05;
      uniforms.uLightPos.value.set(uniforms.uBase.value.x, box.min.y + 2.5 * (len / REF_LENGTH), z);
      uniforms.uLight.value = t;
      request();
    },
    cover(area) {
      const c = COVER[area] ?? COVER["full-front"];
      slide = { from: now(), to: { ...c }, at: o.still ? -Infinity : performance.now() };
      request();
    },
    async car(body) {
      if (!(body in o.models)) return;
      await show(body);
      request();
    },
    paint(hex, finish) {
      const f = /** @type {Record<string, { metalness: number, roughness: number, clearcoat: number }>} */ (FINISH_LOOK)[finish] ?? FINISH_LOOK.metallic;
      paint.color.set(hex);
      paint.metalness = f.metalness;
      // Correction keeps its own glassy roughness and no clear coat, so the swirls read the same on any colour.
      if (o.mode !== "correction") { paint.roughness = f.roughness; paint.clearcoat = f.clearcoat; }
      request();
    },
    dispose() {
      ro.disconnect(); controls.dispose(); renderer.dispose(); renderer.domElement.remove();
    },
  };
}
