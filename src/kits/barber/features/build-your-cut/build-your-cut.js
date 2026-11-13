// @ts-check
/**
 * Build-your-cut: a real <form> of radios/checkboxes (works with keyboard and
 * screen readers). On every change it recalculates price and time, redraws
 * the side-profile diagram and rewrites the "Book this cut" WhatsApp link.
 */
import { priceCut, extrasFor, orderMessage, lengthLabel, LENGTHS, FADE_HEIGHTS } from "../../lib/cut.js";
import { profileSVG, FADE_TOP } from "../../lib/profile-svg.js";
import { formatTime24 } from "../../../../core/lib/hours.js";
import { gbp } from "../../../../core/lib/text.js";

/** Hair thickness on top for each length step, adult and child heads. */
const LENGTH_UNITS = { adult: [4, 6, 8, 10, 16, 22, 28], child: [4, 5, 6, 8, 10, 12, 14] };
const PRICE_ANIMATION_MS = 450;

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const form = /** @type {HTMLFormElement} */ (root.querySelector("[data-cut-form]"));
  const diagram = /** @type {HTMLElement} */ (root.querySelector("[data-cut-diagram]"));
  const caption = /** @type {HTMLElement} */ (root.querySelector("[data-cut-caption]"));
  const price = /** @type {HTMLElement} */ (root.querySelector("[data-cut-price]"));
  const summary = /** @type {HTMLElement} */ (root.querySelector("[data-cut-summary]"));
  const book = /** @type {HTMLAnchorElement} */ (root.querySelector("[data-cut-book]"));
  const fadeGroup = /** @type {HTMLElement} */ (root.querySelector("[data-cut-fade]"));
  const lengthOut = /** @type {HTMLElement} */ (root.querySelector("[data-cut-length]"));
  const lengthInput = /** @type {HTMLInputElement} */ (form.elements.namedItem("length"));
  const menu = { services: ctx.data.services, extras: ctx.data.extras };
  /** @type {any[]|null} */
  let board = null;
  let shownPrice = 0;

  const read = () => {
    const fd = new FormData(form);
    return {
      service: String(fd.get("service")),
      fade: /** @type {"low"|"mid"|"high"} */ (String(fd.get("fade") ?? "mid")),
      length: Number(fd.get("length") ?? 3),
      extras: fd.getAll("extras").map(String),
      barber: String(fd.get("barber") ?? "any"),
    };
  };

  /** Earliest free barber from the chair board (if the shop has one running). */
  const whenText = (/** @type {string} */ barber) => {
    if (!ctx.status().open) return "next opening";
    if (!board) return "we'll confirm the time";
    const options = board
      .filter((c) => (barber === "any" || c.barber === barber) && (c.status === "free" || c.status === "busy"))
      .map((c) => ({ name: c.barber, at: c.status === "free" ? -1 : c.freeAtMinutes ?? Infinity }))
      .sort((a, b) => a.at - b.at);
    const best = options[0];
    if (!best || best.at === Infinity) return "we'll confirm the time";
    return best.at === -1 ? `${best.name} is free now` : `earliest ${formatTime24(best.at)} with ${best.name}`;
  };

  const update = () => {
    const sel = read();
    const service = menu.services.find((s) => s.id === sel.service);
    if (!service) return;
    // Extras that don't apply (beard work on a kids' cut) are hidden and unticked.
    const allowed = new Set(extrasFor(menu.extras, service).map((e) => e.id));
    for (const label of root.querySelectorAll("[data-extra]")) {
      const el = /** @type {HTMLElement} */ (label);
      const ok = allowed.has(el.dataset.extra ?? "");
      el.hidden = !ok;
      const box = /** @type {HTMLInputElement} */ (el.querySelector("input"));
      if (!ok) box.checked = false;
    }
    fadeGroup.hidden = !service.fade;
    lengthInput.disabled = Boolean(service.buzz);

    const final = read();
    const quote = priceCut(menu, final);
    const when = whenText(final.barber);
    lengthOut.textContent = service.buzz ? "Grade 1" : LENGTHS[final.length];
    animatePrice(quote.price);
    summary.textContent = `About ${quote.minutes} minutes · ${when}`;
    book.href = ctx.bookHref(orderMessage(quote, final, when));

    const kid = Boolean(service.kids);
    diagram.innerHTML = profileSVG({ // numbers and fixed labels only, no user text
      id: "cut",
      kid,
      buzz: Boolean(service.buzz),
      fade: !service.fade ? "none" : service.id === "taper" ? "taper" : "line",
      fadeTop: FADE_TOP[kid ? "child" : "adult"][final.fade],
      length: LENGTH_UNITS[kid ? "child" : "adult"][final.length],
      beard: !kid && (final.extras.includes("beard") || final.extras.includes("towel")),
      towel: final.extras.includes("towel"),
      lengthLabel: service.buzz ? "GRADE 1" : LENGTHS[final.length].toUpperCase(),
      label: `Diagram: ${service.name}, ${lengthLabel(service, final.length)}`,
    });
    caption.replaceChildren(...captionParts(service, final, quote.extras).map(([k, v]) => {
      const span = document.createElement("span");
      const b = document.createElement("b");
      span.append(`${k} `);
      b.textContent = v;
      span.append(b);
      return span;
    }));
  };

  /** @param {number} to */
  const animatePrice = (to) => {
    const from = shownPrice;
    shownPrice = to;
    if (from === to || matchMedia("(prefers-reduced-motion: reduce)").matches) { price.textContent = gbp(to); return; }
    const start = performance.now();
    const step = (/** @type {number} */ t) => {
      const k = Math.min(1, (t - start) / PRICE_ANIMATION_MS);
      price.textContent = gbp(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  form.addEventListener("input", update);
  form.addEventListener("submit", (e) => e.preventDefault());
  ctx.watch("board", (value) => { board = value; update(); });
  ctx.everyMinute(update);
  update();
}

/**
 * @param {any} service @param {{ fade: string, length: number }} sel @param {{ id: string }[]} extras
 * @returns {[string, string][]}
 */
function captionParts(service, sel, extras) {
  /** @type {[string, string][]} */
  const parts = [["Cut", service.name]];
  if (service.fade) parts.push(["Fade", FADE_HEIGHTS.find((f) => f[0] === sel.fade)?.[1] ?? "Mid"]);
  parts.push(["Top", service.buzz ? "Grade 1" : LENGTHS[sel.length]]);
  const ids = extras.map((e) => e.id);
  if (ids.includes("towel")) parts.push(["Beard", "Hot towel"]);
  else if (ids.includes("beard")) parts.push(["Beard", "Shaped"]);
  return parts;
}
