// @ts-check
/** Travel by postcode district, from the artist's own free area and fees; anywhere else asks. */
import { travelFor, travelText, pounds } from "../../lib/bridalbeauty.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).travel;
  const pc = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-tv-pc]")), out = /** @type {HTMLElement|null} */ (root.querySelector("[data-tv-out]"));
  const ask = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-tv-ask]")), form = root.querySelector("[data-tv-form]");
  if (!cfg || !pc || !out || !ask || !form) throw new Error("travel markup or data missing");
  const first = out.textContent ?? "";
  const paint = () => {
    const v = pc.value.trim();
    const t = travelFor(v, cfg);
    out.dataset.state = v ? t.state : "idle";
    out.textContent = !v ? first
      : t.state === "bad" ? "That doesn't look like a UK postcode."
      : t.state === "free" ? `${t.district}: no travel fee.`
      : t.state === "fee" ? `${t.district}: travel is ${pounds(t.fee)} for the morning.`
      : `${t.district} is further than I usually go. Ask, and I'll quote.`;
    const text = travelText(cfg.message, t.district);
    ask.href = ctx.bookHref(text);
    if (ask.dataset.waText !== undefined) ask.dataset.waText = text;
  };
  pc.addEventListener("input", paint);
  form.addEventListener("submit", (e) => { e.preventDefault(); paint(); });
}
