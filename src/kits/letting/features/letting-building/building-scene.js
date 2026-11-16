// @ts-nocheck
/**
 * The building as a code-built 3D illustration, loaded only when the visitor taps "See the building" (three.js, in
 * its own chunk). One engine, three building types: an Edwardian mansion block, a curved riverside tower and a
 * Regency stucco terrace. Every home owns its window panes; a free home's panes glow, a chosen floor gets a band of
 * the accent colour, a tapped window opens that home. The look gives the palette (CSS custom properties, read by
 * letting-building.js); a stale sheet lights nothing. A slow turn on arrival (none under reduced motion), then still:
 * the scene renders only when something changes.
 */
import {
  Scene, PerspectiveCamera, WebGLRenderer, ACESFilmicToneMapping, SRGBColorSpace, PCFSoftShadowMap,
  HemisphereLight, DirectionalLight, AmbientLight, Group, Mesh, BoxGeometry, PlaneGeometry, CylinderGeometry,
  ConeGeometry, ExtrudeGeometry, Shape, TorusGeometry, MeshStandardMaterial, ShadowMaterial, Color, Raycaster,
  Vector2, Vector3, DoubleSide, MathUtils, CanvasTexture, RepeatWrapping
} from "three";

// Procedural brick: running bond with mortar, a little variation per brick.
function brickTexture(hex, rx = 12, ry = 2) {
  const c = document.createElement("canvas"); c.width = 256; c.height = 256; const x = c.getContext("2d");
  const base = new Color(hex); x.fillStyle = "#d9cdbb"; x.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 16; r++) for (let k = -1; k < 5; k++) {
    const v = base.clone().offsetHSL(0, (Math.random() - .5) * .06, (Math.random() - .5) * .07);
    x.fillStyle = "#" + v.getHexString(); x.fillRect(k * 64 + (r % 2) * 32 + 2, r * 16 + 2, 60, 12);
  }
  const t = new CanvasTexture(c); t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = "srgb"; t.anisotropy = 4; return t;
}

const mat = (color, o = {}) => new MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...o });

function box(w, h, d, m, x = 0, y = 0, z = 0, cast = true) {
  const b = new Mesh(new BoxGeometry(w, h, d), m);
  b.position.set(x, y, z); b.castShadow = cast; b.receiveShadow = true; return b;
}

// A window pane that can glow. Every unit owns a list of these.
function pane(w, h, glass) {
  const m = new Mesh(new PlaneGeometry(w, h), glass.clone());
  m.userData.pane = true;
  if (glass.userData.frame) { // a painted frame and a glazing bar behind and across the glass
    const f = new Mesh(new PlaneGeometry(w + 0.22, h + 0.22), glass.userData.frame); f.position.z = -0.01; m.add(f);
    const bar = new Mesh(new PlaneGeometry(w, 0.07), glass.userData.frame); bar.position.z = 0.005; m.add(bar);
  }
  return m;
}

function glassMat(p) {
  const g = new MeshStandardMaterial({ color: p.glass, roughness: 0.15, metalness: 0.5, emissive: new Color(p.glow), emissiveIntensity: 0 });
  if (p.frame) g.userData.frame = new MeshStandardMaterial({ color: p.frame, roughness: 0.6 });
  return g;
}

