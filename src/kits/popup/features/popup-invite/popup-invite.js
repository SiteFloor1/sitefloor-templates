// @ts-check
/**
 * The invitation: when a time is chosen in timed entry, draws a card (the brand, the day, the time, the place) in the
 * look's own colours and type, to save as a picture, and a WhatsApp message to send. It is not a ticket and says so.
 */
import { fullDate, formatTime12, inviteText, slug } from "../../lib/popup.js";

/** @param {CanvasRenderingContext2D} g @param {string} text @param {number} y @param {string} font @param {string} colour */
const line = (g, text, y, font, colour) => { g.font = font; g.fillStyle = colour; g.fillText(text, 540, y, 900); };

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data);
  const canvas = /** @type {HTMLCanvasElement|null} */ (root.querySelector("[data-invite-card]"));
  const wa = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-invite-wa]"));
  const save = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-invite-save]"));
  if (!canvas || !wa || !save) throw new Error("invitation markup missing");
  ctx.watch("popupSlot", (/** @type {any} */ v) => {
    if (!v) return;
    const css = getComputedStyle(document.documentElement), tok = (/** @type {string} */ n, /** @type {string} */ f) => css.getPropertyValue(n).trim() || f;
    const bg = tok("--bg", "#ffffff"), ink = tok("--text", "#111111"), accent = tok("--accent-2", tok("--accent", "#806000")), quiet = tok("--muted", "#666666");
    const disp = tok("--font-display", "Georgia, serif"), body = tok("--font-body", "system-ui, sans-serif");
    const g = canvas.getContext("2d");
    if (!g) return;
    g.fillStyle = bg; g.fillRect(0, 0, 1080, 1350);
    g.strokeStyle = ink; g.lineWidth = 2; g.strokeRect(60, 60, 960, 1230); g.strokeRect(84, 84, 912, 1182);
    g.textAlign = "center"; g.textBaseline = "alphabetic";
    line(g, data.name, 300, `400 72px ${disp}`, ink);
    line(g, "You're invited", 400, `400 40px ${disp}`, quiet);
    line(g, fullDate(v.date), 600, `400 76px ${disp}`, ink);
    line(g, formatTime12(v.minutes), 720, `400 120px ${disp}`, accent);
    line(g, v.stop.place, 880, `400 46px ${disp}`, ink);
    line(g, `${v.stop.area} ${v.stop.postcode}`, 944, `400 34px ${body}`, quiet);
    line(g, "Not a ticket: everyone books their own time.", 1180, `400 30px ${body}`, quiet);
    // No number: WhatsApp asks who to send it to.
    wa.href = `https://wa.me/?text=${encodeURIComponent(inviteText(data.name, v.stop, v.date, v.minutes))}`;
    save.download = `${slug(data.name)}-invitation-${v.date}.png`;
    save.href = canvas.toDataURL("image/png");
    /** @type {HTMLElement} */ (root).hidden = false;
  });
}
