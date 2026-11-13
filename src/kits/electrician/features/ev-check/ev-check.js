// @ts-check
/** The EV check: the visitor's answers against the client's own rules and prices (evCheck in lib/quotes.js). */
import { evCheck, pounds } from "../../lib/quotes.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const ev = /** @type {any} */ (ctx.data).ev;
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-ev-form]"));
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-ev-send]"));
  const metres = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-ev-metres]"));
  const fuse = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-ev-fuse]"));
  const loads = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-ev-loads]"));
  if (!ev || !form || !send || !metres || !fuse || !loads) throw new Error("EV check markup missing");
  const $ = (/** @type {string} */ s) => /** @type {HTMLElement} */ (root.querySelector(s));
  const update = () => {
    const parking = /** @type {"drive"|"street"|"shared"} */ ((/** @type {HTMLInputElement|null} */ (form.querySelector("input[name=ev-park]:checked")))?.value ?? "drive");
    const m = Number(metres.value);
    $("[data-ev-m]").textContent = `${m} m`;
    const r = evCheck(ev, { parking, metres: m, fuse: Number(fuse.value), loads: loads.checked ? 1 : 0 });
    $("[data-ev-verdict]").textContent = r.verdict === "standard" ? `A standard install: ${pounds(/** @type {number} */ (r.price))}${r.extraMetres ? `, with ${r.extraMetres} m of extra cable` : ""}.`
      : r.verdict === "survey" ? `It should go in, but we'd look first.${r.price !== null ? ` From ${pounds(r.price)}.` : ""}` : "Not as a standard home install.";
    $("[data-ev-why]").replaceChildren(...r.reasons.map((t) => { const li = document.createElement("li"); li.textContent = t; return li; }));
    const fuseText = fuse.value === "0" ? "not sure" : `${fuse.value}A`;
    send.href = ctx.waHref(`${ev.message}\n\nParking: ${parking === "drive" ? "own drive or garage" : parking === "shared" ? "shared car park" : "on the street"}\nFuse board to charger: about ${m} m\nMain fuse: ${fuseText}\nOther big loads: ${loads.checked ? "yes" : "no"}`);
    ctx.share("evMetres", m);
  };
  form.addEventListener("input", update);
  form.addEventListener("change", update);
  ctx.watch("evRun", (/** @type {number} */ m) => { if (m && Math.round(m) !== Number(metres.value)) { metres.value = String(Math.round(m)); update(); } });
  update();
}
