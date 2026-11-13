// @ts-check
/**
 * The florist's note for the week. With a Sheet, rows "note,text,…" and "note,from,…" replace it; anything empty or
 * too long keeps the built note.
 */
import { startStudio } from "../../lib/studio.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  startStudio(ctx);
  ctx.watch("studio", (/** @type {any} */ s) => {
    const n = s?.ok ? s.note ?? {} : {};
    const t = root.querySelector("[data-note-text]"), f = root.querySelector("[data-note-from]");
    if (t && n.text && n.text.length <= 240) t.textContent = n.text;
    if (f && n.from && n.from.length <= 40) f.textContent = n.from;
  });
}
