// @ts-check
/** The regulars' board: the sheet's board rows (shared as "tonight" by the specials script), newest first. */
import { ago } from "../../lib/tonight.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cards = root.querySelector("[data-rb-cards]"), off = /** @type {HTMLElement|null} */ (root.querySelector("[data-rb-off]"));
  if (!cards || !off) throw new Error("regulars' board markup missing");
  ctx.watch("tonight", (/** @type {import("../../lib/tonight.js").Tonight} */ r) => {
    const list = r.ok ? r.board.slice(0, 6) : [];
    cards.replaceChildren(...list.map((c) => {
      const li = document.createElement("li"); li.className = "rb-card";
      const k = document.createElement("p"); k.className = "rb-k"; k.textContent = c.label;
      const t = document.createElement("p"); t.className = "rb-t"; t.textContent = c.text;
      const s = document.createElement("p"); s.className = "rb-s";
      const days = Math.floor((Date.now() - c.at) / 86_400_000);
      s.textContent = days < 1 ? `Pinned ${ago(Date.now() - c.at)}` : `Pinned ${new Date(c.at).toLocaleDateString("en-GB", { weekday: "long", timeZone: ctx.data.hours.timezone })}`;
      li.append(k, t, s);
      return li;
    }));
    off.hidden = list.length > 0;
  });
}
