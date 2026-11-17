// @ts-check
/**
 * The hem line: shoulder to floor and her shoes give the shop's length (lib/modest.js); the ruler beside the hem
 * photograph draws each length that reaches no further than the floor, the floor and the gap, as percentages of the
 * photograph's height, so it needs no redrawing on resize. The answer goes to the look bar ([data-look-length]).
 */
import { hemAnswer, rulerMarks, inches } from "../../lib/modest.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const L = /** @type {any} */ (ctx.data).lengths;
  if (!L) return;
  let sf = L.start.shoulderToFloor;
  let shoe = L.start.shoe;
  const q = (/** @type {string} */ s) => /** @type {HTMLElement} */ (root.querySelector(s));
  const sfB = q("[data-hem-sf]"), shoeB = q("[data-hem-shoe]"), out = q("[data-hem-out]"), ruler = q("[data-hem-ruler]"), more = q("[data-hem-more]"), chart = q(".md-hem-chart");
  const lo = Math.min(...L.rows.map((/** @type {any} */ r) => r.from)), hi = Math.max(...L.rows.map((/** @type {any} */ r) => r.to)) + 2;

  function draw() {
    const s = L.shoes[shoe];
    const a = hemAnswer({ lengths: L.lengths, clear: L.clear }, sf, s);
    sfB.textContent = `${inches(sf)}″`;
    sfB.setAttribute("aria-label", `Shoulder to floor, ${inches(sf)} inches: tap for an inch more`);
    shoeB.textContent = s.label;
    shoeB.setAttribute("aria-label", `Shoes: ${s.label}. Tap to change`);
    out.replaceChildren();
    if (a.length === null) out.textContent = a.words;
    else {
      const b = document.createElement("b");
      b.textContent = String(a.length);
      out.append("Wear the ", b, a.words.slice(`Wear the ${a.length}`.length));
    }
    for (const tr of root.querySelectorAll("tr[data-length]")) tr.classList.toggle("is-lit", Number(/** @type {HTMLElement} */ (tr).dataset.length) === a.length);
    const m = rulerMarks(L.lengths, a.reach, a.length);
    const pct = (/** @type {number} */ f) => `${(f * 100).toFixed(2)}%`;
    ruler.replaceChildren();
    for (const l of m.lines) {
      const ln = document.createElement("span");
      ln.className = l.on ? "ln on" : "ln";
      ln.style.top = pct(l.at);
      ln.innerHTML = `<span>${l.length}</span>`;
      ruler.append(ln);
    }
    const floor = document.createElement("span");
    floor.className = "floor";
    floor.style.top = pct(m.floor);
    floor.innerHTML = "<span>Floor</span>";
    ruler.append(floor);
    if (m.gap) {
      const gap = document.createElement("span");
      gap.className = "gap";
      gap.style.top = pct(m.gap.at);
      gap.textContent = m.gap.words;
      ruler.append(gap);
    }
    for (const el of document.querySelectorAll("[data-look-length]")) el.textContent = a.length === null ? "to measure" : String(a.length);
    ctx.share("modest-length", a.length);
  }

  for (const b of root.querySelectorAll("[data-hem-d]")) b.addEventListener("click", () => {
    sf = Math.min(hi, Math.max(lo, sf + Number(/** @type {HTMLElement} */ (b).dataset.hemD)));
    draw();
  });
  sfB.addEventListener("click", () => { sf = sf + 1 > hi ? lo : Math.floor(sf) + 1; draw(); });
  shoeB.addEventListener("click", () => { shoe = (shoe + 1) % L.shoes.length; draw(); });
  more.addEventListener("click", () => {
    const open = !chart.classList.contains("is-open");
    chart.classList.toggle("is-open", open);
    more.setAttribute("aria-expanded", String(open));
  });
  draw();
}
