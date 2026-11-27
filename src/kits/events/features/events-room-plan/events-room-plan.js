// @ts-check
/** Your room, drawn: redraws the plan to scale for the room, guests and layout chosen (or given in the link). */
import { drawRoom, roomWords, roomSvg, planBox, LAYOUTS } from "../../lib/events.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const rooms = /** @type {any} */ (ctx.data).events?.roomPlan;
  const q = (/** @type {string} */ s) => root.querySelector(s);
  const sel = /** @type {HTMLSelectElement|null} */ (q("[data-rp-room]")), range = /** @type {HTMLInputElement|null} */ (q("[data-rp-guests]"));
  const n = q("[data-rp-n]"), svg = q("[data-rp-svg]"), words = q("[data-rp-words]");
  const lays = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-rp-layout]")]);
  if (!rooms || !sel || !range || !n || !svg || !words || lays.length !== 3) throw new Error("room plan markup missing");
  let layout = /** @type {"long"|"round"|"standing"} */ (lays.find((b) => b.getAttribute("aria-pressed") === "true")?.dataset.rpLayout ?? "long");
  const draw = () => {
    const room = rooms.find((/** @type {any} */ r) => r.id === sel.value) ?? rooms[0];
    const g = Number(range.value);
    const p = drawRoom(room, g, layout);
    n.textContent = String(g);
    svg.setAttribute("viewBox", planBox(p));
    svg.innerHTML = roomSvg(p);
    words.textContent = roomWords(p, room.name);
    root.dataset.fits = String(p.fits);
    for (const b of lays) b.setAttribute("aria-pressed", String(b.dataset.rpLayout === layout));
  };
  // A link from the proposal: #room=<id>&guests=<n>&layout=<id>.
  const h = new URLSearchParams(location.hash.slice(1));
  if (rooms.some((/** @type {any} */ r) => r.id === h.get("room"))) sel.value = /** @type {string} */ (h.get("room"));
  const hg = Number(h.get("guests")); if (Number.isInteger(hg) && hg >= 10 && hg <= 400) range.value = String(Math.round(hg / 10) * 10);
  const hl = h.get("layout"); if (hl && hl in LAYOUTS) layout = /** @type {any} */ (hl);
  sel.addEventListener("change", draw);
  range.addEventListener("input", draw);
  for (const b of lays) b.addEventListener("click", () => { layout = /** @type {any} */ (b.dataset.rpLayout); draw(); });
  q("[data-rp-form]")?.addEventListener("submit", (e) => e.preventDefault());
  if (h.size) draw();
}
