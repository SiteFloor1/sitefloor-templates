// @ts-check
/**
 * Posted boxes: the next posting the order makes (the shop's posting days, hours, closures and bank holidays), the
 * total with posting, and the order on WhatsApp.
 */
import { nextPost } from "../../lib/post.js";
import { longDay } from "../../lib/cake.js";
import { formatTime12, toMinutes } from "../../../../core/lib/hours.js";
import { gbp } from "../../../../core/lib/text.js";

/** @param {string} day @param {string} today */
const dayWord = (day, today) => (day === today ? "today" : longDay(day).split(" ")[0]);

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const d = /** @type {any} */ (ctx.data);
  const q = (/** @type {string} */ s) => /** @type {any} */ (root.querySelector(s));
  const boxes = /** @type {HTMLInputElement[]} */ ([...root.querySelectorAll('[name="pb-box"]')]);
  const render = () => {
    const now = ctx.now(), n = nextPost(d.post, now, { hours: d.hours, region: d.post.region });
    q("[data-pb-when]").textContent = n ? `Order by ${formatTime12(toMinutes(n.orderBy.time))} ${dayWord(n.orderBy.date, now.date)}, usually with them ${longDay(n.arrives).split(" ")[0]}.` : "Message us for the next posting day.";
    const b = boxes.find((x) => x.checked) ?? boxes[0];
    const total = Number(b.dataset.price) + d.post.price;
    q("[data-pb-total]").textContent = gbp(total);
    const card = q("[data-pb-card]").value.trim();
    q("[data-pb-send]").href = ctx.waHref([
      `Hi ${d.name}, I'd like ${b.dataset.name?.replace(/^A /, "a ")} posted:`,
      `For: ${q("[data-pb-to]").value.trim() || "(name)"}`,
      `Address: ${q("[data-pb-addr]").value.trim().replace(/\s*\n\s*/g, ", ") || "(address)"}`,
      ...(card ? [`Card: "${card}"`] : []),
      `Price on your site: ${gbp(total)} with posting`,
      ...(n ? [`To go out ${longDay(n.sends)}, usually with them ${longDay(n.arrives)}.`] : []),
      "Please confirm.",
    ].join("\n"));
  };
  root.addEventListener("input", render);
  root.addEventListener("change", render);
  ctx.everyMinute(render);
  render();
  root.dataset.ready = "true";
}
