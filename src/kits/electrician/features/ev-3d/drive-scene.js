// @ts-check
/**
 * The charger on your driveway, in 3D: the front of a house at blue hour, a car on the drive (the kit's credited model,
 * img/kit/ev-car.glb), and the charger on the wall. Drag the charger along the wall (or use the slider beside it);
 * the cable from the fuse board inside, and the charger's own lead to the car's port, are drawn and measured. Loaded
 * only on tap (ev-3d.js imports this file). Nothing is redrawn unless something moves.
 */
import {
  AdditiveBlending, Box3, BoxGeometry, CanvasTexture, CatmullRomCurve3, Color, DirectionalLight, Fog, Group,
  HemisphereLight, Mesh, MeshBasicMaterial, MeshStandardMaterial, NeutralToneMapping, PCFSoftShadowMap,
  PerspectiveCamera, PlaneGeometry, PMREMGenerator, PointLight, Raycaster, Scene, SRGBColorSpace, TubeGeometry, Vector2,
  Vector3, WebGLRenderer, LineDashedMaterial, Line, BufferGeometry, Plane, RepeatWrapping, MeshPhysicalMaterial,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/** Where things are on the front of the house (metres; the wall faces +z at z = 0). */
export const DRIVE = { boardX: -2.2, wallMin: -6.2, wallMax: 6.2, chargerY: 1.15, carX: 1.4, carZ: 3.5, carLength: 4.6 };
const WARM = new Color(0xffd2a1);

/** The fuse board to the charger: along the inside of the wall, plus a metre up and down. @param {number} x */
export const supplyRun = (x) => Math.abs(x - DRIVE.boardX) + 1;

/** @param {string} top @param {string} mid @param {string} bottom */
function sky(top, mid, bottom) {
  const c = document.createElement("canvas"); c.width = 4; c.height = 256;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext("2d"));
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, top); grad.addColorStop(0.6, mid); grad.addColorStop(1, bottom);
  g.fillStyle = grad; g.fillRect(0, 0, 4, 256);
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; return t;
}
function glow() {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext("2d"));
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, "rgba(255,255,255,.85)"); r.addColorStop(.4, "rgba(255,255,255,.3)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  return new CanvasTexture(c);
}

/**
 * A small repeating texture drawn on a canvas: running-bond brick, or stone setts for the drive.
 * @param {"brick"|"setts"} kind @param {number} rx @param {number} ry repeats across and up
 */
function pattern(kind, rx, ry) {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext("2d"));
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  if (kind === "brick") {
    g.fillStyle = "#6a5a50"; g.fillRect(0, 0, 256, 256); // mortar
    for (let row = 0; row < 16; row++) for (let col = -1; col < 5; col++) {
      const x = col * 64 + (row % 2) * 32, y = row * 16, l = 70 + rnd() * 40;
      g.fillStyle = `hsl(${12 + rnd() * 10}, ${34 + rnd() * 14}%, ${l / 3.2}%)`; g.fillRect(x + 2, y + 2, 60, 12);
    }
  } else {
    g.fillStyle = "#3d3a37"; g.fillRect(0, 0, 256, 256);
    for (let row = 0; row < 8; row++) for (let col = -1; col < 9; col++) {
      const x = col * 32 + (row % 2) * 16, y = row * 32, l = 38 + rnd() * 14;
      g.fillStyle = `hsl(30, 6%, ${l}%)`; g.fillRect(x + 1.5, y + 1.5, 29, 29);
    }
  }
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4;
  return t;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ model: string, chargerX: number, port: "front-left"|"front-right"|"rear-left"|"rear-right", onMove: (x: number, lead: number) => void, onProgress?: (loaded: number, total: number) => void }} o
 */
