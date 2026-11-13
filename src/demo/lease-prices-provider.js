// @ts-check
/** DEMO ONLY. Example lease-return prices for the detailing demo (dents left unpriced, to show "Ask us"). Never bundled into client sites. */
import { leasePricesFromCsv } from "../kits/detailing/lib/lease.js";

const ROWS = ["item,price", "scratches,95", "chips,65", "bumpers,140", "wheels,85", "lights,70", "stains,110"];

/** @type {import("../kits/detailing/features/lease-return/lease-return.js").LeaseProvider} */
export const simulatedLeasePrices = { async load() { return leasePricesFromCsv(ROWS.join("\n")); } };
