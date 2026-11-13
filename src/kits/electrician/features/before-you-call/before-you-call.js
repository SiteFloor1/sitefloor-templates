// @ts-check
/** Before you call: the answers in one WhatsApp message. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).beforeYouCall;
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-bc-form]"));
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-bc-send]"));
  if (!cfg || !form || !send) throw new Error("before-you-call markup missing");
  const update = () => {
    const v = (/** @type {string} */ s) => /** @type {HTMLInputElement|null} */ (form.querySelector(s))?.value.trim() ?? "";
    const goals = [...form.querySelectorAll("input[name=bc-goal]:checked")].map((i) => /** @type {HTMLInputElement} */ (i).value);
    const lines = [cfg.message, "", `The house: ${v("[data-bc-age]")}`, v("[data-bc-rooms]") && `Rooms: ${v("[data-bc-rooms]")}`, goals.length && `What we'd like: ${goals.join(", ")}`, v("[data-bc-note]") && `Also: ${v("[data-bc-note]")}`, "", "I'll attach a photo of the fuse board."];
    send.href = ctx.waHref(lines.filter((l) => l !== 0 && l !== false).join("\n").replace(/\n{3,}/g, "\n\n"));
  };
  form.addEventListener("input", update);
  form.addEventListener("change", update);
  update();
}
