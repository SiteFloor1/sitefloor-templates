// @ts-check
/**
 * DEMO ONLY. Example film prices for the detailing demo, one per package and car, as the studio's sheet would give
 * them. The page says they're examples. Never bundled into client sites.
 */
import { filmPricesFromCsv } from "../kits/detailing/lib/packages.js";

const ROWS = [
  "package,body,price,days",
  "front-end,hatch,795,1", "front-end,saloon,895,1", "front-end,suv,995,1",
  "full-front,hatch,1795,2", "full-front,saloon,1995,2", "full-front,suv,2295,3",
  "track,hatch,2395,3", "track,saloon,2650,3", "track,suv,2950,3",
  "whole,hatch,4950,6", "whole,saloon,5750,6", "whole,suv,6750,7",
];

/** @type {import("../kits/detailing/features/protection-3d/protection-3d.js").FilmPriceProvider} */
export const simulatedFilmPrices = {
  async load(ctx) {
    const cfg = /** @type {any} */ (ctx.data).detailing.film;
    return filmPricesFromCsv(ROWS.join("\n"), cfg.packages, Object.keys(cfg.bodies));
  },
};
