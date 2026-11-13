// @ts-check
/** The documents to gather: shows the chosen moment's list (or the one linked by #id), prints it, copies it as text. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const pick = /** @type {HTMLSelectElement|null} */ (root.querySelector("#doc-for"));
  const sets = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-doc-set]")]);
  const said = root.querySelector("[data-doc-said]");
  if (!pick || !sets.length || !said) throw new Error("documents markup missing");
  const show = (/** @type {string} */ id) => { for (const s of sets) s.hidden = s.dataset.docSet !== id; };
  const fromHash = decodeURIComponent(location.hash.slice(1));
  if (sets.some((s) => s.dataset.docSet === fromHash)) pick.value = fromHash;
  show(pick.value);
  pick.addEventListener("change", () => { show(pick.value); history.replaceState(null, "", `#${pick.value}`); said.textContent = ""; });
  root.querySelector("[data-doc-print]")?.addEventListener("click", () => window.print());
  root.querySelector("[data-doc-copy]")?.addEventListener("click", async () => {
    const set = sets.find((s) => !s.hidden);
    if (!set) return;
    const lines = [`${set.querySelector("h2")?.textContent ?? ""}: documents to gather for ${ctx.data.name}`, ""];
    for (const g of set.querySelectorAll("fieldset")) {
      lines.push(g.querySelector("legend")?.textContent ?? "");
      for (const l of g.querySelectorAll("label")) lines.push(`${/** @type {HTMLInputElement} */ (l.querySelector("input")).checked ? "[x]" : "[ ]"} ${l.textContent?.trim()}`);
      lines.push("");
    }
    try { await navigator.clipboard.writeText(lines.join("\n").trim()); said.textContent = "Copied."; } catch { said.textContent = "Couldn't copy here. Use Print instead."; }
  });
}
