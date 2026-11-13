// @ts-check
/** Words we use: filter the list as the visitor types. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const input = /** @type {HTMLInputElement|null} */ (root.querySelector("#gl-find"));
  const none = /** @type {HTMLElement|null} */ (root.querySelector("#gl-none"));
  const rows = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-term]")]);
  if (!input || !none || !rows.length) throw new Error("glossary markup missing");
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    let shown = 0;
    for (const r of rows) { const on = !q || (r.dataset.term ?? "").includes(q); r.hidden = !on; if (on) shown++; }
    none.hidden = shown > 0;
  });
  root.setAttribute("data-ready", "");
}
