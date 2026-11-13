// @ts-check
/**
 * The appointment request: keeps the WhatsApp link's message in step with the form. Pieces come from the tray
 * (ctx "tray") and from any "See it in person" that points at this section.
 */
import { appointmentText } from "../../lib/messages.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-appt-form]"));
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-appt-send]"));
  const box = /** @type {HTMLElement|null} */ (root.querySelector("[data-appt-pieces]"));
  const list = root.querySelector("[data-appt-list]");
  if (!form || !send || !box || !list) throw new Error("appointment request markup missing");
  /** @type {{ id: string, name: string }[]} */ let tray = [];
  /** @type {{ id: string, name: string }|null} */ let picked = null;
  /** The day from the shared date picker, once it's one the house can be asked for. */
  let day = "", time = "";

  const val = (/** @type {string} */ sel) => /** @type {HTMLInputElement|null} */ (form.querySelector(sel))?.value.trim() ?? "";
  const update = () => {
    const pieces = [...tray];
    if (picked && !pieces.some((p) => p.id === picked?.id)) pieces.push(picked);
    box.hidden = !pieces.length;
    list.replaceChildren(...pieces.map((p) => { const li = document.createElement("li"); li.textContent = p.name; return li; }));
    const text = appointmentText({
      house: ctx.data.name,
      reason: val('input[name="appt-for"]:checked'),
      when: val('input[name="appt-when"]:checked'),
      day, time,
      pieces: pieces.map((p) => p.name),
      name: val("[data-appt-name]"),
      note: val("[data-appt-note]"),
    });
    send.href = ctx.waHref(text);
    send.dataset.waText = text;
  };
  root.addEventListener("dr-change", (e) => {
    const r = /** @type {CustomEvent} */ (e).detail;
    day = r?.ok ? r.selection?.from ?? "" : "";
    time = r?.ok ? r.selection?.fromTime ?? "" : "";
    update();
  });
  form.addEventListener("input", update);
  form.addEventListener("change", update);
  ctx.watch("tray", (/** @type {{ id: string, name: string }[]} */ t) => { tray = t; update(); });
  // "See it in person" under the hero (or anywhere pointing here) adds that piece.
  document.addEventListener("click", (e) => {
    const a = /** @type {HTMLAnchorElement|null} */ (/** @type {Element} */ (e.target).closest('a[href$="#appointment"][data-see]'));
    if (!a) return;
    const name = a.closest(".nc-hero-cap, .jw-slide-t, figure")?.querySelector(".nc-hero-name, .jw-name-l, .jw-name")?.textContent?.trim();
    const more = /** @type {HTMLDetailsElement|null} */ (root.querySelector(".jw-appt-more"));
    if (more) more.open = true;
    if (name) { picked = { id: a.dataset.see ?? "", name }; update(); }
  });
  update();
}
