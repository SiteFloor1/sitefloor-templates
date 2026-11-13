// @ts-check
/** Can you make this one? The link (TikTok, Instagram or Pinterest only), the budget and the day, as one message. */
import { postLink, makeThisMessage } from "../../lib/social.js";
import { shortDate } from "../../lib/delivery.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const M = /** @type {any} */ (ctx.data).florist?.makeThis;
  const form = root.querySelector("[data-mk-form]");
  const link = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-mk-link]"));
  const day = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-mk-day]"));
  const msg = root.querySelector("[data-mk-msg]"), why = root.querySelector("[data-mk-why]");
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-mk-send]"));
  if (!M || !form || !link || !day || !msg || !why || !send) throw new Error("make this: markup or data missing");
  day.min = ctx.now().date;
  const refresh = () => {
    const raw = link.value.trim();
    const post = postLink(raw);
    const budget = /** @type {HTMLInputElement|null} */ (form.querySelector('input[name="mk-budget"]:checked'))?.value;
    const when = day.value ? shortDate(day.value) : undefined;
    why.textContent = raw && !post ? "That link isn't from TikTok, Instagram or Pinterest." : "";
    if (!post) { msg.textContent = "Paste a link from TikTok, Instagram or Pinterest."; msg.classList.add("is-wait"); send.setAttribute("aria-disabled", "true"); send.href = ctx.waHref(M.message); return; }
    const text = makeThisMessage({ lead: M.message, link: post.href, budget, when });
    msg.textContent = text; msg.classList.remove("is-wait");
    send.removeAttribute("aria-disabled"); send.href = ctx.waHref(text);
  };
  form.addEventListener("input", refresh);
  form.addEventListener("change", refresh);
  send.addEventListener("click", (e) => { if (send.getAttribute("aria-disabled") === "true") { e.preventDefault(); link.focus(); why.textContent = "Paste the link first."; } });
  refresh();
}