/* ---------- A: Edwardian mansion block, brick with stone bands and corner turrets ---------- */
function mansion(data, p) {
  const g = new Group(), units = {}, floors = [];
  const W = 22, D = 12, FH = 3.2, N = data.floors.length; // floors incl. ground
  const brick = mat("#ffffff", { roughness: 0.95, map: brickTexture(p.brick) }), turretBrick = mat("#ffffff", { roughness: 0.95, map: brickTexture(p.brick, 4, 14) }), stone = mat(p.stone), slate = mat(p.roof, { roughness: 0.7 });
  const glass = glassMat(p);
  for (let i = 0; i < N; i++) {
    const y = i * FH;
    floors.push({ y, h: FH, id: data.floors[i].id });
    g.add(box(W, FH, D, i === 0 ? stone : brick, 0, y + FH / 2, 0));
    g.add(box(W + 0.3, 0.22, D + 0.3, stone, 0, y + FH - 0.05, 0));
    const fu = data.floors[i].units;
    fu.forEach((u, k) => {
      units[u.id] = units[u.id] || [];
      const x0 = -W / 2 + (W / fu.length) * k, span = W / fu.length;
      for (let j = 0; j < 3; j++) {
        const x = x0 + span * (j + 1) / 4;
        const front = pane(1.25, i === 1 ? 2.2 : 1.9, glass); front.position.set(x, y + FH * 0.48, D / 2 + 0.02);
        const back = pane(1.25, 1.9, glass); back.position.set(x, y + FH * 0.48, -D / 2 - 0.02); back.rotation.y = Math.PI;
        g.add(front, back); units[u.id].push(front, back);
        g.add(box(1.5, 0.14, 0.25, stone, x, y + FH * 0.48 - 1.05, D / 2 + 0.1));
      }
      const side = pane(1.25, 1.9, glass);
      side.position.set(k === 0 ? -W / 2 - 0.02 : W / 2 + 0.02, y + FH * 0.48, 0);
      side.rotation.y = k === 0 ? -Math.PI / 2 : Math.PI / 2; g.add(side); units[u.id].push(side);
    });
    if (i === 2 || i === 5) { // balconies with railings
      g.add(box(W * 0.62, 0.18, 1.1, stone, 0, y + 0.05, D / 2 + 0.55));
      const ir = mat(p.iron, { metalness: 0.4, roughness: 0.5 });
      g.add(box(W * 0.62, 0.06, 0.06, ir, 0, y + 1.0, D / 2 + 1.08, false));
      for (let q = 0; q <= 34; q++) g.add(box(0.035, 0.9, 0.035, ir, -W * 0.31 + (W * 0.62 * q) / 34, y + 0.55, D / 2 + 1.08, false));
    }
  }
  const H = N * FH;
  for (const sx of [-1, 1]) { // corner turrets
    const t = new Mesh(new CylinderGeometry(2.3, 2.3, H, 28), turretBrick); t.position.set(sx * (W / 2), H / 2, D / 2 - 1.2); t.castShadow = true; g.add(t);
    for (let i = 0; i < N; i++) {
      g.add(new Mesh(new CylinderGeometry(2.42, 2.42, 0.22, 28), stone).translateX(sx * W / 2).translateY(i * 3.2 + 3.15).translateZ(D / 2 - 1.2));
      const u = data.floors[i].units[sx < 0 ? 0 : data.floors[i].units.length - 1];
      const w = pane(1.1, 1.8, glass); const a = sx < 0 ? -0.35 : 0.35;
      w.position.set(sx * W / 2 + Math.sin(a) * 2.32, i * 3.2 + 1.55, D / 2 - 1.2 + Math.cos(a) * 2.32); w.rotation.y = a;
      g.add(w); units[u.id].push(w);
    }
    const cap = new Mesh(new ConeGeometry(2.6, 3.6, 28), slate); cap.position.set(sx * W / 2, H + 1.8, D / 2 - 1.2); cap.castShadow = true; g.add(cap);
  }
  const rs = new Shape(); rs.moveTo(-D / 2 - 0.3, 0); rs.lineTo(0, 3.2); rs.lineTo(D / 2 + 0.3, 0); rs.lineTo(-D / 2 - 0.3, 0);
  const roof = new Mesh(new ExtrudeGeometry(rs, { depth: W - 3, bevelEnabled: false }), slate);
  roof.rotation.y = Math.PI / 2; roof.position.set(-(W - 3) / 2, H, 0); roof.castShadow = true; g.add(roof);
  for (let k = -2; k <= 2; k++) g.add(box(1.4, 1.8, 0.9, brick, k * 3.6, H + 1.1, 2.6)); // dormers
  g.add(box(4.2, 3.6, 1.4, stone, 0, 1.8, D / 2 + 0.7)); // entrance portico
  return { g, units, floors, height: H + 4, width: Math.hypot(W + 5, D + 4) };
}

