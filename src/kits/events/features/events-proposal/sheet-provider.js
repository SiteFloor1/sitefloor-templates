// @ts-check
/** Your proposal, by code, for client sites: reads the agency's published sheet (CSV). Fails closed. */
import { proposalFromCsv } from "../../lib/events.js";

const TIMEOUT_MS = 6000;

export const sheetProposal = {
  /** @param {any} ctx @param {string} code */
  async load(ctx, code) {
    const cfg = ctx.data.events;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(cfg.proposal.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      if (!res.ok) return { ok: false, reason: "unreadable" };
      return proposalFromCsv(await res.text(), code, cfg.proposal.sets, (cfg.roomPlan ?? []).map((/** @type {any} */ r) => r.id), ctx.now().date, cfg.proposal.staleAfterDays);
    } catch {
      return { ok: false, reason: "unreadable" };
    } finally {
      clearTimeout(timer);
    }
  },
};
