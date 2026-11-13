// @ts-check
/**
 * DEMO ONLY. A simulated matter for "Your matter, by code": the example code is at the third stage, updated
 * yesterday; any other code is "not found". Never bundled into client sites.
 */
import { cleanMatterCode } from "../kits/law/lib/matter.js";

export const simulatedMatter = {
  /** @param {any} ctx @param {string} code */
  async load(ctx, code) {
    const cfg = ctx.data.matterCode;
    if (code !== cleanMatterCode(cfg.example ?? "")) return { ok: false, reason: "unknown" };
    return { ok: true, stage: Math.min(2, cfg.stages.length - 1), updatedAt: Date.now() - 26 * 3_600_000 };
  },
};