/* ---------- B: a curved riverside tower, glass bands between concrete slabs ---------- */
function ellipseShape(rx, rz, inner = 0) {
  const s = new Shape(); s.absellipse(0, 0, rx, rz, 0, Math.PI * 2, false, 0);
  if (inner) { const h = new Shape(); h.absellipse(0, 0, rx - inner, rz - inner, 0, Math.PI * 2, true, 0); s.holes.push(h); }
  return s;
}
function tower(data, p) {
  const g = new Group(), units = {}, floors = [];
  const RX = 9, RZ = 6.2, FH = 3.1, N = data.floors.length;
  const slab = mat(p.stone, { roughness: 0.6 }), core = mat(p.glass, { roughness: 0.3, metalness: 0.4 });
  const glass = glassMat(p), rail = mat(p.iron, { metalness: 0.6, roughness: 0.35 });
  for (let i = 0; i < N; i++) {
    const y = i * FH; floors.push({ y, h: FH, id: data.floors[i].id });
    const s = new Mesh(new ExtrudeGeometry(ellipseShape(RX + 1.2, RZ + 1.2), { depth: 0.38, bevelEnabled: false, curveSegments: 64 }), slab);
    s.rotation.x = -Math.PI / 2; s.position.y = y; s.castShadow = s.receiveShadow = true; g.add(s);
    const c = new Mesh(new ExtrudeGeometry(ellipseShape(RX - 0.2, RZ - 0.2), { depth: FH - 0.38, bevelEnabled: false, curveSegments: 64 }), core);
    c.rotation.x = -Math.PI / 2; c.position.y = y + 0.38; g.add(c);
    const r = new Mesh(new TorusGeometry(1, 0.012, 6, 96), rail); r.rotation.x = Math.PI / 2; r.scale.set(RX + 1.15, RZ + 1.15, 40); r.position.y = y + 1.4; g.add(r);
    const fu = data.floors[i].units, segs = 40;
    fu.forEach((u, k) => {
      units[u.id] = units[u.id] || [];
      const a0 = (k / fu.length) * Math.PI * 2 + 0.06, a1 = ((k + 1) / fu.length) * Math.PI * 2 - 0.06;
      for (let j = 0; j < segs / fu.length; j++) {
        const a = a0 + (a1 - a0) * (j + 0.5) / (segs / fu.length);
        const x = Math.cos(a) * (RX - 0.1), z = Math.sin(a) * (RZ - 0.1);
        const w = pane(((a1 - a0) / (segs / fu.length)) * ((RX + RZ) / 2) * 0.96, FH - 0.7, glass);
        w.position.set(x, y + 0.38 + (FH - 0.38) / 2, z);
        w.lookAt(x * 2, w.position.y, z * 2 * (RX / RZ) * (RX / RZ)); w.material.side = DoubleSide;
        g.add(w); units[u.id].push(w);
      }
    });
  }
  const H = N * FH;
  const crown = new Mesh(new ExtrudeGeometry(ellipseShape(RX + 1.2, RZ + 1.2, 0.5), { depth: 2.2, bevelEnabled: false, curveSegments: 64 }), slab);
  crown.rotation.x = -Math.PI / 2; crown.position.y = H; g.add(crown);
  return { g, units, floors, height: H + 3, width: RX * 2 + 4 };
}

