// @ts-check
/** The trip builder: nights per region within the operator's range, a running total, one WhatsApp message. */
import { builderMessage } from "../../lib/tourism.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data).tourism;
  const regions = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-tb-region]")]);
  const month = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-tb-month]"));
  const who = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-tb-who]"));
  const total = root.querySelector("[data-tb-total]"), list = root.querySelector("[data-tb-list]");
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-tb-send]"));
  if (!regions.length || !month || !who || !total || !list || !send) throw new Error("trip builder markup missing");
  /** @type {Map<string, number>} */ const n = new Map();
  const draw = () => {
    /** @type {{ name: string, nights: number }[]} */ const picks = [];
    for (const r of regions) {
      const v = n.get(r.dataset.tbRegion ?? "") ?? 0;
      const out = r.querySelector("[data-tb-n]");
      if (out) out.textContent = String(v);
      r.classList.toggle("on", v > 0);
      /** @type {HTMLButtonElement} */ (r.querySelector("[data-tb-less]")).disabled = v === 0;
      /** @type {HTMLButtonElement} */ (r.querySelector("[data-tb-more]")).disabled = v >= Number(r.dataset.max);
      if (v) picks.push({ name: r.dataset.name ?? "", nights: v });
    }
    const sum = picks.reduce((t, p) => t + p.nights, 0);
    total.textContent = picks.length ? `${sum} nights in all` : "Add a region to start.";
    list.replaceChildren(...picks.map((p) => Object.assign(root.ownerDocument.createElement("li"), { textContent: `${p.name}, ${p.nights} ${p.nights === 1 ? "night" : "nights"}` })));
    send.setAttribute("aria-disabled", String(!picks.length));
    send.href = ctx.waHref(builderMessage(data.name, picks, month.value ? Number(month.value) : null, who.value));
  };
  root.addEventListener("click", (e) => {
    const b = /** @type {HTMLElement} */ (e.target).closest("button");
    const r = /** @type {HTMLElement|null} */ (b?.closest("[data-tb-region]") ?? null);
    if (!b || !r) return;
    const id = r.dataset.tbRegion ?? "", v = n.get(id) ?? 0, min = Number(r.dataset.min), max = Number(r.dataset.max);
    if (b.hasAttribute("data-tb-more")) n.set(id, v === 0 ? min : Math.min(max, v + 1));
    else if (b.hasAttribute("data-tb-less")) n.set(id, v <= min ? 0 : v - 1);
    draw();
  });
  send.addEventListener("click", (e) => { if (send.getAttribute("aria-disabled") === "true") e.preventDefault(); });
  month.addEventListener("change", draw);
  who.addEventListener("change", draw);
  draw();
}
