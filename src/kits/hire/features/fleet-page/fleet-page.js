// @ts-check
/**
 * The fleet page: the plain radio filters already work in CSS; the script adds search by make and model, "free on my
 * dates" (the shared date picker against the client's Sheet; an unreadable Sheet filters nothing and says so), sort by
 * price, and the count. Class and car pages carry this feature too but have no filter form.
 */
import { startAvailability } from "../fleet/sheet-provider.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-fl-form]"));
  const list = /** @type {HTMLElement|null} */ (root.querySelector("[data-fl-list]"));
  if (!form || !list) return;
  const count = /** @type {HTMLElement} */ (root.querySelector("[data-fl-count]"));
  const none = /** @type {HTMLElement} */ (root.querySelector("[data-fl-none]"));
  const q = /** @type {HTMLInputElement} */ (form.querySelector("[data-fl-q]"));
  const sort = /** @type {HTMLSelectElement} */ (form.querySelector("[data-fl-sort]"));
  const items = /** @type {HTMLElement[]} */ ([...list.querySelectorAll("[data-car]")]);
  const original = [...items];
  /** @type {any} */ let avail = null;
  /** @type {any} */ let range = null;

  startAvailability(ctx);
  ctx.watch("hire:availability", (a) => { avail = a; apply(); });
  ctx.watch("date-range:fleet", (r) => { range = r; apply(); });

  /** Read a radio group. @param {string} name */
  const radio = (name) => /** @type {HTMLInputElement|null} */ (form.querySelector(`input[name="${name}"]:checked`))?.value ?? "";

  function apply() {
    if (!form || !list) return;
    const want = { cls: radio("cls"), seats: radio("seats"), power: radio("power"), budget: radio("budget") };
    const words = q.value.toLowerCase().split(/\s+/).filter(Boolean);
    const dates = range?.ok ? range.dates : null;
    let shown = 0;
    for (const el of items) {
      const flags = (el.dataset.flags ?? "").split(" ");
      const fits = (!want.cls || flags.includes(`class-${want.cls}`)) && (!want.seats || flags.includes(`seats-${want.seats}`))
        && (!want.power || flags.includes(`power-${want.power}`)) && (!want.budget || flags.includes(`budget-${want.budget}`))
        && words.every((w) => (el.dataset.name ?? "").includes(w))
        && (!dates || !avail?.ok || !(avail.taken[el.dataset.car ?? ""] ?? []).some((/** @type {string} */ d) => dates.includes(d)));
      el.hidden = !fits;
      if (fits) shown++;
    }
    const order = sort.value === "low" || sort.value === "high"
      ? [...original].sort((a, b) => (Number(a.dataset.price) - Number(b.dataset.price)) * (sort.value === "low" ? 1 : -1)) : original;
    list.append(...order);
    const dateNote = dates && !avail?.ok ? " (we couldn't read our calendar, so dates aren't filtered: ask us)" : dates ? ", free on your dates on our calendar" : "";
    count.textContent = `${shown} ${shown === 1 ? "car" : "cars"}${dateNote}`;
    none.hidden = shown > 0;
    ctx.share("fleet:shown", items.filter((el) => !el.hidden).map((el) => el.dataset.car));
  }
  form.addEventListener("change", apply);
  q.addEventListener("input", apply);
  form.addEventListener("submit", (e) => e.preventDefault());
  ctx.share("fleet:apply", apply);
  apply();
}