/* ---------- C: a Regency stucco terrace of four houses, now residences floor by floor ---------- */
function railing(g, m, len, h, x, y, z, step = 0.22) {
  g.add(box(len, 0.05, 0.05, m, x, y + h, z, false));
  const n = Math.round(len / step);
  for (let q = 0; q <= n; q++) g.add(box(0.03, h, 0.03, m, x - len / 2 + (len * q) / n, y + h / 2, z, false));
}
function terrace(data, p) {
  const g = new Group(), units = {}, floors = [];
  const HW = 6.4, HOUSES = 4, W = HW * HOUSES, D = 13;
  const hts = data.floors.map(f => f.h || 3.2);
  const stucco = mat(p.stone, { roughness: 0.75 }), iron = mat(p.iron, { metalness: 0.4, roughness: 0.5 }), slate = mat(p.roof, { roughness: 0.7 });
  const glass = glassMat(p);
  let y = 0;
  data.floors.forEach((f, i) => {
    const FH = hts[i]; floors.push({ y, h: FH, id: f.id });
    g.add(box(W, FH, D, stucco, 0, y + FH / 2, 0));
    if (i === 0 || i === 1) for (let r = 1; r < 4; r++) g.add(box(W + 0.04, 0.05, D + 0.04, mat(p.groove), 0, y + (FH * r) / 4, 0, false));
    if (i === 1) g.add(box(W + 0.5, 0.3, D + 0.5, stucco, 0, y + FH, 0));
    f.units.forEach((u, k) => {
      units[u.id] = units[u.id] || [];
      const cx = -W / 2 + HW * k + HW / 2;
      const n = 3, wh = i === 2 ? FH * 0.72 : FH * 0.58;
      for (let j = 0; j < n; j++) {
        const x = cx + (j - 1) * 1.75;
        if (i === 1 && j === 0) continue; // the front door sits here
        const w = pane(1.05, wh, glass); w.position.set(x, y + FH * 0.52, D / 2 + 0.02); g.add(w); units[u.id].push(w);
        const b = pane(1.05, wh, glass); b.position.set(x, y + FH * 0.52, -D / 2 - 0.02); b.rotation.y = Math.PI; g.add(b); units[u.id].push(b);
      }
      if (i === 2) { // first-floor balconettes
        g.add(box(HW - 0.6, 0.12, 0.7, stucco, cx, y + 0.1, D / 2 + 0.35));
        railing(g, iron, HW - 0.6, 0.8, cx, y + 0.15, D / 2 + 0.68);
      }
    });
    y += FH;
  });
  const H = y;
  for (let k = 0; k < HOUSES; k++) { // porticoes, steps, party walls
    const cx = -W / 2 + HW * k + HW / 2 - 1.75, gy = floors[1].y;
    for (const dx of [-0.75, 0.75]) { const c = new Mesh(new CylinderGeometry(0.18, 0.2, 3.0, 16), stucco); c.position.set(cx + dx, gy + 1.5, D / 2 + 1.3); c.castShadow = true; g.add(c); }
    g.add(box(2.1, 0.45, 1.7, stucco, cx, gy + 3.2, D / 2 + 0.85));
    g.add(box(2.0, 0.25, 1.6, stucco, cx, gy - 0.1, D / 2 + 0.85));
    if (k) g.add(box(0.25, 1.2, 1.0, stucco, -W / 2 + HW * k, H + 0.6, 0));
  }
  g.add(box(W + 0.6, 0.35, D + 0.6, stucco, 0, H, 0));
  const rs = new Shape(); rs.moveTo(-D / 2, 0); rs.lineTo(-D / 2 + 1.6, 2.4); rs.lineTo(D / 2 - 1.6, 2.4); rs.lineTo(D / 2, 0); rs.lineTo(-D / 2, 0);
  const roof = new Mesh(new ExtrudeGeometry(rs, { depth: W, bevelEnabled: false }), slate); roof.rotation.y = Math.PI / 2; roof.position.set(-W / 2, H + 0.17, 0); roof.castShadow = true; g.add(roof);
  railing(g, iron, W + 0.4, 1.0, 0, floors[1].y, D / 2 + 2.4, 0.3); // area railings
  g.position.y = -floors[1].y + 0.0;
  return { g, units, floors, height: H + 2, width: Math.hypot(W + 2, D + 4) };
}

const TYPES = { mansion, tower, terrace };

