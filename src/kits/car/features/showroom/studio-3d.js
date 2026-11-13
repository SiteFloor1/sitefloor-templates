// @ts-check
/**
 * The 3D Showroom: the studio car (src/core/assets/cars/studio-car.glb, shared) in a lit photo studio, drawn with
 * three.js. Loaded only when a visitor asks for it (showroom.js imports this file on tap), so the page itself
 * stays light. Turn the car by dragging; tap a part to choose what to change; the wrap, glass and wheel
 * colours come from the Showroom form.
 *
 * Kept cool on phones: nothing is redrawn unless the car is turning, the camera is moving or something changed.
 */
import {
  NeutralToneMapping, BackSide, Box3, BoxGeometry, CanvasTexture, Color, DirectionalLight, Group, Mesh, MeshBasicMaterial,
  MeshPhysicalMaterial, MultiplyBlending, PCFSoftShadowMap, PerspectiveCamera, PlaneGeometry, PMREMGenerator, Raycaster,
  Scene, ShaderMaterial, ShadowMaterial, SphereGeometry, SRGBColorSpace, Vector2, Vector3, WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

/** Where the camera sits for each view: [position], [looks at]. The car's nose points to +z. */
export const VIEWS = {
  wrap: [[4.75, 1.4, 4.85], [0, 0.48, 0.2]],
  windscreen: [[2.6, 2.9, 7.2], [0, 0.8, 0.6]],
  fronts: [[7.2, 1.5, 1.6], [0, 0.75, 0.1]],
  rear: [[-3.6, 2.6, -6.6], [0, 0.8, -0.9]],
  wheels: [[3.7, 0.55, 3.9], [0.9, 0.4, 1.45]],
  lights: [[2.4, 0.9, 7.4], [0, 0.6, 1.6]],
};

/** How each wrap finish sits under the studio lights. */
export const FINISH = {
  gloss: { metalness: 0.25, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.03 },
  satin: { metalness: 0.2, roughness: 0.5, clearcoat: 0.45, clearcoatRoughness: 0.35 },
  matte: { metalness: 0, roughness: 0.82, clearcoat: 0, clearcoatRoughness: 1 },
  chrome: { metalness: 1, roughness: 0.07, clearcoat: 0, clearcoatRoughness: 0 },
};

/**
 * Glass darkness from the light let through (100 = clear glass, 5 = limo).
 * @param {number} light @returns {number} opacity of the glass layer
 */
export const glassOpacity = (light) => 0.14 + 0.83 * Math.pow(Math.max(0, Math.min(1, 1 - light / 100)), 0.9);

/**
 * What a tapped part is, from its material.
 * @param {string} material @param {string} node @returns {"wrap"|"windscreen"|"fronts"|"rear"|"wheels"|"lights"|null}
 */
export function partOf(material, node) {
  const named = /^Glass (windscreen|fronts|rear)$/.exec(material); // models prepared by tools/car-models/prep.js
  if (named) return /** @type {"windscreen"|"fronts"|"rear"} */ (named[1]);
  if (material === "Glass" && /^Body/.test(node)) return /Windshield/.test(node) ? "windscreen" : /Door.Window/.test(node) ? "fronts" : "rear";
  if (/^Paint 1/.test(material)) return "wrap";
  if (/^(Rim|Tire|Brake|Disc)/.test(material)) return "wheels";
  if (/light$/i.test(material)) return "lights";
  return null;
}

/**
 * A photo studio for reflections: soft grey walls, a darker floor and long light boxes overhead and at the sides.
 * @param {WebGLRenderer} renderer
 */
export function studioLights(renderer) {
  const scene = new Scene();
  const walls = new Mesh(new SphereGeometry(30, 48, 24), new ShaderMaterial({
    side: BackSide, depthWrite: false,
    vertexShader: "varying vec3 p; void main(){ p = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
    fragmentShader: `varying vec3 p; void main(){ float y = normalize(p).y;
      vec3 c = mix(vec3(0.1, 0.105, 0.11), vec3(0.62, 0.64, 0.67), smoothstep(-0.04, 0.03, y));
      c = mix(c, vec3(0.03), (1. - smoothstep(0.0, 0.012, abs(y - 0.005))) * 0.85);
      c = mix(c, vec3(0.9, 0.91, 0.92), smoothstep(0.18, 0.95, y)); gl_FragColor = vec4(c, 1.); }`,
  }));
  scene.add(walls);
  const box = (/** @type {number[]} */ size, /** @type {number[]} */ at, /** @type {number} */ glow) => {
    const m = new Mesh(new BoxGeometry(size[0], size[1], size[2]), new MeshBasicMaterial({ color: new Color().setScalar(glow) }));
    m.position.set(at[0], at[1], at[2]); scene.add(m);
  };
  for (const x of [-2.6, 0, 2.6]) box([0.55, 0.05, 13], [x, 7, 0], 16); // strips overhead
  box([0.05, 1.6, 10], [-9, 4.2, 0], 6); box([0.05, 1.6, 10], [9, 4.2, 0], 6); // side softboxes
  box([7, 2.6, 0.05], [0, 3, 11], 2.2); box([7, 2.6, 0.05], [0, 3, -11], 1.6); // front and back
  const pm = new PMREMGenerator(renderer);
  const env = pm.fromScene(scene, 0.03).texture;
  pm.dispose();
  return env;
}

/** A soft dark patch under the car, as in a studio photo. */
function floorShade() {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext("2d"));
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, "rgba(0,0,0,.55)"); grad.addColorStop(0.55, "rgba(0,0,0,.22)"); grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  const m = new Mesh(new PlaneGeometry(3.4, 5.6), new MeshBasicMaterial({ map: new CanvasTexture(c), transparent: true, depthWrite: false, blending: MultiplyBlending, premultipliedAlpha: true }));
  m.rotation.x = -Math.PI / 2; m.position.set(0, 0.002, 0.24);
  return m;
}

