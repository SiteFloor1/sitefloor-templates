// @ts-check
/**
 * Conflict-safe first contact: writes the first email (only who is involved and how to reply) and opens the visitor's
 * email app with it. Nothing is sent or stored by this site.
 */
import { mailHref, partiesFrom, firstContactBody } from "../../lib/route.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("#fc-form"));
  const done = /** @type {HTMLElement|null} */ (root.querySelector("#fc-done"));
  if (!form || !done) throw new Error("first contact markup missing");
  const $ = (/** @type {string} */ s) => /** @type {any} */ (root.querySelector(s));
  const to = /** @type {HTMLAnchorElement} */ ($("#fc-open")).getAttribute("href")?.replace(/^mailto:/, "") ?? "";
  root.setAttribute("data-ready", "");
  let body = "";

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#fc-name").value.trim(), reach = $("#fc-reach").value.trim(), parties = partiesFrom($("#fc-parties").value);
    const err = $("#fc-err");
    const missing = !name ? "your name" : !reach ? "how to reach you" : !parties.length ? "the other people or companies involved" : "";
    if (missing) { err.textContent = `Please add ${missing}.`; err.hidden = false; return; }
    err.hidden = true;
    body = firstContactBody({ name, reach, area: $("#fc-area").value, parties, firm: ctx.data.name });
    const href = mailHref(to, `First contact: ${$("#fc-area").value}`, body);
    $("#fc-msg").textContent = body;
    $("#fc-open").href = href;
    form.hidden = true; done.hidden = false; done.focus();
    location.href = href;
  });
  $("#fc-copy").addEventListener("click", () => {
    navigator.clipboard?.writeText(body).then(() => { $("#fc-copy").textContent = "Copied"; }, () => {
      const r = document.createRange(); r.selectNodeContents($("#fc-msg")); getSelection()?.removeAllRanges(); getSelection()?.addRange(r);
    });
  });
}
