// @ts-check
/**
 * DEMO ONLY. Simulated private pages for the florist demos: the example order starts "being made" and moves on a
 * stage every 20 seconds with stock photos and notes (the demo's own, from orderTracker.demo, when it sets them), the
 * example business client has this week's flowers, and the drop's count is the demo's own number, as if just updated.
 * Any other reference is "not found". Never bundled into client sites.
 */
import { cleanRef } from "../kits/florist/lib/track.js";

const STEP_MS = 20_000;
const opened = Date.now();
const NOTES = [
  "Your flowers are on the bench now. Coral roses, blush carnations and copper calla, as ordered.",
  "Wrapped in blush paper with a peach ribbon, card tucked in. Here they are before they left.",
  "Delivered by hand and left with the person you sent them to.",
];

/** @type {import("../kits/florist/features/follow-order/sheet-provider.js").FloristProvider} */
export const simulatedFlorist = {
  every: 5000,
  async order(ctx, ref) {
    const t = ctx.data.florist.tracker;
    if (ref !== cleanRef(t.example ?? "")) return { ok: false, reason: "unknown" };
    const n = t.stages.length;
    const k = Math.min(n - 1, Math.floor((Date.now() - opened) / STEP_MS));
    const own = t.demo, notes = own?.notes ?? NOTES;
    return { ok: true, stage: k, updatedAt: Date.now() - (k === 0 ? 9 * 60_000 : 30_000), note: notes[Math.min(k, notes.length - 1)], photo: k >= 1 ? (own?.photo ?? "img/b-coral.webp") : "" };
  },
  async drop(ctx) {
    const d = ctx.data.florist.drop;
    return { left: d?.left ?? null, updated: Date.now() };
  },
  async account(ctx, code) {
    if (code !== cleanRef(ctx.data.florist.accounts.example ?? "")) return { ok: false, reason: "unknown" };
    return {
      ok: true, name: "The Gilbert, Pimlico", weekOf: "This week", next: "Tuesday morning, before the lunch service",
      pieces: [
        { place: "Lobby", what: "Two urns of coral garden roses, copper calla and grasses" },
        { place: "Restaurant", what: "Twelve bud vases: blush carnations and a single rose each" },
        { place: "Reception desk", what: "A low bowl of hypericum and eucalyptus" },
      ],
      note: "The roses are English this week, so they'll open fully by Friday.", photo: "img/contract-window.webp",
    };
  },
};
