// @ts-check
/**
 * Stone chip test: a stone thrown at the front of the car flies in from the road and lands where it was aimed.
 * On the left (bare paint) it leaves a chip down to the primer; on the right (under film) the film flexes and the
 * paint stays as it was. Only the car itself can be hit, from the bonnet down (not the windscreen).
 */

/** Seeded-free small helpers. @param {number} a @param {number} b */
const rand = (a, b) => a + Math.random() * (b - a);

/**
 * A chip's outline: an irregular polygon around (x, y).
 * @param {number} x @param {number} y @param {number} r @returns {[number, number][]}
 */
export function chipShape(x, y, r) {
  const n = 7 + Math.floor(Math.random() * 4);
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + rand(-0.25, 0.25), k = r * rand(0.55, 1.15);
    return [x + Math.cos(a) * k, y + Math.sin(a) * k * 0.8];
  });
}

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const img = /** @type {HTMLImageElement|null} */ (root.querySelector("[data-ct-img]"));
  const canvas = /** @type {HTMLCanvasElement|null} */ (root.querySelector("[data-ct-canvas]"));
  const paintN = root.querySelector("[data-ct-paint]"), filmN = root.querySelector("[data-ct-film]");
  if (!img || !canvas || !paintN || !filmN) throw new Error("chip test markup missing");
  const g = /** @type {CanvasRenderingContext2D} */ (canvas.getContext("2d"));
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  /** @type {{ x: number, y: number, r: number, shape: [number, number][] }[]} */
  let chips = [];
  /** @type {{ x: number, y: number, t0: number, film: boolean }[]} */
  let flying = [];
  /** @type {{ x: number, y: number, t0: number }[]} */
  let ripples = [];
  let paint = 0, frame = 0;
  /** @type {Uint8ClampedArray|null} */ let alpha = null;

  // Where the car is: its own outline, read once from the picture.
  const readAlpha = () => {
    if (alpha || !img.naturalWidth) return;
    const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = /** @type {CanvasRenderingContext2D} */ (c.getContext("2d"));
    x.drawImage(img, 0, 0);
    try { alpha = x.getImageData(0, 0, c.width, c.height).data; } catch { alpha = null; }
  };
  /** Is (u, v) (0–1 across the picture) on the car, below the windscreen? @param {number} u @param {number} v */
  const onCar = (u, v) => {
    if (v < 0.36) return false;
    if (!alpha) return true;
    const px = Math.floor(u * img.naturalWidth), py = Math.floor(v * img.naturalHeight);
    return alpha[(py * img.naturalWidth + px) * 4 + 3] > 200;
  };

  const fit = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.round(img.clientWidth * dpr), h = Math.round(img.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  };

  const draw = () => {
    frame = 0;
    fit();
    const W = canvas.width, H = canvas.height, now = performance.now();
    g.clearRect(0, 0, W, H);
    for (const c of chips) {
      const pts = c.shape.map(([x, y]) => [x * W, y * H]);
      g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
      g.fillStyle = "rgba(205, 203, 196, .95)"; g.fill(); // primer showing through
      g.lineWidth = Math.max(1, W / 700); g.strokeStyle = "rgba(0, 0, 0, .55)"; g.stroke();
      g.beginPath(); g.arc(c.x * W, c.y * H, c.r * W * 0.3, 0, Math.PI * 2); g.fillStyle = "rgba(255, 255, 255, .9)"; g.fill(); // bare metal
    }
    flying = flying.filter((s) => {
      const k = Math.min(1, (now - s.t0) / 260);
      if (k >= 1) { land(s); return false; }
      const sx = 0.5 + (s.x - 0.5) * 0.3, sy = 1.15; // from the road ahead
      const x = (sx + (s.x - sx) * k) * W, y = (sy + (s.y - sy) * k) * H, r = (1 - k * 0.7) * W * 0.012;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = "rgba(60, 58, 54, .9)"; g.fill();
      return true;
    });
    ripples = ripples.filter((p) => {
      const k = (now - p.t0) / 450;
      if (k >= 1) return false;
      g.beginPath(); g.arc(p.x * W, p.y * H, W * (0.006 + k * 0.03), 0, Math.PI * 2);
      g.strokeStyle = `rgba(255, 255, 255, ${(0.7 * (1 - k)).toFixed(2)})`; g.lineWidth = Math.max(1, W / 500); g.stroke();
      return true;
    });
    if (flying.length || ripples.length) frame = requestAnimationFrame(draw);
  };
  const again = () => { if (!frame) frame = requestAnimationFrame(draw); };

  /** @param {{ x: number, y: number, film: boolean }} s */
  const land = (s) => {
    if (s.film) ripples.push({ x: s.x, y: s.y, t0: performance.now() });
    else { chips.push({ x: s.x, y: s.y, r: rand(0.006, 0.012), shape: chipShape(s.x, s.y, rand(0.006, 0.012)) }); paint += 1; paintN.textContent = String(paint); }
  };
  /** Throws a stone at (u, v). @param {number} u @param {number} v */
  const throwAt = (u, v) => {
    readAlpha();
    if (!onCar(u, v)) return false;
    const s = { x: u, y: v, film: u > 0.5, t0: performance.now() };
    if (still) land(s); else flying.push(s);
    again();
    return true;
  };

  canvas.addEventListener("pointerup", (e) => {
    const r = canvas.getBoundingClientRect();
    throwAt((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  });
  root.querySelector("[data-ct-drive]")?.addEventListener("click", () => {
    let thrown = 0, tries = 0;
    const next = () => {
      while (tries < 200 && !throwAt(rand(0.08, 0.92), rand(0.38, 0.95))) tries += 1;
      thrown += 1;
      if (thrown < 16) setTimeout(next, still ? 0 : rand(60, 180));
    };
    next();
  });
  root.querySelector("[data-ct-reset]")?.addEventListener("click", () => { chips = []; paint = 0; paintN.textContent = "0"; again(); });
  addEventListener("resize", again);
  if (img.complete) again(); else img.addEventListener("load", again, { once: true });
}
