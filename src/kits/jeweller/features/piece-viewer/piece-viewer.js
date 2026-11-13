// @ts-check
/**
 * One piece at a time. Any card with data-open opens its piece full screen; Previous/Next, the arrow keys and a
 * sideways swipe step through every piece. A photo loads only when its piece is shown (and the next one, ready).
 */
/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const dialog = /** @type {HTMLDialogElement} */ (root);
  const slides = /** @type {HTMLElement[]} */ ([...dialog.querySelectorAll("[data-slide]")]);
  const count = dialog.querySelector("[data-view-count]");
  if (!slides.length || typeof dialog.showModal !== "function") return;
  let at = 0;

  /** @param {number} i */
  const load = (i) => {
    const img = /** @type {HTMLImageElement|null} */ (slides[(i + slides.length) % slides.length].querySelector("img[data-src]"));
    if (img && !img.src) img.src = img.dataset.src ?? "";
  };
  /** @param {number} i */
  const show = (i) => {
    at = (i + slides.length) % slides.length;
    slides.forEach((s, j) => { s.hidden = j !== at; });
    load(at); load(at + 1);
    if (count) count.textContent = `${at + 1} of ${slides.length}`;
  };
  /** @param {string} id */
  const open = (id) => {
    const i = slides.findIndex((s) => s.dataset.slide === id);
    if (i < 0) return false;
    show(i);
    if (!dialog.open) dialog.showModal();
    return true;
  };

  document.addEventListener("click", (e) => {
    const a = /** @type {HTMLElement|null} */ (/** @type {Element} */ (e.target).closest("[data-open]"));
    if (!a || e.defaultPrevented || /** @type {MouseEvent} */ (e).metaKey || /** @type {MouseEvent} */ (e).ctrlKey) return;
    if (open(a.dataset.open ?? "")) e.preventDefault();
  });
  dialog.querySelector("[data-view-prev]")?.addEventListener("click", () => show(at - 1));
  dialog.querySelector("[data-view-next]")?.addEventListener("click", () => show(at + 1));
  dialog.querySelector("[data-view-close]")?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("keydown", (e) => {
    if ((/** @type {HTMLElement} */ (e.target)).closest("input, textarea")) return;
    if (e.key === "ArrowRight") { e.preventDefault(); show(at + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); show(at - 1); }
  });
  // A sideways swipe of more than 50px steps; a mostly vertical one scrolls as usual.
  let x0 = 0, y0 = 0;
  dialog.addEventListener("pointerdown", (e) => { x0 = e.clientX; y0 = e.clientY; });
  dialog.addEventListener("pointerup", (e) => {
    const dx = e.clientX - x0, dy = e.clientY - y0;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(at + (dx < 0 ? 1 : -1));
  });
  // A link inside the viewer (its page, the appointment) closes it first.
  dialog.addEventListener("click", (e) => {
    const a = /** @type {HTMLAnchorElement|null} */ (/** @type {Element} */ (e.target).closest("a[href^='#']"));
    if (a) dialog.close();
  });
}
