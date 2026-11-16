// @ts-check
/** Before I arrive: the list to the bridal party, through the phone's share sheet. */
import { shareButton } from "../../partials/share.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const btn = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-rd-share]"));
  if (btn) shareButton(btn);
}
