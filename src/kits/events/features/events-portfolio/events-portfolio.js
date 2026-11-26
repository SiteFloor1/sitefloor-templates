// @ts-check
/** Rooms for your number: filters the portfolio by occasion and guests (within a third either way), closest first. */
import { roomsFor } from "../../lib/events.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const rooms = /** @type {any} */ (ctx.data).events?.rooms;
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-ep-form]"));
  const n = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-ep-guests]"));
  const list = root.querySelector("[data-ep-list]"), found = root.querySelector("[data-ep-found]");
  if (!rooms || !form || !n || !list || !found) throw new Error("portfolio markup missing");
  const items = /** @type {HTMLElement[]} */ ([...list.querySelectorAll("[data-ep-room]")]);
  const draw = () => {
    const occ = /** @type {HTMLInputElement|null} */ (form.querySelector("input[name=occ]:checked"))?.value ?? "";
    const g = Number.parseInt(n.value, 10);
    const hits = roomsFor(rooms, Number.isFinite(g) && g > 1 ? g : 0, occ || undefined).map((/** @type {any} */ r) => r.id);
    for (const el of items) el.hidden = !hits.includes(el.dataset.epRoom);
    for (const id of [...hits].reverse()) { const el = items.find((x) => x.dataset.epRoom === id); if (el) list.prepend(el); }
    found.textContent = hits.length
      ? `${hits.length} ${hits.length === 1 ? "room" : "rooms"}${g > 1 ? ` near ${g} guests` : ""}.`
      : `Nothing near ${g} guests here yet. Tell us anyway: every room is made for its night.`;
  };
  form.addEventListener("input", draw);
  form.addEventListener("submit", (e) => e.preventDefault());
}
