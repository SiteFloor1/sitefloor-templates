// @ts-check
/** Private fitting request: the next fortnight's open days, time of day, guests, the tray; sent on WhatsApp. */
import { fittingText } from "../../lib/fit.js";
import { readData, must } from "../dom.js";
import { rangesFor, addDays } from "../../../../core/lib/hours.js";
import { ukDate } from "../../../../core/lib/diary.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = readData(root);
  const kind = /** @type {HTMLSelectElement} */ (must(root, "[data-fit-kind]"));
  const day = /** @type {HTMLSelectElement} */ (must(root, "[data-fit-day]"));
  const time = /** @type {HTMLSelectElement} */ (must(root, "[data-fit-time]"));
  const guests = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-fit-guests]"));
  const name = /** @type {HTMLInputElement} */ (must(root, "[data-fit-name]"));
  const send = /** @type {HTMLAnchorElement} */ (must(root, "[data-fit-send]"));
  const trayBox = /** @type {HTMLElement} */ (must(root, "[data-fit-tray]"));
  const trayList = must(root, "[data-fit-tray-list]");
  /** @type {string[]} */ let tray = [];

  // The next 14 days the shop is open (from tomorrow), named in UK order.
  const today = ctx.now().date;
  for (let i = 1; i <= 14; i++) {
    const d = addDays(today, i);
    if (rangesFor(ctx.data.hours, d).ranges.length) day.add(new Option(ukDate(d).replace(/ \d{4}$/, ""), ukDate(d).replace(/ \d{4}$/, "")));
  }
  const update = () => {
    send.href = ctx.waHref(fittingText({ business: ctx.data.name, kind: kind.value, day: day.value, time: time.value, guests: Number(guests?.value ?? 0), name: name.value, tray, video: Boolean(cfg.video) }));
  };
  ctx.watch("tray", (/** @type {string[]} */ names) => {
    tray = names;
    trayList.replaceChildren(...names.map((n) => Object.assign(document.createElement("li"), { textContent: n })));
    trayBox.hidden = !names.length;
    update();
  });
  root.addEventListener("input", update);
  root.addEventListener("change", update);
  update();
}
