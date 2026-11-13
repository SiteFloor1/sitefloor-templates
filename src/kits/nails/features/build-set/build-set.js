// @ts-check
/** Build your set: every change re-adds the time and price from the salon's figures and rewrites the message. */
import { setTotal, setText, timeWords, price } from "../../lib/menu.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data);
  const cfg = data.buildSet, shades = /** @type {{ id: string, no: number, name: string }[]} */ (data.nailShades ?? []);
  const form = root.querySelector("[data-bs-form]"), total = root.querySelector("[data-bs-total]");
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-bs-send]")), shadeSel = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-bs-shade]"));
  if (!cfg || !form || !total || !send || !shadeSel) throw new Error("build your set markup missing");
  const val = (/** @type {string} */ n) => /** @type {HTMLInputElement|null} */ (form.querySelector(`input[name=${n}]:checked`))?.value ?? "";
  ctx.watch("shade", (/** @type {string} */ id) => { if (id && [...shadeSel.options].some((o) => o.value === id)) { shadeSel.value = id; update(); } });
  function update() {
    const pick = { system: val("bs-system"), shape: val("bs-shape"), length: val("bs-length"), finish: val("bs-finish"), art: val("bs-art") };
    const s = shades.find((x) => x.id === /** @type {HTMLSelectElement} */ (shadeSel).value);
    const shadeName = s ? `${s.name} (No. ${s.no})` : "";
    const t = setTotal(cfg, pick);
    /** @type {Element} */ (total).textContent = `${timeWords(t.minutes)} · ${price(t.price)}`;
    const text = setText(cfg.message, cfg, pick, shadeName);
    /** @type {HTMLAnchorElement} */ (send).href = ctx.bookHref(text);
    /** @type {HTMLAnchorElement} */ (send).dataset.usual = text.slice(text.indexOf("book: ") + 6, text.indexOf(". About"));
  }
  form.addEventListener("change", update);
  update();
}
