// @ts-check
/** Ready by: the months from next month on; the day to get in touch, worked back from the studio's own weeks. */
import { readyMonths, startBy, startByText } from "../../lib/garden.js";
import { ukDate } from "../../../../core/lib/diary.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).startBy;
  const select = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-sb-month]"));
  const out = root.querySelector("[data-sb-out]"), send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-sb-send]"));
  if (!cfg || !select || !out || !send) throw new Error("calendar-page markup missing");
  const today = ctx.now().date;
  const months = readyMonths(today);
  select.innerHTML = "";
  months.forEach((m, i) => select.add(new Option(m.label, String(i), false, i === 5)));
  const update = () => {
    const m = months[Number(select.value)];
    const r = startBy(m, cfg, today);
    out.textContent = r.late
      ? `${m.label} is sooner than our usual ${r.weeks} weeks from first meeting to finished garden. Ask us: sometimes a smaller garden or an earlier slot makes it possible.`
      : `Get in touch by ${ukDate(r.talkBy)}. That leaves our usual ${r.weeks} weeks for design, the wait for a build slot, and the build.`;
    send.href = ctx.bookHref(startByText(cfg.message, { ready: m.label, talkBy: r.talkBy, late: r.late }));
  };
  select.addEventListener("change", update);
  update();
}
