// @ts-check
/**
 * Show day by code: reads the school's sheet (or the demo's simulation) once, then answers each code typed with that
 * class's arrival, stage door, costume, hair and collection. Fails closed: an unreadable or old sheet says so and points
 * to the school, never showing times that may be wrong.
 */
import { showDayRow } from "../../lib/ballet.js";

/** @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx) => Promise<import("../../lib/ballet.js").ShowDayResult> }} ShowDayProvider */

const FIELDS = /** @type {const} */ ([["arrive", "Arrive"], ["door", "Stage door"], ["costume", "Costume"], ["hair", "Hair"], ["collect", "Collect"], ["notes", "Notes"]]);

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).showDay;
  /** @type {ShowDayProvider|null} */
  const provider = ctx.providers.balletShowDay;
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-sd-form]"));
  const out = root.querySelector("[data-sd-out]");
  const input = /** @type {HTMLInputElement|null} */ (root.querySelector("#sd-code"));
  if (!cfg || !provider || !form || !out || !input) throw new Error("show day markup, data or provider missing");
  const loading = provider.load(ctx).catch(() => /** @type {const} */ ({ ok: false }));
  /** @param {string} text */
  const say = (text) => {
    const p = Object.assign(document.createElement("p"), { textContent: text + " " });
    p.append(Object.assign(document.createElement("a"), { className: "rd-link", href: ctx.bookHref(`${cfg.message} could you send me our show-day details?`), textContent: "Ask the school", target: "_blank", rel: "noopener" }));
    out.replaceChildren(p);
  };
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!input.value.trim()) { input.focus(); return; }
    const result = await loading;
    if (!result.ok) { say("The show-day sheet can't be read just now, or hasn't been updated."); return; }
    const row = showDayRow(result, input.value);
    if (!row) { say(`No class has the code ${input.value.trim().toUpperCase()}.`); return; }
    const dl = document.createElement("dl");
    for (const [k, label] of FIELDS) {
      if (!row[k]) continue;
      const div = document.createElement("div");
      div.append(Object.assign(document.createElement("dt"), { textContent: label }), Object.assign(document.createElement("dd"), { textContent: row[k] }));
      dl.append(div);
    }
    const h = Object.assign(document.createElement("h2"), { textContent: row.class || row.code });
    const when = Object.assign(document.createElement("p"), { className: "rd-fine", textContent: `Updated ${new Date(result.updatedAt).toLocaleString("en-GB", { day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })}` });
    out.replaceChildren(h, dl, when);
  });
}
