// @ts-check
/** Drop a hint: the piece she chose, her size if she adds it, a line; a WhatsApp message she sends to anyone. */
import { hintText } from "../../lib/pieces.js";
import { readData, must, waAnyone } from "../dom.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const dlg = /** @type {HTMLDialogElement} */ (root);
  const cfg = readData(root);
  const label = must(root, "[data-hint-piece]");
  const size = /** @type {HTMLInputElement} */ (must(root, "[data-hint-size]"));
  const note = /** @type {HTMLInputElement} */ (must(root, "[data-hint-note]"));
  const send = /** @type {HTMLAnchorElement} */ (must(root, "[data-hint-send]"));
  note.placeholder = cfg.note;
  /** @type {{ id: string, name: string, price: number } | null} */ let piece = null;
  const update = () => {
    if (!piece) return;
    const url = cfg.pages ? `${cfg.base}/piece-${piece.id}` : cfg.base;
    send.href = waAnyone(hintText({ business: ctx.data.name, piece: piece.name, price: piece.price, size: size.value, url, note: note.value || cfg.note }));
  };
  document.addEventListener("click", (e) => {
    const b = /** @type {HTMLElement|null} */ (/** @type {Element} */ (e.target).closest("[data-hint]"));
    if (!b) return;
    const card = /** @type {HTMLElement|null} */ (b.closest("[data-piece]"));
    if (!card) return;
    piece = { id: card.dataset.piece ?? "", name: card.dataset.name ?? "", price: Number(card.dataset.price) };
    label.textContent = piece.name;
    update();
    dlg.showModal();
  });
  root.addEventListener("input", update);
  send.addEventListener("click", () => setTimeout(() => dlg.close(), 300));
}
