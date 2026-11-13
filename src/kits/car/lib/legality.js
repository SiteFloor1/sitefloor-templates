// @ts-check
/**
 * UK window tint rules, from gov.uk "Tinted vehicle window rules" (checked 26 Oct 2026):
 * https://www.gov.uk/tinted-vehicle-window-rules
 *
 *   Vehicles first used on or after 1 April 1985: the windscreen must let at least 75% of light
 *   through and the front side windows at least 70%. Vehicles first used before 1 April 1985:
 *   both at least 70%. There are no rules for the rear windscreen or rear passenger windows.
 *
 * The rule is about the light through the glass as fitted, so a shade here is always the studio's
 * own measurement on the car ("light"), never a film's rating on its own.
 */

export const RULES_URL = "https://www.gov.uk/tinted-vehicle-window-rules";
export const RULES_CHECKED = "26 October 2026";

/**
 * Lights, from the MOT inspection manual for cars, section 4 (checked 26 Oct 2026): a headlamp with "product on
 * the lens or light source which obviously reduces light intensity or changes emitted colour" is a major defect
 * (4.1.4); the same on a rear position lamp is a defect (4.2.3), and a stop lamp with significantly reduced light
 * is a major defect (4.3.3).
 */
export const LAMPS_URL = "https://www.gov.uk/guidance/mot-inspection-manual-for-private-passenger-and-light-commercial-vehicles/4-lamps-reflectors-and-electrical-equipment";

/** @typedef {"windscreen"|"fronts"|"rear"} Window */
/** @typedef {{ id: string, name: string, light: number }} Shade */

export const WINDOWS = /** @type {const} */ (["windscreen", "fronts", "rear"]);
export const WINDOW_NAMES = { windscreen: "Windscreen", fronts: "Front side windows", rear: "Rear windows" };

/**
 * Least light a window must let through, or null when the law sets no minimum.
 * @param {Window} window @param {boolean} before1985 first used before 1 April 1985
 * @returns {number|null}
 */
export function minimumLight(window, before1985) {
  if (window === "rear") return null;
  if (window === "fronts") return 70;
  return before1985 ? 70 : 75;
}

/**
 * Whether a shade is legal on a window. No film at all is always legal here.
 * @param {Window} window @param {Shade|null|undefined} shade @param {boolean} before1985
 */
export function isLegal(window, shade, before1985) {
  const min = minimumLight(window, before1985);
  return !shade || min === null || shade.light >= min;
}

/**
 * The rule for a window in one plain sentence.
 * @param {Window} window @param {boolean} before1985
 */
export function ruleText(window, before1985) {
  const min = minimumLight(window, before1985);
  if (min === null) return "No legal limit on rear windows.";
  return `${WINDOW_NAMES[window]} must let at least ${min}% of light through.`;
}

/**
 * Darkest legal shade on a window from the studio's range, or null if none qualifies.
 * @param {Window} window @param {Shade[]} shades @param {boolean} before1985
 * @returns {Shade|null}
 */
export function darkestLegal(window, shades, before1985) {
  const ok = shades.filter((s) => isLegal(window, s, before1985));
  return ok.length ? ok.reduce((a, b) => (b.light < a.light ? b : a)) : null;
}
