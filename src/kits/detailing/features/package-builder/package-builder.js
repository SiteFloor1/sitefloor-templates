// @ts-check
/**
 * Build your package: size, package and extras add up from the studio's own prices (src/kits/detailing/lib/packages.js);
 * the WhatsApp link always carries the current choices. The chosen size is shared with the packages list.
 */
import { buildTotal, builderText, daysLabel } from "../../lib/packages.js";
import { gbp } from "../../../../core/lib/text.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const d = /** @type {any} */ (ctx.data).detailing;
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-bd-form]"));
  const total = root.querySelector("[data-bd-total]"), days = root.querySelector("[data-bd-days]"), quote = /** @type {HTMLElement|null} */ (root.querySelector("[data-bd-quote]"));
  const go = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-bd-go]")), car = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-bd-car]"));
  if (!form || !total || !days || !quote || !go || !car) throw new Error("builder markup missing");
  let size = d.sizes[0].id;
  const update = () => {
    const pkg = d.packages.find((/** @type {any} */ p) => p.id === (/** @type {HTMLInputElement|null} */ (form.querySelector("[name=dt-pkg]:checked")))?.value) ?? d.packages[0];
    const picked = new Set([...form.querySelectorAll("[name=dt-extra]:checked")].map((x) => /** @type {HTMLInputElement} */ (x).value));
    const extras = d.extras.filter((/** @type {any} */ x) => picked.has(x.id));
    const t = buildTotal({ pkg, extras, size });
    total.textContent = t.total === null ? "Ask us" : gbp(t.total);
    days.textContent = `About ${daysLabel(t.days)} with us.`;
    quote.hidden = !t.unpriced.length;
    quote.textContent = t.unpriced.length ? `${t.unpriced.join(", ")}: we'll quote for your car.` : "";
    go.href = ctx.waHref(builderText({ opening: d.builder, size: d.sizes.find((/** @type {any} */ s) => s.id === size), pkg, extras, car: car.value }));
  };
  form.addEventListener("change", (e) => {
    const t = /** @type {HTMLInputElement} */ (e.target);
    if (t.matches("[data-size-pick]")) ctx.share("detailSize", t.value);
    else update();
  });
  car.addEventListener("input", update);
  ctx.watch("detailSize", (s) => {
    size = s;
    for (const r of /** @type {NodeListOf<HTMLInputElement>} */ (form.querySelectorAll("[data-size-pick]"))) r.checked = r.value === s;
    for (const b of /** @type {NodeListOf<HTMLElement>} */ (form.querySelectorAll("[data-size-price]"))) {
      const p = JSON.parse(b.dataset.sizePrice ?? "{}")[s];
      b.textContent = Number.isInteger(p) ? gbp(p) : (b.dataset.quote ?? "Ask us");
    }
    update();
  });
  update();
}
