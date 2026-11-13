// @ts-check
/** Protection planner: chosen panels light up on the photo; the cheapest mix of the studio's panels and packs is priced. */
import { planProtection, hoursText } from "../../lib/pricing.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const d = /** @type {any} */ (ctx.data);
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-pp-form]"));
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-pp-send]"));
  const pp = /** @type {HTMLElement|null} */ (root.querySelector("[data-pp]"));
  if (!form || !send || !pp || !d.protection || !d.jobs || !d.vehicles) throw new Error("protection planner markup or data missing");
  const $ = (/** @type {string} */ s) => /** @type {HTMLElement} */ (root.querySelector(s));
  const el = (/** @type {string} */ tag, /** @type {string} */ text = "") => Object.assign(document.createElement(tag), { textContent: text });
  const nameOf = (/** @type {string} */ id) => d.protection.panels.find((/** @type {any} */ p) => p.id === id)?.name ?? id;
  const boxes = () => /** @type {HTMLInputElement[]} */ ([...form.querySelectorAll("input[name=panel]")]);

  const paint = () => {
    const f = new FormData(form);
    const vehicle = d.vehicles.find((/** @type {any} */ v) => v.id === f.get("vehicle")) ?? d.vehicles[0];
    const chosen = f.getAll("panel").map(String);
    for (const path of root.querySelectorAll("[data-panel]")) path.classList.toggle("on", chosen.includes(/** @type {HTMLElement} */ (path).dataset.panel ?? ""));
    const plan = planProtection(chosen, d.protection, d.jobs, vehicle.id);
    $("[data-pp-lines]").replaceChildren(...plan.lines.map((l) => {
      const li = el("li");
      const name = el("span", l.name);
      if (l.covers.length > 1) name.append(el("small", l.covers.map(nameOf).join(", ")));
      li.append(name, el("b", `£${l.price.toLocaleString("en-GB")} · ${hoursText(l.hours)}`));
      return li;
    }));
    $("[data-pp-price]").textContent = `£${plan.price.toLocaleString("en-GB")}`;
    $("[data-pp-hours]").textContent = plan.hours ? `about ${hoursText(plan.hours)}` : "";
    $("[data-pp-save]").textContent = plan.separately > plan.price ? `Our pack price saves £${(plan.separately - plan.price).toLocaleString("en-GB")} on these panels one by one.` : "";
    send.href = ctx.waHref(chosen.length
      ? `Hi, I'd like PPF on my ${vehicle.name.toLowerCase()}: ${plan.lines.map((l) => l.name).join(", ")}. Website price £${plan.price}. When could you fit it?`
      : `Hi, can you help me choose PPF for my ${vehicle.name.toLowerCase()}?`);
  };

  root.addEventListener("click", (e) => {
    const t = /** @type {Element} */ (e.target);
    const shape = /** @type {HTMLElement|null} */ (t.closest("[data-panel]"));
    if (shape) {
      const box = boxes().find((b) => b.value === shape.dataset.panel);
      if (box) { box.checked = !box.checked; paint(); }
      return;
    }
    const pack = /** @type {HTMLElement|null} */ (t.closest("[data-pp-pack]"));
    if (pack) {
      const k = pack.dataset.ppPack === "clear" ? null : d.protection.packs[Number(pack.dataset.ppPack)];
      for (const b of boxes()) b.checked = Boolean(k?.panels.includes(b.value));
      paint();
      return;
    }
    const show = /** @type {HTMLElement|null} */ (t.closest("[data-pp-show]"));
    if (show) {
      pp.dataset.ppView = show.dataset.ppShow;
      for (const b of root.querySelectorAll("[data-pp-show]")) b.setAttribute("aria-pressed", String(b === show));
      for (const c of root.querySelectorAll("[data-pp-car]")) /** @type {HTMLElement} */ (c).hidden = /** @type {HTMLElement} */ (c).dataset.ppCar !== show.dataset.ppShow;
    }
  });
  form.addEventListener("input", paint);
  form.addEventListener("submit", (e) => e.preventDefault());
  paint();
}
