// @ts-check
/** Start a project: the answers become one WhatsApp message (see lib/brief.js); only the postcode district is asked. */
import { briefMessage, outwardCode } from "../../lib/brief.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("form"));
  const err = /** @type {HTMLElement|null} */ (root.querySelector("[data-brief-err]"));
  const opening = /** @type {any} */ (ctx.data).build?.brief?.opening;
  if (!form || !err || !opening) throw new Error("brief markup or config missing");
  const where = /** @type {HTMLInputElement} */ (form.elements.namedItem("where"));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const raw = where.value.trim();
    const code = outwardCode(raw);
    if (raw && !code) { err.hidden = false; err.textContent = "That doesn't look like a postcode district. Try the first half, like N5 or SW11, or leave it empty."; where.focus(); return; }
    err.hidden = true; where.value = code;
    const val = (/** @type {string} */ k) => { const f = form.elements.namedItem(k); return f && "value" in f ? String(f.value) : ""; };
    const text = briefMessage(opening, { what: val("what"), where: code, when: val("when"), budget: val("budget"), words: val("words") });
    window.open(ctx.waHref(text), "_blank", "noopener");
  });
  where.addEventListener("input", () => { err.hidden = true; });
}
