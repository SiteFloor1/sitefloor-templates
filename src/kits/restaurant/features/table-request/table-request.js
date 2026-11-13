// @ts-check
/**
 * Book a table: builds the WhatsApp request from the form. Days come from the sittings (and skip days the
 * restaurant is closed); times run every 15 minutes up to 30 minutes before last orders. The Table shares
 * the group ("group"), The Room or the seat finder the chosen seat ("seat"), and the brunch builder
 * its plates ("brunch"). A look may make [data-tr-times] a <select> (one line, like a concierge card) instead of chips.
 */
import { tableRequestText, slotTimes } from "../../lib/request.js";
import { addDays, rangesFor, toMinutes, formatTime12, DAY_KEYS } from "../../../../core/lib/hours.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).tableRequest;
  /** @type {import("../../lib/sittings.js").Sitting[]} */
  // Only the sittings that take bookings (tableRequest.sittings, e.g. a café's weekend brunch); all by default.
  const sittings = (/** @type {any} */ (ctx.data).sittings ?? []).filter((/** @type {any} */ s) => !cfg?.sittings || cfg.sittings.includes(s.id));
  const guests = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-tr-guests]"));
  const day = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-tr-day]"));
  const times = root.querySelector("[data-tr-times]"), notes = /** @type {HTMLTextAreaElement|null} */ (root.querySelector("[data-tr-notes]"));
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-tr-send]"));
  const seatLine = /** @type {HTMLElement|null} */ (root.querySelector("[data-tr-seat]")), groupLine = /** @type {HTMLElement|null} */ (root.querySelector("[data-tr-group]"));
  const brunchLine = /** @type {HTMLElement|null} */ (root.querySelector("[data-tr-brunch]"));
  if (!cfg || !guests || !day || !times || !notes || !send || !seatLine || !groupLine) throw new Error("table request markup missing");
  /** @type {{ label: string }|null} */ let seat = null;
  /** @type {{ count: number, summary: string }|null} */ let group = null;
  /** @type {{ plates: number, summary: string, line: string }|null} */ let brunch = null;

  const now = ctx.now();
  const dayLabel = (/** @type {string} */ d, /** @type {number} */ i) => (i === 0 ? "Today" : i === 1 ? "Tomorrow" : new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }));
  for (let i = 0; i <= (cfg.daysAhead ?? 30); i++) {
    const d = addDays(now.date, i);
    const wd = DAY_KEYS[new Date(`${d}T12:00:00Z`).getUTCDay()];
    if (!sittings.some((s) => s.days.includes(wd)) || !rangesFor(ctx.data.hours, d).ranges.length) continue;
    const o = document.createElement("option");
    o.value = d; o.textContent = dayLabel(d, i);
    day.append(o);
  }

  const isSelect = times instanceof HTMLSelectElement;
  const chosen = () => (isSelect ? /** @type {HTMLSelectElement} */ (times).value : /** @type {HTMLInputElement|null} */ (times.querySelector("input:checked"))?.value);
  const buildSelect = (/** @type {import("../../lib/sittings.js").Sitting[]} */ list, /** @type {number} */ earliest) => {
    const sel = /** @type {HTMLSelectElement} */ (times), prev = sel.value;
    sel.replaceChildren(...list.flatMap((s) => slotTimes(s).filter((t) => toMinutes(t) >= earliest).map((t) => Object.assign(document.createElement("option"), { value: t, textContent: formatTime12(toMinutes(t)) }))));
    if (!sel.options.length) sel.append(Object.assign(document.createElement("option"), { value: "", textContent: "no time left today" }));
    if ([...sel.options].some((o) => o.value === prev)) sel.value = prev;
  };

  const buildTimes = () => {
    const d = day.value;
    const wd = DAY_KEYS[new Date(`${d}T12:00:00Z`).getUTCDay()];
    const earliest = d === ctx.now().date ? ctx.now().minutes + 30 : 0;
    if (isSelect) { buildSelect(sittings.filter((s) => s.days.includes(wd)), earliest); return; }
    const prev = /** @type {HTMLInputElement|null} */ (times.querySelector("input:checked"))?.value;
    times.replaceChildren(...sittings.filter((s) => s.days.includes(wd)).flatMap((s) => {
      const slots = slotTimes(s).filter((t) => toMinutes(t) >= earliest);
      if (!slots.length) return [];
      const group = document.createElement("div"); group.className = "tr-sit";
      const h = document.createElement("p"); h.className = "tr-sit-h"; h.textContent = s.name;
      const chips = document.createElement("div"); chips.className = "rs-chips";
      chips.append(...slots.map((t) => {
        const l = document.createElement("label"); l.className = "rs-chip";
        const inp = document.createElement("input"); inp.type = "radio"; inp.name = "time"; inp.value = t;
        l.append(inp, formatTime12(toMinutes(t)));
        return l;
      }));
      group.append(h, chips);
      return [group];
    }));
    const keep = /** @type {HTMLInputElement|null} */ (times.querySelector(`input[value="${prev}"]`)) ?? /** @type {HTMLInputElement|null} */ (times.querySelector("input"));
    if (keep) keep.checked = true;
    if (!times.children.length) { const p = document.createElement("p"); p.className = "rs-small"; p.textContent = "No more tables to ask for today. Try another day."; times.append(p); }
  };

  const update = () => {
    const t = chosen();
    const d = day.selectedOptions[0];
    send.href = ctx.waHref(tableRequestText({
      opening: cfg.message,
      guests: Number(guests.value),
      day: d ? (d.textContent === "Today" || d.textContent === "Tomorrow" ? d.textContent : new Date(`${d.value}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })) : "",
      time: t ? formatTime12(toMinutes(t)) : "any time",
      seat: seat?.label,
      group: group?.summary,
      preorder: brunch?.summary,
      notes: notes.value.trim(),
    }));
    seatLine.hidden = !seat;
    seatLine.textContent = seat ? `Where: ${seat.label}. A preference; we'll do our best.` : "";
    groupLine.hidden = !group;
    groupLine.textContent = group ? `Your group: ${group.summary}` : "";
    if (brunchLine) { brunchLine.hidden = !brunch; brunchLine.textContent = brunch ? `Pre-ordered: ${brunch.line}` : ""; }
  };

  day.addEventListener("change", () => { buildTimes(); update(); });
  root.addEventListener("change", update);
  notes.addEventListener("input", update);
  buildTimes();
  update();

  ctx.watch("seat", (/** @type {{ label: string }|null} */ s) => { seat = s; update(); });
  ctx.watch("brunch", (/** @type {{ plates: number, summary: string, line: string }|null} */ b) => { brunch = b && b.plates ? b : null; update(); });
  ctx.watch("group", (/** @type {{ count: number, summary: string }|null} */ g) => {
    group = g && g.count ? g : null;
    if (group) guests.value = String(Math.min(group.count, guests.options.length));
    update();
  });
}
