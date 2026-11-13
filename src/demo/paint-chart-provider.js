// @ts-check
/** DEMO ONLY. An example paint chart for the detailing demo, in the demo's own words. Never bundled into client sites. */
import { paintChartFromCsv } from "../kits/detailing/lib/paint.js";

const ROWS = [
  "name,hex,finish",
  "Bay green,23473C,metallic", "Gloss black,0D0E10,solid", "Pearl white,E9E8E3,pearl", "Silver,A7ABAE,metallic",
  "Graphite,4A4D50,metallic", "Midnight blue,15213A,metallic", "Signal red,9E1B1E,solid", "Satin grey,6E7173,matte",
];

/** @type {{ load: (ctx: any) => Promise<import("../kits/detailing/lib/paint.js").Chart> }} */
export const simulatedPaintChart = { async load() { return paintChartFromCsv(ROWS.join("\n")); } };
