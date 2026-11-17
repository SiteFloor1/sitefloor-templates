// @ts-check
/**
 * Private appointments: the studio's standing times on the coming dates (lib/modest.js), worked out on the day; the
 * choice goes to the shop as a request on WhatsApp (or its booking app), and the shop confirms by message. The build
 * drew the same form for the build day, so redrawing it for today changes words, not the page's shape.
 */
import { appointmentDates, appointmentMessage, appointmentSummary } from "../../lib/modest.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), cfg = data.appointments;
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-ap-form]"));
  const days = root.querySelector("[data-ap-days]"), times = root.querySelector("[data-ap-times]"), sum = root.querySelector("[data-ap-sum]");
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-ap-send]"));
  if (!cfg || !form || !days || !times || !sum || !send) return;
  const dates = appointmentDates(cfg.weekly, ctx.now().date, cfg.days, cfg.closed);
  /** @param {string} name @param {string} value @param {string} text @param {boolean} checked */
  const opt = (name, value, text, checked) => {
    const label = document.createElement("label");
    const input = Object.assign(document.createElement("input"), { type: "radio", name, value, checked });
    label.append(input, text);
    return label;
  };
  days.replaceChildren(...dates.map((d, i) => opt("day", d.date, d.words.replace(/ \d{4}$/, ""), i === 0)));
  const showTimes = () => {
    const d = dates.find((x) => x.date === new FormData(form).get("day")) ?? dates[0];
    const was = new FormData(form).get("time");
    times.replaceChildren(...(d?.times ?? []).map((t, i) => opt("time", t, t, was ? t === was : i === 0)));
    if (!times.querySelector("input:checked")) times.querySelector("input")?.setAttribute("checked", "");
  };
  const draw = () => {
    const fd = new FormData(form);
    const d = dates.find((x) => x.date === fd.get("day"));
    const t = String(fd.get("time") ?? ""), n = Number(fd.get("n")), why = String(fd.get("for") ?? "");
    sum.textContent = appointmentSummary(d, t, n);
    send.href = ctx.bookHref(appointmentMessage(data.name, d, t, n, why));
  };
  form.addEventListener("change", (e) => { if (/** @type {HTMLInputElement} */ (e.target).name === "day") showTimes(); draw(); });
  form.addEventListener("submit", (e) => e.preventDefault());
  showTimes();
  draw();
}
