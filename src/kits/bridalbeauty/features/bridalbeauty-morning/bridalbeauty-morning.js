// @ts-check
/**
 * The wedding morning, worked back from the ceremony: everyone's slot in the chair, the start, the dress and the door,
 * a second artist when one alone would start too early. Each slot goes into her calendar (local times, no zone); the
 * whole morning to her group through the phone's share sheet; and to the artist on WhatsApp to hold.
 */
import { PLANNING, morningFor, clockWords, minutesOf, numbered, groupText, morningText, calendar, icsStamp, pounds } from "../../lib/bridalbeauty.js";
import { dateField } from "../../partials/date-field.js";
import { shareButton } from "../../partials/share.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const d = /** @type {any} */ (ctx.data);
  const q = (/** @type {string} */ s) => /** @type {any} */ (root.querySelector(s));
  const cer = q("[data-mo-cer]"), svc = q("[data-mo-svc]"), rows = q("[data-mo-rows]"), start = q("[data-mo-start]"), note = q("[data-mo-note]");
  const ask = q("[data-mo-ask]"), group = q("[data-mo-group]"), ics = q("[data-mo-ics]");
  if (!d.morning || !d.packages || !cer || !svc || !rows || !start || !note || !ask || !group || !ics) throw new Error("morning markup or data missing");
  const state = { service: svc.value, ceremony: minutesOf(cer.value), counts: /** @type {Record<string, number>} */ ({ ...(d.party?.start ?? {}) }) };
  let wedding = "", url = "";
  const max = d.party?.max ?? 12;
  const paint = () => {
    const m = morningFor(d, state);
    const labels = numbered(m.plan.rows.map((r) => (r.bride ? "You" : r.label)));
    const list = m.plan.rows.map((r, i) => ({ ...r, label: labels[i] }));
    start.textContent = m.tooEarly ? PLANNING : clockWords(m.plan.start);
    start.classList.toggle("is-long", m.tooEarly);
    const lab = q("[data-mo-lab]");
    lab.hidden = m.tooEarly;
    rows.hidden = m.tooEarly;
    note.textContent = m.tooEarly ? `Not everyone can fit before ${clockWords(minutesOf(d.morning.second?.earliest ?? "05:00"))}. Send it to me: a later ceremony, or a team.` : [m.early ? `Before ${clockWords(minutesOf(d.morning.early.before))}, the early-start fee of ${pounds(d.morning.early.fee)} applies.` : "",
      m.artists > 1 ? `Two artists: one alone would start before ${clockWords(minutesOf(d.morning.second.earliest))}. A second artist is ${pounds(d.morning.second.fee)}.` : ""].filter(Boolean).join(" ");
    rows.replaceChildren(...list.map((r) => {
      const li = document.createElement("li");
      if (r.bride) li.className = "is-bride";
      li.append(Object.assign(document.createElement("span"), { textContent: clockWords(r.start) }), Object.assign(document.createElement("b"), { textContent: r.label }),
        Object.assign(document.createElement("small"), { textContent: m.artists > 1 ? (r.lane ? "Second chair" : "First chair") : `until ${clockWords(r.end)}` }));
      return li;
    }));
    q("[data-mo-dress]").textContent = clockWords(m.plan.dressAt);
    q("[data-mo-leave]").textContent = clockWords(m.plan.leave);
    q("[data-mo-cer-at]").textContent = clockWords(state.ceremony);
    for (const p of d.packages.party) { const o = root.querySelector(`[data-step="${p.id}"] [data-n]`); if (o) o.textContent = String(state.counts[p.id] ?? 0); }
    const text = morningText(d.morning.message, { wedding, ceremony: clockWords(state.ceremony), start: m.tooEarly ? "" : clockWords(m.plan.start), people: list.length, artists: m.artists });
    group.hidden = m.tooEarly;
    ask.href = ctx.bookHref(text);
    if (ask.dataset.waText !== undefined) ask.dataset.waText = text;
    group.dataset.shareText = (groupText(d.name, wedding, list, { dressAt: m.plan.dressAt, leave: m.plan.leave, ceremony: state.ceremony }));
    if (url) { URL.revokeObjectURL(url); url = ""; }
    if (wedding && wedding >= ctx.now().date && !m.tooEarly) {
      const file = calendar({ artist: d.name, place: "", stamp: icsStamp(new Date()), events: [
        ...list.map((r, i) => ({ id: `chair-${i}`, date: wedding, start: r.start, end: r.end, title: `${r.label}: hair and makeup with ${d.name}` })),
        { id: "ceremony", date: wedding, start: state.ceremony, end: state.ceremony + 60, title: "The ceremony" },
      ] });
      url = URL.createObjectURL(new Blob([file], { type: "text/calendar" }));
      ics.href = url; ics.hidden = false;
    } else ics.hidden = true;
  };
  cer.addEventListener("change", () => { state.ceremony = minutesOf(cer.value); ctx.share("ceremony", state.ceremony); paint(); });
  svc.addEventListener("change", () => { state.service = svc.value; ctx.share("service", svc.value); paint(); });
  root.addEventListener("click", (e) => {
    const btn = /** @type {HTMLElement} */ (e.target).closest("[data-step] button");
    if (!btn) return;
    const id = /** @type {HTMLElement} */ (btn.closest("[data-step]")).dataset.step ?? "";
    const next = (state.counts[id] ?? 0) + Number(/** @type {HTMLElement} */ (btn).dataset.d);
    const others = Object.entries(state.counts).reduce((s, [k, v]) => s + (k === id ? 0 : v), 0);
    if (next < 0 || next + others > max) return;
    state.counts[id] = next; ctx.share("party", { ...state.counts }); paint();
  });
  shareButton(/** @type {HTMLButtonElement} */ (group));
  dateField(root, ctx, "wedding", (ymd) => { wedding = ymd; paint(); });
}
