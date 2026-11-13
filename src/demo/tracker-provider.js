// @ts-check
/**
 * DEMO ONLY. A simulated car in the studio for "Your car, live": the example code starts part-way through and moves
 * on a stage every 20 seconds, with stock photos and notes, so a visitor sees it update. Any other code is "not
 * found". Never bundled into client sites.
 */
import { cleanCode } from "../kits/car/lib/tracker.js";

const STEP_MS = 20_000;
const START = 2;
/** A note and a stock photo for each stage, by position. */
const SCENES = [
  { note: "Checked in. We've photographed the paint all round before we start.", photo: "img/tesla-model3.webp" },
  { note: "Washed, decontaminated and clayed so the film sits on clean paint.", photo: "img/foam-wash.webp" },
  { note: "Film's on the bonnet and wings; doing the bumper and lights now.", photo: "img/ppf-fitting.webp" },
  { note: "Edges sealed. It sits under the lights for a final check.", photo: "img/ppf-headlight.webp" },
  { note: "All done and looking great. Ready when you are.", photo: "img/polish.webp" },
];
const opened = Date.now();

/** @type {import("../kits/car/features/job-tracker/job-tracker.js").TrackerProvider} */
export const simulatedTracker = {
  every: 5000,
  async load(ctx, code) {
    const cfg = /** @type {any} */ (ctx.data).jobTracker;
    if (code !== cleanCode(cfg.example ?? "")) return { ok: false, reason: "unknown" };
    const n = cfg.stages.length;
    const k = Math.min(n - 1, START + Math.floor((Date.now() - opened) / STEP_MS));
    const scene = SCENES[Math.min(k, SCENES.length - 1)];
    return { ok: true, stage: k, updatedAt: Date.now() - (k === START ? 11 * 60_000 : 30_000), note: scene.note, photo: scene.photo };
  },
};
