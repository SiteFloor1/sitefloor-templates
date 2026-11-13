// @ts-check
/**
 * Favours: the price per box and in all as the customer changes the size and number, the next price break, the
 * earliest day, and the request on WhatsApp. With "your seal" (Signature) the lid's seal is redrawn as they type.
 */
import { favourQuote, favourEarliest, favourText, sealOf } from "../../lib/favours.js";
import { longDay } from "../../lib/cake.js";
import { gbp } from "../../../../core/lib/text.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const d = /** @type {any} */ (ctx.data), f = d.favours;
  const q = (/** @type {string} */ s) => /** @type {any} */ (root.querySelector(s));
  const opts = /** @type {HTMLInputElement[]} */ ([...root.querySelectorAll('[name="fv-opt"]')]);
  const n = q("[data-fv-n]"), day = q("[data-fv-day]"), send = q("[data-fv-send]");
  const svg = q("[data-fv-seal] svg");
  const ring = svg?.querySelector("textPath"), m1 = svg?.querySelector(".seal-m1"), m2 = svg?.querySelector(".seal-m2");
  const shop = svg ? { ring: ring.textContent, a: m1.textContent, b: m2.textContent } : null;
  const sealOn = () => { const fs = q(".fv-sealf"); return Boolean(fs) && getComputedStyle(fs).display !== "none"; };
  const earliest = favourEarliest(ctx.now().date, f.leadDays);
  day.min = earliest;
  if (!day.value) day.value = earliest;
  const render = () => {
    const option = (opts.find((o) => o.checked) ?? opts[0]).value;
    const quote = favourQuote(f, { option, qty: Number(n.value) });
    q("[data-fv-per]").textContent = `${quote.qty} boxes at ${gbp(quote.per)}`;
    q("[data-fv-total]").textContent = gbp(quote.total);
    q("[data-fv-cap]").textContent = quote.option.name;
    q("[data-fv-break]").textContent = quote.nextBreak ? `From ${quote.nextBreak.from} boxes, ${gbp(Math.max(0, quote.option.price - quote.nextBreak.less))} a box.` : quote.saving ? `You save ${gbp(quote.saving)} at this number.` : "";
    const tooSoon = day.value && day.value < earliest;
    q("[data-fv-soon]").textContent = tooSoon ? `The earliest we can make them is ${longDay(earliest)}.` : `We need ${f.leadDays} days: the earliest is ${longDay(earliest)}.`;
    q("[data-fv-soon]").classList.toggle("is-err", Boolean(tooSoon));
    let seal = null;
    if (svg && shop && !sealOn()) { m1.textContent = shop.a; m2.textContent = shop.b; ring.textContent = shop.ring; ring.removeAttribute("textLength"); root.classList.remove("is-yours"); }
    if (svg && shop && sealOn()) {
      seal = sealOf({ a: q("[data-fv-a]").value, b: q("[data-fv-b]").value, line: q("[data-fv-line]").value });
      const custom = Boolean(seal.a || seal.b || seal.line);
      m1.textContent = seal.a || shop.a; m2.textContent = seal.b || shop.b;
      ring.textContent = seal.line ? `${seal.line} · ${d.name.toUpperCase()} ·` : shop.ring;
      if (seal.line) { ring.setAttribute("textLength", "262"); ring.setAttribute("lengthAdjust", "spacingAndGlyphs"); } else { ring.removeAttribute("textLength"); ring.removeAttribute("lengthAdjust"); }
      root.classList.toggle("is-yours", custom);
    }
    send.href = ctx.waHref(favourText(quote, { business: d.name, day: day.value ? longDay(day.value) : "(date)", occasion: q("[data-fv-for]").value, seal }));
  };
  root.addEventListener("click", (e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    if (t.closest("[data-fv-less]")) n.value = String(Math.max(f.minQty, Number(n.value) - 10));
    else if (t.closest("[data-fv-more]")) n.value = String(Math.min(f.maxQty, Number(n.value) + 10));
    else return;
    render();
  });
  n.addEventListener("change", () => { n.value = String(favourQuote(f, { option: opts[0].value, qty: Number(n.value) }).qty); render(); });
  root.addEventListener("input", render);
  root.addEventListener("change", render);
  // The demo's plan switcher shows or hides "your seal"; redraw when it does.
  const fs = q(".fv-sealf");
  if (fs) new MutationObserver(render).observe(fs, { attributes: true, attributeFilter: ["class"] });
  render();
  root.dataset.ready = "true";
}
