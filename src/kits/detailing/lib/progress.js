// @ts-check
/**
 * Your car, in the bay: one row per car in the studio's published sheet, found by the code on the booking text.
 * The sheet holds a short description of the car (never the owner's name or the registration), the work, the stage
 * it has reached, the studio's note, a photo link and the handover. A stale sheet or an unknown code shows nothing
 * rather than a wrong stage.
 */
import { parseCsv, parseSheetTime } from "../../../core/lib/sheet.js";

/** @typedef {{ id: string, name: string }} Stage */
/** @typedef {{ code: string, car: string, work: string, stage: string, stageName: string, note: string, photo: string, handover: string, updated: number }} Car */
/** @typedef {{ ok: true, car: Car } | { ok: false, reason: "unknown"|"stale"|"unreadable" }} Lookup */

/** Codes as the booking text gives them: letters, numbers and one dash, any case. @param {unknown} v */
export const normaliseCode = (v) => String(v ?? "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 16);

/** A photo link the page may show: https only, nothing else. @param {string} v */
const safePhoto = (v) => (/^https:\/\/[^\s"'<>]+$/.test(v.trim()) ? v.trim() : "");

/**
 * Finds one car by its code.
 * @param {string} text @param {string} code @param {number} nowMs @param {string} timeZone @param {number} staleAfterHours
 * @param {Stage[]} stages the studio's stages, in order
 * @returns {Lookup}
 */
export function carFromCsv(text, code, nowMs, timeZone, staleAfterHours, stages) {
  const rows = parseCsv(text);
  if (rows.length < 2) return { ok: false, reason: "unreadable" };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const col = (/** @type {string} */ k) => head.indexOf(k);
  const need = ["code", "stage", "updated_at"];
  if (need.some((k) => col(k) < 0)) return { ok: false, reason: "unreadable" };
  const want = normaliseCode(code);
  if (!want) return { ok: false, reason: "unknown" };
  const row = rows.slice(1).find((r) => normaliseCode(r[col("code")]) === want);
  if (!row) return { ok: false, reason: "unknown" };
  const cell = (/** @type {string} */ k) => (col(k) < 0 ? "" : String(row[col(k)] ?? "").trim());
  const updated = parseSheetTime(cell("updated_at"), timeZone);
  if (Number.isNaN(updated)) return { ok: false, reason: "unreadable" };
  if (nowMs - updated > staleAfterHours * 3600_000) return { ok: false, reason: "stale" };
  const stage = stages.find((s) => s.id === cell("stage").toLowerCase());
  if (!stage) return { ok: false, reason: "unreadable" };
  return {
    ok: true,
    car: {
      code: want, car: cell("car").slice(0, 60), work: cell("work").slice(0, 80), stage: stage.id,
      stageName: cell("stage_name").slice(0, 30) || stage.name, note: cell("note").slice(0, 280),
      photo: safePhoto(cell("photo")), handover: cell("handover").slice(0, 60), updated,
    },
  };
}

/**
 * Each stage's state for the rail: done before the car's stage, now at it, next after it.
 * @param {Stage[]} stages @param {string} current @param {string} [currentName] the sheet's own name for this car's stage
 * @returns {(Stage & { state: "done"|"now"|"next" })[]}
 */
export function stageStates(stages, current, currentName) {
  const at = stages.findIndex((s) => s.id === current);
  return stages.map((s, i) => ({ ...s, name: i === at && currentName ? currentName : s.name, state: i < at ? "done" : i === at ? "now" : "next" }));
}

/** "Updated 40 minutes ago", "Updated 3 hours ago", "Updated yesterday". @param {number} updated @param {number} nowMs */
export function updatedAgo(updated, nowMs) {
  const m = Math.max(0, Math.round((nowMs - updated) / 60_000));
  if (m < 2) return "Updated just now";
  if (m < 60) return `Updated ${m} minutes ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `Updated ${h} ${h === 1 ? "hour" : "hours"} ago`;
  return h < 48 ? "Updated yesterday" : `Updated ${Math.round(h / 24)} days ago`;
}
