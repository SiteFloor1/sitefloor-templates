// @ts-check
/** The length guide: her measurement and shoes give the shop's length (lib/modest.js) and the pieces that come in it. */
import { hemAnswer, pounds } from "../../lib/modest.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const L = /** @type {any} */ (ctx.data).lengths;
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-len-form]"));
  const out = root.querySelector("[data-len-out]"), list = root.querySelector("[data-len-pieces]");
  if (!L || !form || !out || !list) return;
  const draw = () => {
    const fd = new FormData(form);
    const sf = Number(fd.get("sf"));
    if (!Number.isFinite(sf) || sf < 40 || sf > 72) { out.textContent = "Measure shoulder to floor in inches, between 40 and 72."; list.replaceChildren(); return; }
    const a = hemAnswer({ lengths: L.lengths, clear: L.clear }, Math.round(sf * 2) / 2, L.shoes[Number(fd.get("shoe"))] ?? L.shoes[0]);
    out.replaceChildren();
    if (a.length === null) { out.textContent = a.words; list.replaceChildren(); return; }
    const b = Object.assign(document.createElement("b"), { textContent: String(a.length) });
    out.append("Wear the ", b, a.words.slice(`Wear the ${a.length}`.length));
    list.replaceChildren(...L.pieces.filter((/** @type {any} */ p) => p.lengths.includes(a.length)).map((/** @type {any} */ p) => {
      const li = document.createElement("li");
      li.append(Object.assign(document.createElement("span"), { textContent: `${p.name} in the ${a.length}` }), Object.assign(document.createElement("span"), { textContent: pounds(p.price) }));
      return li;
    }));
    for (const tr of root.querySelectorAll("tr[data-length]")) tr.classList.toggle("is-lit", Number(/** @type {HTMLElement} */ (tr).dataset.length) === a.length);
  };
  form.addEventListener("input", draw);
  form.addEventListener("submit", (e) => e.preventDefault());
  draw();
}
