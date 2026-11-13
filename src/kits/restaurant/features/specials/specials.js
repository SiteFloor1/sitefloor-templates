// @ts-check
/**
 * Today's specials: asks the provider (the restaurant's sheet, or a simulation on demos), lists today's
 * specials and sold-out dishes, and shares the result as "tonight" for the menu and the live board. A café's
 * bakes ([data-bake] anywhere on the page: this slip, the Counter look's hero, the glass case) get their state
 * (data-state: fresh, baked, out) and tag from the same sheet; with no answer from the sheet they say nothing.
 */
import { ago } from "../../lib/tonight.js";
import { counterNow, bakeTag } from "../../lib/counter.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  /** @type {import("./sheet-provider.js").TonightProvider|null} */
  const provider = ctx.providers.tonight;
  const list = root.querySelector("[data-sp-list]"), off = /** @type {HTMLElement|null} */ (root.querySelector("[data-sp-off]"));
  const out = /** @type {HTMLElement|null} */ (root.querySelector("[data-sp-out]")), upd = root.querySelector("[data-sp-upd]"), date = root.querySelector("[data-sp-date]");
  if (!provider || !list || !off || !out || !upd || !date) throw new Error("specials markup or provider missing");
  const names = new Map([...document.querySelectorAll("[data-dish]")].map((el) => [/** @type {HTMLElement} */ (el).dataset.dish ?? "", /** @type {HTMLElement} */ (el).dataset.name ?? ""]));
  const counter = /** @type {any} */ (ctx.data).counter;
  const bakesOn = (/** @type {import("../../lib/tonight.js").Tonight} */ r) => {
    if (!counter) return;
    const now = counterNow(counter.bakes, r, Date.now(), counter.freshForMinutes);
    for (const b of now) {
      for (const el of document.querySelectorAll(`[data-bake="${b.id}"]`)) {
        const e = /** @type {HTMLElement} */ (el);
        if (b.state && b.state !== "unknown") e.dataset.state = b.state; else delete e.dataset.state;
        for (const t of e.querySelectorAll("[data-bake-tag]")) t.textContent = bakeTag(b, ctx.data.hours.timezone);
      }
    }
  };
  const fail = () => { list.replaceChildren(); off.hidden = false; out.hidden = true; upd.textContent = ""; };
  const load = () => provider.load(ctx).then((r) => {
    bakesOn(r); // the bakes first, so anything watching "tonight" sees their state
    ctx.share("tonight", r);
    date.textContent = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: ctx.data.hours.timezone });
    if (!r.ok) { fail(); return; }
    list.replaceChildren(...r.specials.map((s) => {
      const li = document.createElement("li");
      const row = document.createElement("div"); row.className = "rs-row";
      const n = document.createElement("span"); n.className = "rs-name"; n.textContent = s.name;
      const dots = document.createElement("span"); dots.className = "rs-dots"; dots.setAttribute("aria-hidden", "true");
      row.append(n);
      if (s.price !== null) { const p = document.createElement("span"); p.className = "rs-price"; p.textContent = `£${Number.isInteger(s.price) ? s.price : s.price.toFixed(2)}`; row.append(dots, p); }
      li.append(row);
      if (s.note) { const note = document.createElement("p"); note.className = "rs-desc"; note.textContent = s.note; li.append(note); }
      return li;
    }));
    off.hidden = r.specials.length > 0;
    if (!r.specials.length) off.textContent = counter ? "No specials today. Everything on the counter and the menu is on unless it says sold out." : "No specials on the board today. Everything on the menu is on.";
    const gone = r.soldOut.map((id) => names.get(id) || [...names.values()].find((n) => n.toLowerCase() === id) || id);
    out.hidden = !gone.length;
    out.textContent = gone.length ? `Sold out today: ${gone.join(", ")}` : "";
    upd.textContent = r.updatedAt ? `Board updated ${ago(Date.now() - r.updatedAt)}` : "";
  }, () => { bakesOn({ ok: false }); fail(); });
  load();
  ctx.everyMinute(() => { if (!document.hidden) load(); });
}
