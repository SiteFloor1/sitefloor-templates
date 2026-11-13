// @ts-check
/** The finish in motion: a tap swaps the still for its clip (muted, looping, inline); nothing loads before the tap. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  root.addEventListener("click", (e) => {
    const b = /** @type {HTMLButtonElement|null} */ (/** @type {Element} */ (e.target).closest("[data-fc-play]"));
    const box = b?.closest("[data-fc-box]");
    const still = box?.querySelector("img");
    if (!b || !box || !still) return;
    const v = document.createElement("video");
    v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true; v.preload = "auto";
    v.setAttribute("aria-label", still.alt); v.poster = still.currentSrc || still.src;
    for (const [type, src] of /** @type {[string, string|undefined][]} */ ([["video/webm", b.dataset.webm], ["video/mp4", b.dataset.mp4]])) {
      if (!src) continue;
      const s = document.createElement("source"); s.src = src; s.type = type; v.append(s);
    }
    v.addEventListener("error", () => v.replaceWith(still), { once: true });
    still.replaceWith(v); b.remove();
    v.play().catch(() => { /* the browser said no: the poster stays */ });
  });
}
