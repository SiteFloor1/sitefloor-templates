// @ts-check
/**
 * Book a visit: works the next visit times out on the day (the page was built earlier), keeps the chosen time and the
 * child's age in the WhatsApp request.
 */
import { visitSlots, dateWords, timeWords, ymdIn } from "../../lib/nursery.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).nursery.visit;
  if (!cfg) throw new Error("visit data missing");
  const list = /** @type {HTMLElement} */ (root.querySelector("[data-nu-slots]"));
  const age = /** @type {HTMLSelectElement} */ (root.querySelector("[data-nu-visit-age]"));
  const send = /** @type {HTMLAnchorElement} */ (root.querySelector("[data-nu-visit-send]"));
  const slots = visitSlots(cfg.times, ymdIn(Date.now(), ctx.data.hours.timezone), 4, cfg.closed);
  let chosen = 0;
  const msg = () => {
    const s = slots[chosen];
    send.href = ctx.bookHref(s
      ? `${cfg.message} could we visit on ${dateWords(s.date, "long")} at ${timeWords(s.time)}? My child is ${age.value}.`
      : `${cfg.message} could we arrange a visit? My child is ${age.value}.`);
  };
  const draw = () => {
    list.replaceChildren(...slots.map((s, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "nu-slot"; b.setAttribute("aria-pressed", String(i === chosen));
      const d = Object.assign(document.createElement("span"), { className: "nu-slot-d", textContent: dateWords(s.date) });
      const t = Object.assign(document.createElement("span"), { className: "nu-slot-t", textContent: timeWords(s.time) + (s.note ? ` · ${s.note}` : "") });
      const p = Object.assign(document.createElement("span"), { className: "nu-slot-p", textContent: i === chosen ? "Chosen" : "Choose" });
      b.append(d, t, p);
      b.addEventListener("click", () => { chosen = i; draw(); msg(); });
      return b;
    }));
  };
  age.addEventListener("change", msg);
  draw(); msg();
}