/**
 * @typedef {object} Glass
 * @property {number} light light through, 0–100 (100 = no film)
 * @property {string|null} [sheen] a chameleon film's colour cast, #rrggbb
 *
 * @typedef {object} Look
 * @property {string|null} paint wrap colour, or null for the car's own paint
 * @property {keyof typeof FINISH} finish
 * @property {string|null} rim wheel colour, or null for the car's own
 * @property {{ windscreen: Glass, fronts: Glass, rear: Glass }} glass
 */

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ model: string, onPick?: (part: string) => void, onProgress?: (loaded: number, total: number) => void, still?: boolean, interactive?: boolean }} o
 */
export async function studio(canvas, o) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: !!o.still, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, o.still ? 2 : 1.75));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;

  const scene = new Scene();
  scene.environment = studioLights(renderer);
  const camera = new PerspectiveCamera(28, 1, 0.1, 100);
  const key = new DirectionalLight(0xffffff, 0.6);
  key.position.set(1.5, 9, 2.5); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 9; key.shadow.bias = -0.0005;
  Object.assign(key.shadow.camera, { left: -3.2, right: 3.2, top: 3.6, bottom: -3.6, near: 1, far: 14 });
  scene.add(key);
  const ground = new Mesh(new PlaneGeometry(14, 14), new ShadowMaterial({ opacity: 0.22 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  scene.add(ground, floorShade());

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const car = new Group();
  scene.add(car);

  // Our own materials for the parts a visitor changes.
  const paint = new MeshPhysicalMaterial({ ...FINISH.gloss });
  /** @type {MeshPhysicalMaterial|null} */ let factory = null;
  /** @type {MeshPhysicalMaterial|null} */ let rimFactory = null;
  const rim = new MeshPhysicalMaterial({ metalness: 0.85, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.05 });
  const glassFor = () => new MeshPhysicalMaterial({ color: 0x0b0e11, metalness: 0, roughness: 0.02, transparent: true, opacity: glassOpacity(100), depthWrite: false, envMapIntensity: 2, iridescenceIOR: 1.8, iridescenceThicknessRange: [300, 700] });
  const glass = { windscreen: glassFor(), fronts: glassFor(), rear: glassFor() };
  /** @type {Mesh[]} */ let paintMeshes = [], rimMeshes = [];
  /** @type {Partial<Look>} */ const current = {};

  /** Loads a car model in place of the one shown (one per vehicle size). @param {string} url */
  const load = async (url) => {
    const gltf = await loader.loadAsync(url, (e) => o.onProgress?.(e.loaded, e.total));
    // Any car model: long side along z, 4.4 m long, centred, wheels on the floor.
    let box = new Box3().setFromObject(gltf.scene);
    const sz = box.getSize(new Vector3());
    if (sz.x > sz.z) { gltf.scene.rotation.y = Math.PI / 2; box = new Box3().setFromObject(gltf.scene); }
    // Nose to +z: the windscreen sits in front of the middle.
    const screen = new Box3();
    gltf.scene.traverse((o) => { const m = /** @type {Mesh} */ (o); if (m.isMesh && /windscreen$|Windshield/i.test(`${(/** @type {any} */ (m.material)).name} ${m.name}`)) screen.expandByObject(m); });
    if (!screen.isEmpty() && screen.getCenter(new Vector3()).z < box.getCenter(new Vector3()).z) { gltf.scene.rotation.y += Math.PI; box = new Box3().setFromObject(gltf.scene); }
    const c = box.getCenter(new Vector3());
    gltf.scene.position.set(-c.x, -box.min.y, -c.z);
    car.scale.setScalar(4.4 / Math.max(sz.x, sz.z));
    car.clear();
    car.add(gltf.scene);
    factory = null; rimFactory = null; paintMeshes = []; rimMeshes = [];
    car.traverse((obj) => {
      const m = /** @type {Mesh} */ (obj);
      if (!m.isMesh) return;
      m.castShadow = true;
      const mat = /** @type {MeshPhysicalMaterial} */ (m.material);
      const part = partOf(mat.name, m.name);
      m.userData.part = part;
      if (/^Paint 1/.test(mat.name)) { factory = mat; paintMeshes.push(m); }
      if (mat.name === "Rim2") { rimFactory = mat; rimMeshes.push(m); }
      if (part === "windscreen" || part === "fronts" || part === "rear") { m.material = glass[part]; m.castShadow = false; m.renderOrder = 2; }
    });
    if (factory) { paint.normalMap = /** @type {any} */ (factory).normalMap; paint.normalScale = /** @type {any} */ (factory).normalScale; }
    renderer.shadowMap.needsUpdate = true;
  };
  await load(o.model);

  const controls = new OrbitControls(camera, canvas);
  Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, enablePan: false, minDistance: 4.6, maxDistance: 14, minPolarAngle: 0.35, maxPolarAngle: 1.5, rotateSpeed: 0.7, zoomSpeed: 0.6 });
  controls.enabled = o.interactive !== false;

  // Drawing only when something moves.
  let frame = 0;
  /** @type {{ from: Vector3[], to: Vector3[], t0: number, ms: number } | null} */ let glide = null;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const size = () => {
    const w = canvas.clientWidth || 800, h = canvas.clientHeight || 450;
    if (canvas.width !== Math.round(w * renderer.getPixelRatio())) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  };
  const tick = () => {
    frame = 0;
    size();
    let moving = false;
    if (glide) {
      const k = Math.min(1, (performance.now() - glide.t0) / glide.ms), e = 1 - Math.pow(1 - k, 3);
      camera.position.lerpVectors(glide.from[0], glide.to[0], e);
      controls.target.lerpVectors(glide.from[1], glide.to[1], e);
      if (k >= 1) glide = null; else moving = true;
    }
    if (controls.update()) moving = true;
    renderer.render(scene, camera);
    if (moving) draw();
  };
  const draw = () => { if (!frame) frame = requestAnimationFrame(tick); };
  controls.addEventListener("change", draw);
  canvas.addEventListener("pointerdown", draw);
  const resize = new ResizeObserver(draw);
  resize.observe(canvas);

  /** @param {keyof typeof VIEWS} name @param {boolean} [animate] */
  const view = (name, animate = true) => {
    const [p, t] = VIEWS[name] ?? VIEWS.wrap;
    // Narrow screens step back so the whole car stays in the picture.
    size();
    const back = Math.max(1, Math.pow(1.6 / camera.aspect, 0.85));
    const target = new Vector3(...t);
    const to = [new Vector3(...p).sub(target).multiplyScalar(back).add(target), target];
    if (!animate || reduce) { camera.position.copy(to[0]); controls.target.copy(to[1]); glide = null; }
    else glide = { from: [camera.position.clone(), controls.target.clone()], to, t0: performance.now(), ms: 1300 };
    draw();
  };

  // Tapping a part (a tap, not a drag).
  const down = new Vector2(), ray = new Raycaster(), ndc = new Vector2();
  canvas.addEventListener("pointerdown", (e) => down.set(e.clientX, e.clientY));
  canvas.addEventListener("pointerup", (e) => {
    if (!o.onPick || down.distanceTo(new Vector2(e.clientX, e.clientY)) > 6) return;
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObject(car, true).find((h) => h.object.userData.part);
    if (hit) o.onPick(hit.object.userData.part);
  });

  /** @param {Partial<Look>} look */
  const set = (look) => {
    Object.assign(current, look);
    if (look.paint !== undefined || look.finish) {
      const own = !look.paint;
      if (!own) {
        Object.assign(paint, FINISH[look.finish ?? "gloss"] ?? FINISH.gloss);
        paint.color.set(/** @type {string} */ (look.paint));
        paint.normalScale.setScalar(0.15);
        paint.needsUpdate = true;
      }
      for (const m of paintMeshes) m.material = own && factory ? factory : paint;
    }
    if (look.rim !== undefined) {
      if (look.rim) rim.color.set(look.rim);
      for (const m of rimMeshes) m.material = look.rim || !rimFactory ? rim : rimFactory;
    }
    for (const [w, g] of Object.entries(look.glass ?? {})) {
      const mat = glass[/** @type {"windscreen"|"fronts"|"rear"} */ (w)];
      mat.opacity = glassOpacity(g.light);
      mat.color.set(g.sheen ? new Color(g.sheen).multiplyScalar(0.35) : new Color(0x0b0e11));
      mat.iridescence = g.sheen ? 1 : 0;
      mat.needsUpdate = true;
    }
    draw();
  };

  renderer.shadowMap.needsUpdate = true;
  view("wrap", false);
  return {
    set, view, renderer, camera, draw, scene, car,
    /** Shows another car model with the same look. @param {string} url */
    async swap(url) { await load(url); set({ ...current }); },
    /** Puts the camera exactly here (for still pictures). @param {number[]} p @param {number[]} t */
    aim(p, t) { camera.position.set(p[0], p[1], p[2]); controls.target.set(t[0], t[1], t[2]); glide = null; },
    /** Draws now (for still pictures). */
    render() { size(); controls.update(); renderer.shadowMap.needsUpdate = true; renderer.render(scene, camera); },
    dispose() { cancelAnimationFrame(frame); resize.disconnect(); controls.dispose(); renderer.dispose(); },
  };
}
