// @ts-check
/** The drop: a countdown to the shop's own time, then the shop link while it's live, then "ended". */
import { dropState, dropInstant } from "../../lib/drop.js";
import { readData, must } from "../dom.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = readData(root);
  const tz = ctx.data.hours.timezone;
  const clock = /** @type {HTMLElement} */ (must(root, "[data-drop-clock]"));
  const when = must(root, "[data-drop-when]");
  const wait = /** @type {HTMLElement} */ (must(root, "[data-drop-wait]"));
  const shop = /** @type {HTMLElement|null} */ (root.querySelector("[data-drop-shop]"));
  const over = /** @type {HTMLElement} */ (must(root, "[data-drop-over]"));
  const at = new Date(dropInstant(cfg.at, tz));
  when.textContent = at.toLocaleString("en-GB", { timeZone: tz, weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", hour12: true }).replace(" at ", ", ").replace(":00", "") + " (UK time)";
  const tick = () => {
    const s = dropState(cfg, tz, Date.now());
    clock.hidden = s.phase !== "before";
    for (const [k, v] of Object.entries(s.left)) { const el = clock.querySelector(`[data-u="${k}"]`); if (el) el.textContent = String(v).padStart(2, "0"); }
    wait.hidden = s.phase === "live" && shop !== null;
    if (shop) shop.hidden = s.phase !== "live";
    over.hidden = s.phase !== "after";
    if (s.phase === "live") when.textContent = "Live now";
  };
  tick();
  const timer = setInterval(() => { if (!document.hidden) tick(); }, 1000);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { clearInterval(timer); setInterval(tick, 60_000); }
}
