// @ts-check
/**
 * The palm in its case: a magnifier that follows the pointer or the finger, and "Show me", which rings the name the
 * artist hid in the design. The magnifier is the same photo drawn larger, so nothing else loads.
 */
const ZOOM = 2.6;

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const box = /** @type {HTMLElement|null} */ (root.querySelector("[data-nf-case]"));
  const img = /** @type {HTMLImageElement|null} */ (root.querySelector("[data-nf-img]"));
  const lens = /** @type {HTMLElement|null} */ (root.querySelector("[data-nf-loupe]"));
  const show = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-nf-show]"));
  const hint = /** @type {HTMLElement|null} */ (root.querySelector("[data-nf-hint]"));
  if (!box || !img || !lens) throw new Error("name-find markup missing");
  lens.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
  img.addEventListener("load", () => { lens.style.backgroundImage = `url("${img.currentSrc || img.src}")`; });

  /** @param {number} x @param {number} y page-relative to the case */
  const at = (x, y) => {
    const r = box.getBoundingClientRect();
    const half = lens.offsetWidth / 2;
    lens.style.left = `${x}px`; lens.style.top = `${y}px`;
    lens.style.backgroundSize = `${r.width * ZOOM}px ${r.height * ZOOM}px`;
    lens.style.backgroundPosition = `${-(x * ZOOM - half)}px ${-(y * ZOOM - half)}px`;
    box.classList.add("on");
  };
  const fromEvent = (/** @type {PointerEvent} */ e) => { const r = box.getBoundingClientRect(); at(e.clientX - r.left, e.clientY - r.top); };
  const atName = () => {
    const r = box.getBoundingClientRect(), s = getComputedStyle(box);
    at(r.width * parseFloat(s.getPropertyValue("--nf-x")) / 100, r.height * parseFloat(s.getPropertyValue("--nf-y")) / 100);
  };
  box.addEventListener("pointermove", fromEvent);
  box.addEventListener("pointerdown", fromEvent);
  box.addEventListener("pointerleave", () => box.classList.remove("on"));
  box.addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") box.classList.remove("on"); });
  box.addEventListener("focus", atName);
  box.addEventListener("blur", () => box.classList.remove("on"));

  if (!show) return;
  const idle = hint?.textContent ?? "";
  show.addEventListener("click", () => {
    const found = box.classList.toggle("found");
    show.setAttribute("aria-pressed", String(found));
    show.textContent = found ? (show.dataset.nfHide ?? "Hide it") : (show.dataset.nfLabel ?? "Show me");
    if (hint) hint.textContent = found ? (show.dataset.nfLine ?? "") : idle;
  });
}
