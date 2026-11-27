// @ts-check
/** The tour: works out each stop's state for the visitor's day, and shows the chosen stop's place, dates and what to do next. */
import { resolveStops, tourOrder, stopState, stateWords, longDate, stopIcs, slug, runLine } from "../../lib/popup.js";
import { download } from "../popup-run/popup-run.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data);
  const now = ctx.now();
  const stops = tourOrder(resolveStops(data.popup, now.date), now.date);
  const list = root.querySelector("[data-tour-list]"), detail = root.querySelector("[data-tour-detail]");
  const tpl = /** @type {HTMLTemplateElement|null} */ (root.querySelector("[data-tour-actions]"));
  if (!list || !detail || !tpl) throw new Error("tour markup missing");
  const pick = (/** @type {string} */ id) => {
    const s = stops.find((x) => x.id === id);
    if (!s) return;
    const st = stopState(s, now.date);
    list.querySelectorAll("[data-tour]").forEach((b) => b.setAttribute("aria-pressed", String(/** @type {HTMLElement} */ (b).dataset.tour === id)));
    root.querySelectorAll("[data-pin]").forEach((p) => p.classList.toggle("is-chosen", /** @type {SVGElement} */ (p).dataset.pin === id));
    const when = st.kind === "on" ? runLine(data.hours, s, ctx.now()) : st.kind === "soon" ? `${longDate(s.start)} to ${longDate(s.end)}` : `${longDate(s.start)} to ${longDate(s.end)}, now ended`;
    const p = Object.assign(document.createElement("p"), { textContent: `${s.place}, ${s.area}. ${when}.` });
    const acts = Object.assign(document.createElement("p"), { className: "ptr-acts" });
    const want = st.kind === "on" ? ["book", "ics"] : st.kind === "soon" ? ["wait", "ics"] : ["past"];
    for (const k of want) {
      const el = /** @type {HTMLElement|null} */ (tpl.content.querySelector(`[data-act="${k}"]`)?.cloneNode(true) ?? null);
      if (!el) continue;
      if (k === "ics") el.addEventListener("click", () => download(`${slug(data.name)}-${s.id}.ics`, stopIcs(s, data.name, Date.now())));
      acts.append(el);
    }
    detail.replaceChildren(p, acts);
  };
  // The order for the visitor's day: on now, then the openings, then the ended ones.
  for (const s of stops) { const li = list.querySelector(`[data-tour="${s.id}"]`)?.closest("li"); if (li) list.append(li); }
  for (const b of list.querySelectorAll("[data-tour]")) {
    const s = stops.find((x) => x.id === /** @type {HTMLElement} */ (b).dataset.tour);
    if (!s) continue;
    const st = stopState(s, now.date);
    b.className = `ptr-t is-${st.kind}`;
    const t = b.querySelector("[data-tour-state]");
    if (t) t.textContent = stateWords(st, s);
    b.addEventListener("click", () => pick(s.id));
  }
  for (const p of root.querySelectorAll("[data-pin]")) {
    const s = stops.find((x) => x.id === /** @type {SVGElement} */ (p).dataset.pin);
    if (s) p.setAttribute("class", `ptr-pin is-${stopState(s, now.date).kind}`);
  }
  if (stops[0]) pick(stops[0].id);
}
