// @ts-check
/**
 * Chairs free today: up to three of today's free slots from the salon's sheet (or the demo's simulation), soonest
 * first. Fails closed: when the provider has nothing usable, the box says to ask instead. Re-checked every five minutes,
 * so a slot that has started drops off.
 */
import { money, bookText } from "../../lib/hair.js";

/** @typedef {{ service: string, time: string, stylist: string }} Slot */
/** @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx) => Promise<{ ok: true, slots: Slot[] } | { ok: false }> }} ChairsProvider */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), cfg = data.chairs;
  const provider = /** @type {ChairsProvider|undefined} */ (ctx.providers.chairs);
  const list = root.querySelector("[data-ch-list]"), none = /** @type {HTMLElement|null} */ (root.querySelector("[data-ch-none]"));
  if (!cfg || !list || !none) throw new Error("chairs-today markup missing");
  const who = Object.fromEntries([.../** @type {NodeListOf<HTMLElement>} */ (root.querySelectorAll("[data-ch-who]"))].map((el) => [el.dataset.chWho ?? "", el.dataset.name ?? ""]));
  const levelOf = Object.fromEntries(data.stylists.items.map((/** @type {any} */ s) => [s.id, s.level]));
  // on the photograph (the band at the hero's foot) the short line, so it stays whole on the narrowest phones
  const nothing = root.classList.contains("hr-ch-hero") ? "Nothing free right now." : "Nothing free on the sheet right now. Ask us on WhatsApp; something may open up.";
  const show = async () => {
    let r = /** @type {{ ok: true, slots: Slot[] } | { ok: false }} */ ({ ok: false });
    if (provider) { try { r = await provider.load(ctx); } catch { r = { ok: false }; } }
    const slots = r.ok ? r.slots.slice(0, 3) : [];
    list.replaceChildren(...slots.map((s) => {
      const sv = cfg.services.find((/** @type {any} */ x) => x.id === s.service), name = who[s.stylist] ?? "";
      const from = sv?.from?.[levelOf[s.stylist]];
      const li = document.createElement("li"), t = document.createElement("span"), what = document.createElement("span"), a = document.createElement("a");
      t.className = "hr-ch-t"; t.textContent = s.time;
      what.className = "hr-ch-w"; what.textContent = `${sv?.name ?? s.service} with ${name}${from ? ` · from ${money(from)}` : ""}`;
      a.className = "hr-go"; a.target = "_blank"; a.rel = "noopener"; a.textContent = `Ask for ${s.time}`;
      a.href = ctx.bookHref(bookText(cfg.message, { extra: [`I'd like the ${s.time} ${(sv?.name ?? "").toLowerCase()} with ${name} today, if it's still free.`] }));
      li.append(t, what, a);
      return li;
    }));
    none.hidden = slots.length > 0;
    if (!slots.length && none.firstChild) none.firstChild.textContent = `${nothing} `;
  };
  show();
  ctx.everyMinute(() => { if (new Date().getMinutes() % 5 === 0) show(); });
}
