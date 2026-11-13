// @ts-check
/**
 * DEMO ONLY. A simulated "your house, this week": the example code is at its third stage, updated yesterday afternoon,
 * with a line about the week and a photograph from the demo's own folder; any other code is "not found". Never bundled
 * into client sites.
 */
import { cleanCode } from "../kits/construction/lib/progress.js";

export const simulatedProgress = {
  /** @param {any} ctx @param {string} code */
  async load(ctx, code) {
    const cfg = ctx.data.build.progress;
    if (code !== cleanCode(cfg.example ?? "")) return { ok: false, reason: "unknown" };
    const stage = Math.min(2, cfg.stages.length - 1);
    return {
      ok: true, stage, updatedAt: Date.now() - 22 * 3_600_000,
      done: "The roof structure is up.",
      next: "Roofer on site Monday. The drive is clear except Tuesday morning.",
      photo: new URL("img/demo-week.webp", document.baseURI).href,
    };
  },
};
