/** Gift takeovers: the one covering today (shop time) is on, with its order-by countdown; the others are off. */
import { activeTakeover, takeoverPhase, takeoverLine } from "../../lib/takeover.js";
import { readData } from "../dom.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = readData(root);
  const tz = ctx.data.hours.timezone;
  const els = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-to]")]);
  const paint = () => {
    const on = activeTakeover(cfg.items, ctx.now().date);
    els.forEach((el, i) => {
      const t = cfg.items[i];
      const s = takeoverPhase(t, tz, Date.now());
      el.classList.toggle("is-on", i === on && s.phase !== "over");
      const when = el.querySelector("[data-to-when]");
      const line = takeoverLine({ orderBy: t.orderBy, collectBy: cfg.collect ? t.collectBy : undefined }, s, cfg.area);
      if (when && i === on && line) when.textContent = line;
    });
  };
  paint();
  ctx.everyMinute(paint);
}
