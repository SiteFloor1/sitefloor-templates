// @ts-check
/** The waitlist line: shown only while the week has a full class (the timetable turns those into WhatsApp links). */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const section = root.closest("section");
  const check = () => { root.hidden = !section?.querySelector("[data-tt-wait]"); };
  section?.addEventListener("tt:drawn", check);
  ctx.watch("places", () => setTimeout(check, 0));
  check();
}
