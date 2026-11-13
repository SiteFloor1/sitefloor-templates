// @ts-check
/** LIVE dates: drop sessions that have ended since the build, and hand each one over as a calendar file. */
import { upcomingLives, liveIcs } from "../../lib/social.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const D = /** @type {any} */ (ctx.data).florist;
  const L = D?.live;
  if (!L) throw new Error("live dates: data missing");
  const now = ctx.now();
  const keep = new Set(upcomingLives(L.sessions, now).map((/** @type {any} */ s) => `${s.date}T${s.time}`));
  const items = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-lv-session]")]);
  for (const li of items) li.hidden = !keep.has(/** @type {string} */ (li.dataset.lvSession));
  if (items.every((li) => li.hidden)) { /** @type {HTMLElement} */ (root).hidden = true; return; }
  for (const li of items) {
    const btn = li.querySelector("[data-lv-cal]");
    const s = L.sessions.find((/** @type {any} */ x) => `${x.date}T${x.time}` === li.dataset.lvSession);
    if (!btn || !s) continue;
    btn.addEventListener("click", () => {
      const ics = liveIcs({ ...s, url: s.where === "TikTok" ? L.links.tiktok : L.links.instagram, business: ctx.data.name, timeZone: D.timeZone, stamp: new Date(), uid: `live-${s.date}-${s.time.replace(":", "")}@${location.hostname || "sitefloor"}` });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
      a.download = `live-${s.date}.ics`;
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      btn.textContent = "Added: open the file to save it";
    });
  }
}