export async function driveScene(canvas, o) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;

  const scene = new Scene();
  scene.background = sky("#2a3d5e", "#1c2b43", "#101828");
  scene.fog = new Fog(0x16223a, 22, 55);
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;
  pmrem.dispose();

  const camera = new PerspectiveCamera(34, 1, 0.1, 120);
  camera.position.set(8.5, 3.4, 12.5);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0.6, 1.0, 1.6);
  controls.enableDamping = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  controls.enablePan = false;
  controls.minDistance = 6; controls.maxDistance = 20;
  controls.minPolarAngle = 0.9; controls.maxPolarAngle = 1.5;
  controls.minAzimuthAngle = -0.9; controls.maxAzimuthAngle = 0.95;

  scene.add(new HemisphereLight(0x6680b4, 0x0c121c, 0.6));
  const moon = new DirectionalLight(0xa9bde4, 0.7);
  moon.position.set(-9, 14, 16); moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024); moon.shadow.radius = 5; moon.shadow.bias = -0.0005;
  Object.assign(moon.shadow.camera, { left: -10, right: 10, top: 10, bottom: -6, near: 2, far: 50 });
  scene.add(moon);

  const m = (/** @type {number} */ c, o2 = {}) => new MeshStandardMaterial({ color: c, roughness: 0.9, ...o2 });
  const brick = new MeshStandardMaterial({ map: pattern("brick", 17, 5.6), roughness: 0.95 }), stone = new MeshStandardMaterial({ map: pattern("setts", 9, 6), roughness: 0.8 }), lawn = m(0x1b281d), frame = m(0x111317, { roughness: 0.5, metalness: 0.3 });
  const door = m(0x2a2e35, { roughness: 0.5 }), sill = m(0xcfc8bb);
  const lit = new MeshStandardMaterial({ color: 0x2a2116, emissive: 0xf0b77c, emissiveIntensity: 0.75 });
  const world = new Group(); scene.add(world);
  /** @param {number[]} a @param {number[]} b @param {MeshStandardMaterial|MeshBasicMaterial} mm */
  const box = (a, b, mm, cast = true) => {
    const mesh = new Mesh(new BoxGeometry(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), Math.abs(b[2] - a[2])), mm);
    mesh.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); mesh.castShadow = cast; mesh.receiveShadow = true;
    world.add(mesh); return mesh;
  };
  const ground = new Mesh(new PlaneGeometry(120, 120), lawn); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true; world.add(ground);
  box([-7.5, -0.04, 0], [7.5, 0, 9.5], stone);
  box([-7.5, 0, -0.4], [7.5, 6.2, 0], brick);
  box([-7.6, 6.2, -0.5], [7.6, 6.4, 0.25], frame);
  box([-0.3, 0, -0.05], [3.1, 2.35, 0.02], door); box([-0.4, 2.35, -0.05], [3.2, 2.45, 0.06], sill);
  box([-4.6, 0, -0.05], [-3.5, 2.2, 0.02], door); box([-4.6, 2.25, -0.05], [-3.5, 2.6, 0.01], lit, false);
  for (const [x0, x1, y0, y1] of [[-6.4, -5.0, 3.4, 5.2], [-2.8, -0.8, 3.4, 5.2], [1.0, 3.0, 3.4, 5.2], [4.6, 6.2, 3.4, 5.2], [4.6, 6.2, 0.9, 2.3]]) {
    box([x0, y0, 0.0], [x1, y1, 0.015], lit, false);
    // frame and glazing bars, set into the brick
    for (const [a, b] of [[[x0 - 0.05, y0], [x0 + 0.04, y1]], [[x1 - 0.04, y0], [x1 + 0.05, y1]], [[x0, y1 - 0.04], [x1, y1 + 0.05]], [[(x0 + x1) / 2 - 0.025, y0], [(x0 + x1) / 2 + 0.025, y1]], [[x0, (y0 + y1) / 2 + 0.1], [x1, (y0 + y1) / 2 + 0.15]]]) box([a[0], a[1], 0.0], [b[0], b[1], 0.05], frame, false);
    box([x0 - 0.1, y0 - 0.12, -0.05], [x1 + 0.1, y0, 0.12], sill);
  }
  const gTex = glow();
  for (const x of [-5.0, -3.1, 3.5]) {
    box([x - 0.06, 1.95, 0], [x + 0.06, 2.2, 0.1], frame);
    const w = new Mesh(new PlaneGeometry(1.0, 1.6), new MeshBasicMaterial({ map: gTex, color: WARM, transparent: true, opacity: 0.5, blending: AdditiveBlending, depthWrite: false }));
    w.position.set(x, 2.1, 0.02); world.add(w);
    const pl = new PointLight(WARM, 3.5, 5, 1.6); pl.position.set(x, 2.0, 0.4); world.add(pl);
  }

  // The charger: a slim box, a lit ring and a holster, slid along the wall.
  const charger = new Group();
  const body = new Mesh(new BoxGeometry(0.26, 0.38, 0.12), m(0x1a1c21, { roughness: 0.35, metalness: 0.2 }));
  body.position.z = 0.06; body.castShadow = true; charger.add(body);
  const led = new Mesh(new BoxGeometry(0.16, 0.012, 0.01), new MeshBasicMaterial({ color: 0xb3bfe6 }));
  led.position.set(0, 0.1, 0.125); charger.add(led);
  charger.position.set(o.chargerX, DRIVE.chargerY, 0);
  world.add(charger);

  // The fuse board's cable through the wall, drawn on its face, dashed.
  const runMat = new LineDashedMaterial({ color: 0xb3bfe6, dashSize: 0.12, gapSize: 0.1, transparent: true, opacity: 0.85 });
  const runLine = new Line(new BufferGeometry(), runMat); world.add(runLine);
  const board = new Mesh(new BoxGeometry(0.34, 0.24, 0.02), new MeshBasicMaterial({ color: 0xb3bfe6, transparent: true, opacity: 0.35 }));
  board.position.set(DRIVE.boardX, 1.9, 0.02); world.add(board);

  // The car.
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(o.model, (e) => o.onProgress?.(e.loaded, e.total));
  const car = new Group();
  let bb = new Box3().setFromObject(gltf.scene);
  const sz = bb.getSize(new Vector3());
  if (sz.x > sz.z) { gltf.scene.rotation.y = Math.PI / 2; bb = new Box3().setFromObject(gltf.scene); }
  const screen = new Box3();
  const paint = new MeshPhysicalMaterial({ color: 0x1d2633, metalness: 0.55, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.04 });
  gltf.scene.traverse((x) => { const mesh = /** @type {Mesh} */ (x); if (mesh.isMesh) { mesh.castShadow = true; mesh.receiveShadow = true; if (/^Paint 1/.test((/** @type {any} */ (mesh.material)).name ?? "")) mesh.material = paint; if (/windscreen$|Windshield/i.test(`${(/** @type {any} */ (mesh.material)).name} ${mesh.name}`)) screen.expandByObject(mesh); } });
  if (!screen.isEmpty() && screen.getCenter(new Vector3()).z < bb.getCenter(new Vector3()).z) { gltf.scene.rotation.y += Math.PI; bb = new Box3().setFromObject(gltf.scene); }
  const c = bb.getCenter(new Vector3());
  gltf.scene.position.set(-c.x, -bb.min.y, -c.z);
  car.add(gltf.scene);
  car.scale.setScalar(DRIVE.carLength / Math.max(sz.x, sz.z));
  car.rotation.y = Math.PI; // nose to the wall
  car.position.set(DRIVE.carX, 0, DRIVE.carZ);
  world.add(car);
  const carBox = new Box3().setFromObject(car);
  const half = (carBox.max.x - carBox.min.x) / 2;

  /** The car's charging port for each side, in the world. @param {string} port */
  const portAt = (port) => {
    const [end, side] = port.split("-");
    const x = DRIVE.carX + (side === "left" ? -1 : 1) * (half - 0.02);
    const z = end === "front" ? carBox.min.z + 0.75 : carBox.max.z - 0.8;
    return new Vector3(x, 0.78, z);
  };
  let port = o.port;
  const leadMat = m(0x0f1013, { roughness: 0.45 });
  const lead = new Mesh(new BufferGeometry(), leadMat); lead.castShadow = true; world.add(lead);
  const portMark = new Mesh(new BoxGeometry(0.12, 0.12, 0.04), new MeshBasicMaterial({ color: 0xb3bfe6 }));
  world.add(portMark);

  let frameId = 0;
  const size = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 1 ? 48 : 34; camera.updateProjectionMatrix();
  };
  const draw = () => {
    frameId = 0;
    const moving = controls.update();
    renderer.render(scene, camera);
    if (moving) frameId = requestAnimationFrame(draw);
  };
  const wake = () => { if (!frameId) frameId = requestAnimationFrame(draw); };

  const rebuild = () => {
    const x = charger.position.x;
    const pts = [new Vector3(DRIVE.boardX, 1.9, 0.015), new Vector3(DRIVE.boardX, DRIVE.chargerY + 0.6, 0.015), new Vector3(x, DRIVE.chargerY + 0.6, 0.015), new Vector3(x, DRIVE.chargerY + 0.19, 0.015)];
    runLine.geometry.dispose(); runLine.geometry = new BufferGeometry().setFromPoints(pts); runLine.computeLineDistances();
    const p = portAt(port);
    portMark.position.copy(p).add(new Vector3(p.x < DRIVE.carX ? -0.02 : 0.02, 0, 0));
    portMark.rotation.y = Math.PI / 2;
    const out = new Vector3(p.x + (p.x < DRIVE.carX ? -0.35 : 0.35), 0.5, p.z);
    const curve = new CatmullRomCurve3([
      new Vector3(x, DRIVE.chargerY - 0.19, 0.12), new Vector3(x, 0.35, 0.25), new Vector3(x + (out.x - x) * 0.3, 0.03, 0.4 + (out.z - 0.4) * 0.3),
      new Vector3(x + (out.x - x) * 0.75, 0.03, 0.4 + (out.z - 0.4) * 0.75), out, p,
    ]);
    lead.geometry.dispose(); lead.geometry = new TubeGeometry(curve, 120, 0.016, 8, false);
    renderer.shadowMap.needsUpdate = true;
    o.onMove(x, curve.getLength());
    wake();
  };

  // Drag the charger along the wall.
  const ray = new Raycaster(), ndc = new Vector2(), wall = new Plane(new Vector3(0, 0, 1), -0.06), hit = new Vector3();
  let dragging = false;
  const toNdc = (/** @type {PointerEvent} */ e) => { const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); };
  canvas.addEventListener("pointerdown", (e) => { toNdc(e); if (ray.intersectObject(body, false).length) { dragging = true; controls.enabled = false; canvas.setPointerCapture(e.pointerId); } });
  canvas.addEventListener("pointermove", (e) => { if (!dragging) return; toNdc(e); if (ray.ray.intersectPlane(wall, hit)) { charger.position.x = Math.max(DRIVE.wallMin, Math.min(DRIVE.wallMax, hit.x)); rebuild(); } });
  const end = () => { dragging = false; controls.enabled = true; };
  canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
  controls.addEventListener("change", wake);
  const ro = new ResizeObserver(() => { size(); wake(); }); ro.observe(canvas);
  size();
  moon.shadow.needsUpdate = true;
  rebuild();

  return {
    /** @param {number} x */
    setCharger(x) { charger.position.x = Math.max(DRIVE.wallMin, Math.min(DRIVE.wallMax, x)); rebuild(); },
    /** @param {"front-left"|"front-right"|"rear-left"|"rear-right"} p */
    setPort(p) { port = p; rebuild(); },
    dispose() { cancelAnimationFrame(frameId); ro.disconnect(); controls.dispose(); renderer.dispose(); },
  };
}
