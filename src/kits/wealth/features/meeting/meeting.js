// @ts-check
/** Arrange a meeting: writes the visitor's request into their own email or WhatsApp message. Nothing is stored or sent by the site. */
import { meetingMessage, mailHref } from "../../lib/meeting.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("#meet-form"));
  const errEl = /** @type {HTMLElement|null} */ (root.querySelector("[data-meet-err]"));
  const done = /** @type {HTMLElement|null} */ (root.querySelector("[data-meet-done]"));
  const wa = root.querySelector("[data-meet-wa]");
  if (!form || !errEl || !done || !wa) throw new Error("meeting markup missing");
  const val = (/** @type {string} */ n) => {
    const f = /** @type {any} */ (form.elements.namedItem(n));
    return f ? String(f.value ?? "") : "";
  };
  /** @returns {{ subject: string, body: string } | null} */
  const read = () => {
    const r = meetingMessage({ name: val("name"), reach: val("reach"), about: val("about"), where: val("where"), when: val("when"), adviser: val("adviser") }, ctx.data.name);
    if (!r.ok) {
      errEl.textContent = r.why; errEl.hidden = false;
      /** @type {HTMLElement|null} */ (form.querySelector(`[name="${r.field}"]`))?.focus();
      return null;
    }
    errEl.hidden = true;
    return r;
  };
  // "Book time with …" on an adviser's page opens this page as #with-<id>, with that adviser already chosen.
  const withId = location.hash.startsWith("#with-") ? location.hash.slice(6) : "";
  const pick = /** @type {HTMLSelectElement|null} */ (form.querySelector("#meet-adviser"));
  const opt = pick && withId ? [...pick.options].find((o) => o.dataset.id === withId) : undefined;
  if (pick && opt) pick.value = opt.value;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const m = read();
    if (!m) return;
    location.href = mailHref(/** @type {any} */ (ctx.data).meeting.email, m);
    done.hidden = false;
  });
  wa.addEventListener("click", () => {
    const m = read();
    if (m) window.open(ctx.waHref(m.body), "_blank", "noopener");
  });
}
