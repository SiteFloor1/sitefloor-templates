// @ts-check
/**
 * Free bays, live (PARK-1). Loads the client's sheet (a simulation on the demo), redraws the free bays and says when
 * the list was updated, and shares the free bays as "garage-free" so the picker, the plan, the hall from above and
 * the night route all use the same list. If the sheet can't be read or is stale, nothing changes on the page except
 * one honest line: the bays as last published, on the day the site was built.
 */
import { withFree, allBays, updatedWords, metres, pounds } from "../../lib/garage.js";

/** @typedef {{ intervalMs: number, load: (ctx: any) => Promise<{ ok: true, free: number[], updatedAt: number } | { ok: false }> }} BaysProvider */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const d = /** @type {any} */ (ctx.data);
  const provider = /** @type {BaysProvider|undefined} */ (ctx.providers.liveBays);
  if (!provider || !d.hall || !d.liveBays) return;
  const line = root.querySelector("[data-bays-updated]"), body = root.querySelector("[data-free-rows]");
  let shown = "";
  const draw = (/** @type {number[]} */ free, /** @type {string} */ words) => {
    const hall = withFree(d.hall, free), bays = allBays(hall).filter((b) => b.free);
    if (body) body.replaceChildren(...bays.map((b) => {
      const tr = document.createElement("tr"), th = document.createElement("th");
      th.scope = "row"; th.textContent = String(b.n); tr.append(th);
      for (const t of [`${metres(b.width)} × ${metres(hall.bayDepth)}`, b.charger ? `${b.charger} kW` : "—", b.price ? pounds(b.price) : "Ask"]) {
        const td = document.createElement("td"); td.textContent = t; tr.append(td);
      }
      return tr;
    }));
    document.querySelectorAll("[data-free-count]").forEach((el) => { el.textContent = bays.length ? `${bays.length} ${bays.length === 1 ? "bay" : "bays"} free` : "Waiting list"; });
    if (line) line.textContent = words;
  };
  const load = async () => {
    /** @type {Awaited<ReturnType<BaysProvider["load"]>>} */
    const r = await provider.load(ctx).catch(() => ({ ok: /** @type {const} */ (false) }));
    if (r.ok) {
      const key = r.free.join(",");
      draw(r.free, updatedWords(r.updatedAt, Date.now(), d.hours.timezone));
      if (key !== shown) { shown = key; ctx.share("garage-free", r.free); }
    } else if (line) line.textContent = `As listed on ${d.liveBays.listedOn}. Ask us to confirm before you come.`;
  };
  load();
  setInterval(load, provider.intervalMs);
}
