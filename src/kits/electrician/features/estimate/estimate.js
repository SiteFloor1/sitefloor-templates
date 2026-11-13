// @ts-check
/** The whole-house estimate: a range from the client's own bands, never a single figure. */
import { estimateRange, pounds } from "../../lib/quotes.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const e = /** @type {any} */ (ctx.data).estimate;
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-est-form]"));
  const beds = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-est-beds]"));
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-est-send]"));
  if (!e || !form || !beds || !send) throw new Error("estimate markup missing");
  const $ = (/** @type {string} */ s) => /** @type {HTMLElement} */ (root.querySelector(s));
  const update = () => {
    const home = /** @type {HTMLInputElement|null} */ (form.querySelector("input[name=est-home]:checked"))?.value ?? "";
    const works = [...form.querySelectorAll("input[name=est-work]:checked")].map((i) => /** @type {HTMLInputElement} */ (i).value);
    const n = Number(beds.value);
    $("[data-est-beds-out]").textContent = n >= e.bedroomsMax ? `${n} or more` : String(n);
    const r = estimateRange(e, home, n, works);
    $("[data-est-range]").textContent = r ? `${pounds(r.min)} – ${pounds(r.max)}` : "Choose the work";
    $("[data-est-lines]").replaceChildren(...(r?.lines ?? []).map((l) => { const li = document.createElement("li"); const a = document.createElement("span"); const b = document.createElement("span"); a.textContent = l.name; b.textContent = `${pounds(l.min)} – ${pounds(l.max)}`; li.append(a, b); return li; }));
    const homeLabel = e.homes.find((/** @type {any} */ h) => h.id === home)?.label ?? "";
    send.href = ctx.waHref(`${e.message}\n\nHome: ${homeLabel}, ${n} bedrooms\nWork: ${(r?.lines ?? []).map((l) => l.name).join(", ") || "not chosen"}\nWebsite range: ${r ? `${pounds(r.min)} to ${pounds(r.max)}` : "—"}`);
  };
  form.addEventListener("input", update);
  form.addEventListener("change", update);
  update();
}
