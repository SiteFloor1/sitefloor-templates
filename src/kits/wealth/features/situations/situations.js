// @ts-check
/** Your situation: the chosen situation changes the line and where the next step goes; the place changes how we meet. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data).situations;
  const who = /** @type {HTMLSelectElement|null} */ (root.querySelector("#sit-who"));
  const where = /** @type {HTMLSelectElement|null} */ (root.querySelector("#sit-where"));
  const line = root.querySelector("[data-sit-line]");
  const next = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-sit-next]"));
  const meet = root.querySelector("[data-sit-meet]");
  if (!data || !who || !where || !line || !next || !meet) throw new Error("situations markup or data missing");
  const first = { line: line.textContent ?? "", next: next.textContent ?? "" };
  const render = () => {
    const s = data.items.find((/** @type {any} */ x) => x.id === who.value);
    line.textContent = s ? s.line : first.line;
    next.textContent = s ? s.next : first.next;
    next.href = who.selectedOptions[0]?.dataset.href ?? next.href;
    meet.textContent = data.places.find((/** @type {any} */ p) => p.id === where.value)?.meet ?? "";
  };
  who.addEventListener("change", render);
  where.addEventListener("change", render);
  render();
}
