// @ts-check
/** The gardens page: the same choice of kinds as the home page's gardens. */
import { styleFilter } from "../gardens/gardens.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) { styleFilter(root); }
