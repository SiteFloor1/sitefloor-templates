// @ts-check
/** The dessert menu on the home page: filters and tonight's marks (see filter-ui.js). */
import { menuUi } from "./filter-ui.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  menuUi(root, ctx);
}
