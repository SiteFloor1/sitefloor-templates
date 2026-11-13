// @ts-check
/** Private hire: the choices go into the WhatsApp message as they're made; the date in UK order. */
import { dayName } from "../../lib/classes.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const msg = /** @type {any} */ (ctx.data).pilates?.hireMessage;
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-hire-form]"));
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-hire-send]"));
  if (!msg || !form || !send) throw new Error("private hire markup missing");
  const v = (/** @type {string} */ sel) => (/** @type {HTMLInputElement|null} */ (form.querySelector(sel))?.value ?? "").trim();
  const render = () => {
    const kind = v('input[name="hr-kind"]:checked');
    const d = v("#hr-date"), n = v("#hr-n"), org = v("#hr-org").slice(0, 60);
    const uk = /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(`${d}T12:00:00Z`)) ? `${dayName(d)} ${d.slice(0, 4)}` : "";
    send.href = ctx.waHref([msg, kind && `For: ${kind}`, uk && `Date: ${uk}`, /^\d{1,3}$/.test(n) ? `People: ${n}` : "", org && `Company or occasion: ${org}`].filter(Boolean).join("\n"));
  };
  form.addEventListener("input", render);
  form.addEventListener("change", render);
  render();
}
