// @ts-check
/** Tap a film's still to play it where it is: the still becomes a muted player with its own controls. */
/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  for (const b of /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-play]")])) {
    b.addEventListener("click", () => {
      const img = b.querySelector("img");
      const v = document.createElement("video");
      Object.assign(v, { src: b.dataset.play ?? "", poster: img?.src ?? "", muted: true, controls: true, playsInline: true, autoplay: true, loop: true });
      v.width = Number(img?.getAttribute("width")); v.height = Number(img?.getAttribute("height"));
      v.className = "cf-reel-v"; v.setAttribute("aria-label", b.getAttribute("aria-label")?.replace(/^Play /, "") ?? "");
      b.replaceWith(v); v.focus();
    }, { once: true });
  }
}
