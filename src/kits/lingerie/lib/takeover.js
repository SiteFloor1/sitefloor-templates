// @ts-check
/**
 * Gift takeovers (Valentine's, Christmas): between its dates a takeover replaces the home page's opening. Its order-by
 * time (and, for a boutique, its collect-by time) are on the shop's wall clock; the phase says which applies now.
 */
import { activeSeason } from "../../../core/lib/seasons.js";
import { dropInstant } from "./drop.js";
import { formatTime12 } from "../../../core/lib/hours.js";

const DAY = 86_400_000;

/** Index of the takeover covering `today` (YYYY-MM-DD), the one that started last if two overlap; -1 if none.
 * @param {{ from: string, to: string }[]} list @param {string} today */
export function activeTakeover(list, today) {
  return activeSeason(list.map((t) => ({ from: t.from, to: t.to, name: "", banner: "" })), today);
}

/**
 * Where a takeover stands: "order" until its order-by time, then "collect" until its collect-by time (boutiques),
 * then "over". `daysLeft` counts whole days to order-by; `hoursLeft` the hours, rounded up.
 * @param {{ orderBy: string, collectBy?: string }} t @param {string} timeZone @param {number} nowMs
 */
export function takeoverPhase(t, timeZone, nowMs) {
  const order = dropInstant(t.orderBy, timeZone);
  const collect = t.collectBy ? dropInstant(t.collectBy, timeZone) : order;
  const phase = nowMs < order ? "order" : nowMs < collect ? "collect" : "over";
  const left = order - nowMs;
  return { phase, daysLeft: phase === "order" ? Math.floor(left / DAY) : 0, hoursLeft: phase === "order" ? Math.ceil(left / 3_600_000) : 0 };
}

/** "Thursday 11 February, 4pm" from "YYYY-MM-DDTHH:MM". @param {string} local */
export function wallLabel(local) {
  const [d, t] = local.split("T");
  const day = new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  const [h, m] = t.split(":").map(Number);
  return `${day}, ${formatTime12(h * 60 + m)}`;
}

/**
 * The line under a takeover's title for its phase.
 * @param {{ orderBy: string, collectBy?: string }} t @param {{ phase: string, daysLeft: number, hoursLeft: number }} s
 * @param {string} area where she collects (the boutique's area)
 */
export function takeoverLine(t, s, area) {
  const collect = t.collectBy ? ` Collect in ${area} until ${wallLabel(t.collectBy)}.` : "";
  if (s.phase === "order") {
    const when = s.hoursLeft <= 24 ? (s.hoursLeft <= 1 ? "Under an hour" : `${s.hoursLeft} hours`) : s.daysLeft === 1 ? "One day" : `${s.daysLeft} days`;
    return `${when} left to order for delivery: by ${wallLabel(t.orderBy)}.${collect}`;
  }
  if (s.phase === "collect") return `Delivery has closed.${collect}`;
  return "";
}
