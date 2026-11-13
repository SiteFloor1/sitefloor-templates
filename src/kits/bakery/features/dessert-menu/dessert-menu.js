// @ts-check
/** The menu page: filters and tonight's marks (see ../desserts/filter-ui.js). */
import { menuUi } from "../desserts/filter-ui.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  menuUi(root, ctx);
}
