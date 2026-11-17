// @ts-check
/**
 * Where to find us this week: reads the stall's stops once (its sheet, or the demo's simulation), lays out the next
 * week from today, marks "Here now" and cancelled stops, and shares the chosen stop with the hero's countdown. An old
 * or unreadable sheet keeps the usual week, says so, and points to Instagram.
 */
import { upcoming, weekFromPattern, shortDay, longDay, dayWord, mapsHref, stopIcs, slug } from "../../lib/stalls.js";

/** @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx) => Promise<import("../../lib/stalls.js").StopsResult> }} StopsProvider */

/** @param {any} cfg @param {string} id */
export const placeOf = (cfg, id) => cfg.places.find((/** @type {any} */ p) => p.id === id) ?? { name: id, postcode: "" };

/**
 * A calendar link made on the click (a blob, so nothing is stored and no data: URL is needed).
 * @param {HTMLAnchorElement} a @param {any} s @param {any} place @param {string} business
 */
export function calendarLink(a, s, place, business) {
  a.download = `${slug(business)}-${s.date}.ics`;
  a.href = "#";
  a.onclick = (e) => {
    e.preventDefault();
    const url = URL.createObjectURL(new Blob([stopIcs(s, place, business, Date.now())], { type: "text/calendar" }));
    const tmp = Object.assign(document.createElement("a"), { href: url, download: a.download });
    document.body.append(tmp); tmp.click(); tmp.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
}

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).stops;
  /** @type {StopsProvider|null} */ const provider = ctx.providers.stalls;
  const list = root.querySelector("[data-where-list]"), state = root.querySelector("[data-where-state]");
  const detail = root.querySelector("[data-where-detail]"), fallback = root.querySelector("[data-where-fallback]");
  if (!cfg || !provider || !list || !state || !fallback) throw new Error("where-to-find-us markup or provider missing");
  const full = /** @type {HTMLElement} */ (root).dataset.whereMode === "full";
  const name = /** @type {any} */ (ctx.data).name;
  /** @type {any[]} */ let stops = [];
  let chosen = 0;

  const paintDetail = () => {
    if (!detail) return;
    const s = stops[chosen];
    if (!s) { detail.replaceChildren(); return; }
    const p = placeOf(cfg, s.place);
    const when = s.cancelled ? "Cancelled" : s.live ? `Here now, until ${s.close}` : `${dayWord(s.date, ctx.now().date)}, ${s.open} till ${s.close}`;
    const head = Object.assign(document.createElement("p"), { className: "st-wd-h" });
    head.append(Object.assign(document.createElement("b"), { textContent: `${p.name}${p.market ? `, ${p.market}` : ""}` }), document.createElement("br"), `${when}${s.note ? `. ${s.note}` : ""}`);
    const acts = Object.assign(document.createElement("p"), { className: "st-wd-acts" });
    const dir = Object.assign(document.createElement("a"), { href: mapsHref(p), textContent: "Directions", target: "_blank", rel: "noopener" });
    acts.append(dir);
    if (!s.cancelled) { const cal = Object.assign(document.createElement("a"), { textContent: "Add to calendar" }); calendarLink(cal, s, p, name); acts.append(cal); }
    detail.replaceChildren(head, acts);
  };
  const pick = (/** @type {number} */ i) => {
    chosen = i;
    list.querySelectorAll("[data-where-pick]").forEach((b, j) => b.setAttribute("aria-pressed", String(i === j)));
    paintDetail();
    ctx.share("stallsChosen", stops[i] ?? null);
  };
  const paint = (/** @type {boolean} */ fresh) => {
    const items = stops.map((s, i) => {
      const p = placeOf(cfg, s.place);
      const li = Object.assign(document.createElement("li"), { className: `st-stop${s.cancelled ? " off" : ""}${s.live ? " live" : ""}` });
      const b = Object.assign(document.createElement("button"), { type: "button", className: "st-ticket" });
      b.dataset.wherePick = String(i);
      b.setAttribute("aria-pressed", String(i === chosen));
      b.append(Object.assign(document.createElement("b"), { textContent: `${shortDay(s.date)} · ${p.name}` }), Object.assign(document.createElement("span"), { textContent: s.cancelled ? "Cancelled" : `${s.open}–${s.close}` }));
      if (s.live) b.append(Object.assign(document.createElement("i"), { textContent: "Here now" }));
      b.addEventListener("click", () => pick(i));
      li.append(b);
      if (full) {
        const more = Object.assign(document.createElement("div"), { className: "st-stop-more" });
        more.append(Object.assign(document.createElement("p"), { textContent: `${longDay(s.date)}${p.market ? `, ${p.market}` : ""}, ${p.postcode}${s.note ? `. ${s.note}` : ""}` }), Object.assign(document.createElement("a"), { href: mapsHref(p), textContent: "Directions", target: "_blank", rel: "noopener" }));
        li.append(more);
      }
      return li;
    });
    list.replaceChildren(...items);
    /** @type {HTMLElement} */ (fallback).hidden = fresh;
    state.textContent = fresh ? (stops.some((s) => s.live) ? "Trading now." : "This week, from our own sheet.") : "Usually, week by week. This week's stops aren't up yet.";
    /** @type {HTMLElement} */ (state).dataset.state = fresh ? "fresh" : "usual";
    pick(Math.min(chosen, Math.max(0, stops.length - 1)));
  };
  list.querySelectorAll("[data-where-pick]").forEach((b, i) => b.addEventListener("click", () => pick(i)));
  provider.load(ctx).then((r) => {
    const now = ctx.now();
    if (r.ok) { stops = upcoming(r.stops, now, full ? 10 : 6); paint(true); }
    else { stops = upcoming(weekFromPattern(cfg.pattern, now.date), now, full ? 10 : 6); paint(false); }
    ctx.share("stalls", { ok: r.ok, stops });
  }, () => {
    const now = ctx.now();
    stops = upcoming(weekFromPattern(cfg.pattern, now.date), now, full ? 10 : 6);
    paint(false);
    ctx.share("stalls", { ok: false, stops });
  });
}
