// @ts-check
/** "Save the checklist": the client's own list as a small text file, made in the browser (nothing is sent anywhere). */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const btn = root.querySelector("[data-bring-save]");
  const hire = /** @type {any} */ (ctx.data).hire;
  if (!btn || !hire?.bring) return;
  btn.addEventListener("click", () => {
    const text = checklistText(ctx.data.name, hire.bring, /** @type {any} */ (ctx.data).place ?? "");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = `${ctx.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-what-to-bring.txt`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}

/** @param {string} name @param {string[]} items @param {string} place */
export function checklistText(name, items, place) {
  return [`${name}: what to bring`, "", ...items.map((i) => `[ ] ${i}`), "", place].join("\n");
}
