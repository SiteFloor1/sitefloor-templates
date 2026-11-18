// @ts-check
/**
 * Next free lessons (DRIVE-2). The provider reads the instructor's sheet (or the demo's simulation); the card shows
 * the next three, each asking for itself on WhatsApp. Fails closed: no times unless the sheet is fresh.
 * @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx) => Promise<import("../../lib/driving.js").Slots> }} SlotsProvider
 */
import { span } from "../../lib/driving.js";
import { openable } from "../../lib/cards.js";

const day = (/** @type {string} */ ymd) => new Date(`${ymd}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  openable(root);
  const cfg = /** @type {any} */ (ctx.data).driving.slots;
  const provider = /** @type {SlotsProvider|null} */ (ctx.providers.drivingSlots);
  const list = /** @type {HTMLElement} */ (root.querySelector("[data-ds-list]"));
  const upd = /** @type {HTMLElement} */ (root.querySelector("[data-ds-upd]"));
  const first = root.querySelector("[data-ds-first]");
  if (!list || !upd) throw new Error("slots markup missing");
  const load = async () => {
    const r = provider ? await provider.load(ctx).catch(() => ({ ok: /** @type {const} */ (false) })) : { ok: /** @type {const} */ (false) };
    if (!r.ok || !r.slots.length) {
      root.setAttribute("data-state", "closed");
      list.replaceChildren();
      upd.textContent = "";
      if (first) first.textContent = "Ask for times";
      ctx.share("nextSlot", null);
      return;
    }
    const top = r.slots.slice(0, 3);
    list.replaceChildren(...top.map((s) => {
      const li = document.createElement("li");
      const when = `${day(s.date)}, ${span(s.time, s.hours)}`;
      const a = document.createElement("a");
      a.href = ctx.bookHref(`${cfg.message} ${when} (${s.gearbox}).`);
      a.target = "_blank"; a.rel = "noopener"; a.textContent = "Ask for this";
      a.setAttribute("aria-label", `Ask for this: ${when}, ${s.gearbox}`);
      const t = document.createElement("span");
      t.innerHTML = `<b>${day(s.date)}</b><small>${span(s.time, s.hours)} · ${s.gearbox}</small>`;
      li.append(t, a);
      return li;
    }));
    const tz = ctx.data.hours.timezone, u = new Date(r.updatedAt);
    const wd = u.toLocaleDateString("en-GB", { timeZone: tz, weekday: "long" });
    const hm = u.toLocaleTimeString("en-GB", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true }).replace(" ", "").toLowerCase();
    upd.textContent = `Updated by the instructor ${wd} at ${hm}`;
    if (first) first.innerHTML = `<b>${day(top[0].date)}</b>, ${span(top[0].time, top[0].hours)}`;
    root.setAttribute("data-state", "ok");
    ctx.share("nextSlot", `${day(top[0].date)}, ${span(top[0].time, top[0].hours)}`);
  };
  load();
  ctx.everyMinute(() => { if (!document.hidden) load(); });
}
