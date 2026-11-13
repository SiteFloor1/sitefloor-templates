// @ts-check
/** Our day in yours: convert the firm's hours for each open day this week into the chosen time zone. */
import { hoursIn, addDaysYmd } from "../../lib/matter.js";
import { wallTimeToUtc } from "../../../../core/lib/hours.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const pick = /** @type {HTMLSelectElement|null} */ (root.querySelector("#yh-zone"));
  const days = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-yh-day]")]);
  if (!pick || !days.length) throw new Error("your hours markup missing");
  const firm = root.dataset.firmZone ?? "Europe/London";
  const own = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = ctx.now();
  const show = () => {
    const zone = pick.value || own;
    for (const d of days) {
      const ahead = (Number(d.dataset.yhDay) - now.weekday + 7) % 7;
      const ymd = addDaysYmd(now.date, ahead);
      const ranges = JSON.parse(d.dataset.ranges ?? "[]");
      /** @type {HTMLElement} */ (d.querySelector("[data-yh-time]")).textContent = zone === firm ? `${ranges.map((/** @type {string[]} */ r) => r.join("–")).join(", ")} London` : hoursIn(ranges, ymd, firm, zone, wallTimeToUtc);
    }
  };
  pick.addEventListener("change", show);
  show();
  root.setAttribute("data-ready", "");
}
