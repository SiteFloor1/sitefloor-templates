// @ts-check
/** Build your package: the total and the WhatsApp message follow the choices. The date check's date joins the message. */
import { builderTotal, builderText, gbp } from "../../lib/packages.js";
import { ukDate, isYmd } from "../../../../core/lib/diary.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).weddingfilm?.builder;
  const form = root.querySelector("[data-bd-form]"), total = root.querySelector("[data-bd-total]");
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-bd-send]"));
  if (!cfg || !form || !total || !send) throw new Error("package builder markup missing");
  let wedding = "";
  const update = () => {
    const id = /** @type {HTMLInputElement|null} */ (form.querySelector("input[name=bd-pkg]:checked"))?.value;
    const pkg = cfg.packages.find((/** @type {any} */ p) => p.id === id);
    if (!pkg) return;
    /** @type {Record<string, number>} */ const counts = {};
    for (const el of /** @type {(HTMLInputElement|HTMLSelectElement)[]} */ ([...form.querySelectorAll("[data-bd-extra]")])) {
      counts[el.dataset.bdExtra ?? ""] = el instanceof HTMLInputElement ? (el.checked ? 1 : 0) : Number(el.value);
    }
    const t = builderTotal(pkg, cfg.extras, counts);
    total.textContent = t ? `${gbp(t.total)} in all` : "";
    send.href = ctx.bookHref(builderText(cfg.message, { pkg, extras: cfg.extras, counts, date: wedding ? ukDate(wedding) : "" }));
  };
  form.addEventListener("change", update);
  ctx.watch("wedding", (/** @type {string} */ ymd) => { if (isYmd(ymd)) { wedding = ymd; update(); } });
  update();
}
