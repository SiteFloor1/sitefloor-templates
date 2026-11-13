// @ts-check
/** If there's no will: read the ticked family members and write who inherits, from src/kits/law/lib/intestacy.js. */
import { intestacy } from "../../lib/intestacy.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const boxes = /** @type {HTMLInputElement[]} */ ([...root.querySelectorAll("[data-int]")]);
  const shares = root.querySelector("[data-int-shares]");
  const notes = root.querySelector("[data-int-notes]");
  if (!boxes.length || !shares || !notes) throw new Error("intestacy markup missing");
  const show = () => {
    /** @type {Record<string, boolean>} */ const fam = {};
    for (const b of boxes) fam[b.value] = b.checked;
    const r = intestacy(fam);
    shares.replaceChildren(...r.shares.map((s) => { const li = document.createElement("li"); const b = document.createElement("b"); b.textContent = s.who; li.append(b, s.gets); return li; }));
    notes.replaceChildren(...r.notes.map((n) => { const li = document.createElement("li"); li.textContent = n; return li; }));
  };
  for (const b of boxes) b.addEventListener("change", show);
  show();
  root.setAttribute("data-ready", "");
}
