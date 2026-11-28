// @ts-check
/** HOL-9: the guide shows once the guest's code matches this home's (a hash in the page; lib/owners.js). */
import { codeHash } from "../../lib/owners.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const want = /** @type {any} */ (ctx.data).guides?.[root.dataset.home ?? ""];
  const form = /** @type {HTMLFormElement} */ (root.querySelector("[data-sg-form]"));
  const body = /** @type {HTMLElement} */ (root.querySelector("[data-sg-body]"));
  const wrong = /** @type {HTMLElement} */ (root.querySelector("[data-sg-wrong]"));
  const open = (/** @type {string} */ code) => {
    const ok = !!want && codeHash(code) === want;
    body.hidden = !ok; form.hidden = ok; wrong.hidden = ok || !code;
    return ok;
  };
  body.hidden = true;
  const fromLink = new URLSearchParams(location.search).get("code");
  if (fromLink) open(fromLink);
  form.addEventListener("submit", (e) => { e.preventDefault(); open(String(new FormData(form).get("code") ?? "")); });
}