export function mountBuilding(host, opts) {
  const { type, data, palette: p, onPick, reduced } = opts;
  const scene = new Scene();
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = SRGBColorSpace; renderer.shadowMap.enabled = true; renderer.shadowMap.type = PCFSoftShadowMap;
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute("aria-hidden", "true");

  scene.add(new HemisphereLight(p.sky, p.groundLight, p.night ? 0.35 : 1.0));
  scene.add(new AmbientLight(0xffffff, p.night ? 0.08 : 0.15));
  const sun = new DirectionalLight(p.sun, p.night ? 0.5 : 2.6);
  sun.position.set(-30, 46, 34); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 60, bottom: -10, near: 1, far: 160 }); sun.shadow.bias = -0.0004;
  scene.add(sun);
  const ground = new Mesh(new PlaneGeometry(400, 400), new ShadowMaterial({ opacity: p.night ? 0.0 : 0.16 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  const b = TYPES[type](data, p); scene.add(b.g);
  const camera = new PerspectiveCamera(26, 1, 1, 600);
  const target = new Vector3(0, b.height * (opts.lookAt ?? 0.42), 0);
  let angle = MathUtils.degToRad(opts.angle ?? 28);

  const allPanes = Object.values(b.units).flat();
  const unitOf = new Map(); for (const [id, ps] of Object.entries(b.units)) ps.forEach(m => unitOf.set(m, id));
  const status = {}; data.floors.forEach(f => f.units.forEach(u => (status[u.id] = { ...u, floor: f.id })));
  let floor = null, picked = null, live = !opts.stale, lift = 0;

  const bandMat = new MeshStandardMaterial({ color: p.accent, emissive: new Color(p.accent), emissiveIntensity: 0.8 });
  const band = type === "tower" ? new Mesh(new TorusGeometry(1, 0.0045, 6, 120), bandMat) : box(1, 0.08, 1, bandMat, 0, 0, 0, false);
  if (type === "tower") band.rotation.x = Math.PI / 2;
  band.visible = false; scene.add(band);

  function paint() {
    for (const m of allPanes) {
      const id = unitOf.get(m), u = status[id];
      const onFloor = floor === null || u.floor === floor;
      const free = live && u.status === "available";
      const base = p.night ? 0.06 : 0;
      m.material.emissiveIntensity = free ? (id === picked ? 4.2 : onFloor ? (floor === null ? 1.8 : 3.0) : 0.5) : base;
      m.material.color.set(free && onFloor ? p.glassLit : p.glass);
    }
    if (floor !== null) {
      const f = b.floors.find(x => x.id === floor);
      band.visible = true; band.position.set(0, f.y + b.g.position.y + 0.02, 0);
      if (type === "tower") { band.scale.set(10.5, 7.7, 30); band.position.y += 0.45; }
      else band.scale.set(type === "terrace" ? 26 : 22.4, 1, type === "terrace" ? 13.6 : 12.6);
    } else band.visible = false;
    render();
  }

  function size() {
    const r = host.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false); renderer.domElement.style.width = "100%"; renderer.domElement.style.height = "100%";
    camera.aspect = r.width / r.height;
    const t = Math.tan(MathUtils.degToRad(camera.fov / 2));
    const fit = Math.max((b.height * 0.64) / t, (b.width * 0.68) / (t * camera.aspect)) * (opts.zoom || 1);
    camera.position.set(Math.sin(angle) * fit, b.height * 0.5 + fit * 0.16, Math.cos(angle) * fit);
    camera.lookAt(target.x, target.y - lift * b.height * 0.32, target.z);
    const sx = typeof opts.shiftX === "function" ? opts.shiftX() : opts.shiftX || 0;
    if (sx) camera.setViewOffset(r.width, r.height, r.width * sx, 0, r.width, r.height); else camera.clearViewOffset();
    camera.updateProjectionMatrix(); render();
  }
  function render() { renderer.render(scene, camera); }

  // drag to turn; tap a lit window to open that home
  const ray = new Raycaster(), v = new Vector2();
  let down = null, raf = 0, last = 0;
  renderer.domElement.addEventListener("pointerdown", e => { down = { x: e.clientX, a: angle, moved: false }; });
  window.addEventListener("pointermove", e => { if (!down) return; const dx = e.clientX - down.x; if (Math.abs(dx) > 3) down.moved = true; angle = down.a - dx * 0.006; size(); });
  window.addEventListener("pointerup", e => {
    if (down && !down.moved && e.target === renderer.domElement) {
      const r = renderer.domElement.getBoundingClientRect();
      v.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(v, camera);
      const hit = ray.intersectObjects(allPanes, false)[0];
      if (hit) { const id = unitOf.get(hit.object); onPick && onPick(status[id]); }
    }
    down = null;
  });
  function tick(t) { // a slow quarter turn on arrival, then still
    if (!last) last = t; const dt = Math.min(0.05, (t - last) / 1000); last = t;
    if (down) { raf = 0; return; }
    if (Math.abs(angle - target.a) > 0.002) { angle += (target.a - angle) * Math.min(1, dt * 1.2); size(); raf = requestAnimationFrame(tick); }
    else raf = 0;
  }
  target.a = angle; if (!reduced) { angle -= 0.55; raf = requestAnimationFrame(tick); }
  new ResizeObserver(size).observe(host);
  size(); paint();
  return {
    setFloor(id) { floor = id; picked = null; paint(); },
    pick(id) { picked = id; const u = status[id]; if (u) floor = u.floor; paint(); },
    setLive(x) { live = x; paint(); },
    lift(on) { lift = on ? 1 : 0; size(); },
    destroy() { cancelAnimationFrame(raf); renderer.dispose(); renderer.domElement.remove(); }
  };
}
