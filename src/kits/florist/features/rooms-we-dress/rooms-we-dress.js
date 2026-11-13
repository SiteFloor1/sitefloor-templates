// @ts-check
/** Rooms we dress: tabs (arrow keys move between them) show one room at a time; the phone's strip is plain scrolling. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const tabs = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-room-tab]")]);
  const rooms = [...root.querySelectorAll(".fl-room")];
  root.classList.add("is-tabbed");
  /** @param {number} i @param {boolean} [focus] */
  const show = (i, focus) => {
    tabs.forEach((t, k) => { t.setAttribute("aria-selected", String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    rooms.forEach((r, k) => r.classList.toggle("is-on", k === i));
    if (focus) tabs[i]?.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => show(i));
    t.addEventListener("keydown", (e) => {
      const n = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (n) { e.preventDefault(); show((i + n + tabs.length) % tabs.length, true); }
    });
  });
}
