// @ts-check
/** Events: upcoming only, from the firm's sheet when it publishes from one, each with a reply link and a calendar file. */
import { eventIcs, replyHref, upcoming } from "../../lib/events.js";
import { ukDate } from "../../lib/insights.js";

/** @param {string} tag @param {string} [cls] @param {string} [text] */
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const listEl = /** @type {HTMLElement|null} */ (root.querySelector("[data-ev-list]"));
  const none = /** @type {HTMLElement|null} */ (root.querySelector("[data-ev-none]"));
  const off = /** @type {HTMLElement|null} */ (root.querySelector("[data-ins-off]"));
  if (!listEl || !none || !off) throw new Error("events markup missing");
  const data = /** @type {any} */ (ctx.data).events;
  const today = ctx.now().date;
  const reply = root.dataset.reply ?? "";

  /** @param {import("../../lib/events.js").WealthEvent} e */
  const item = (e) => {
    const li = el("li", "wm-ev-e"); li.id = e.id; li.dataset.date = e.date;
    const d = el("p", "wm-ev-d"); const t = /** @type {HTMLTimeElement} */ (el("time", "", ukDate(e.date))); t.dateTime = e.date;
    d.append(t, el("span", "", `${e.start} to ${e.end}`));
    const body = el("div"); body.append(el("p", "wm-ev-k", e.kind), el("h2", "", e.title), el("p", "", e.summary), el("p", "wm-ev-p", e.place), el("p", "wm-ev-by", `Approved by compliance on ${ukDate(e.approvedOn)}.`));
    const act = el("p", "wm-ev-act");
    const a = /** @type {HTMLAnchorElement} */ (el("a", "wm-go", "Reply to attend")); a.href = replyHref(e, reply);
    if (a.href.startsWith("https://")) { a.target = "_blank"; a.rel = "noopener"; }
    const cal = /** @type {HTMLAnchorElement} */ (el("a", "wm-go", "Add to calendar"));
    cal.href = URL.createObjectURL(new Blob([eventIcs({ event: e, firm: ctx.data.name, timeZone: ctx.data.hours.timezone, stamp: new Date() })], { type: "text/calendar" }));
    cal.download = `${e.id}.ics`;
    act.append(a, cal);
    li.append(d, body, act);
    return li;
  };
  /** @param {import("../../lib/events.js").WealthEvent[]} items */
  const draw = (items) => {
    const next = upcoming(items, today);
    listEl.replaceChildren(...next.map(item));
    none.hidden = next.length > 0;
  };

  const provider = ctx.providers.events;
  if (!provider) { draw(data.items); return; }
  provider.load(ctx).then((/** @type {any} */ r) => {
    if (r.ok) draw(r.items);
    else { draw(data.items); off.hidden = listEl.children.length > 0; }
  });
}
