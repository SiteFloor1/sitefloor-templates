// @ts-check
/**
 * DEMO ONLY. A simulated proposal for "Your proposal, by code": the example code opens the home set of design visuals,
 * a Saturday about four months from today, the first room in the list, twenty guests at one long table, updated two
 * days ago; any other code is "not found". Never bundled into client sites.
 */
import { addDays, weekday, cleanCode } from "../kits/events/lib/events.js";

export const simulatedProposal = {
  /** @param {any} ctx @param {string} code */
  async load(ctx, code) {
    const cfg = ctx.data.events;
    if (code !== cleanCode(cfg.proposal.example ?? "")) return { ok: false, reason: "unknown" };
    const today = ctx.now().date;
    let date = addDays(today, 120);
    while (weekday(date) !== "sat") date = addDays(date, 1);
    return { ok: true, visuals: cfg.proposal.sets[0], room: cfg.roomPlan?.[0]?.id ?? null, layout: "long", guests: 20, date, updated: addDays(today, -2) };
  },
};
