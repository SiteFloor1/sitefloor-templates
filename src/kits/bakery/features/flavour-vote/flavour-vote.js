// @ts-check
/**
 * The flavour vote: shows each flavour's share of this week's answers (from the Form's results sheet, or the demo's
 * simulated count), and after a visitor picks one, a "my vote" card they can keep or send on. The vote itself is cast
 * on the shop's Google Form, so the card never says it has been counted.
 */
import { voteShares } from "../../lib/vote.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const v = /** @type {any} */ (ctx.data).vote;
  const card = /** @type {HTMLElement} */ (root.querySelector("[data-fv-card]"));
  const mine = /** @type {HTMLElement} */ (root.querySelector("[data-fv-mine]"));
  const send = /** @type {HTMLAnchorElement} */ (root.querySelector("[data-fv-send]"));
  const total = /** @type {HTMLElement} */ (root.querySelector("[data-fv-total]"));
  const key = `sf-vote-${v.closes}`;
  const show = (/** @type {string} */ id) => {
    const c = v.candidates.find((/** @type {any} */ x) => x.id === id);
    if (!c) return;
    mine.textContent = c.name;
    send.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(`My vote: ${c.name}. ${ctx.data.name}, ${location.origin}${location.pathname}#vote`)}`;
    card.hidden = false;
    for (const li of root.querySelectorAll("[data-fv]")) li.classList.toggle("is-mine", /** @type {HTMLElement} */ (li).dataset.fv === id);
  };
  root.addEventListener("click", (e) => {
    const go = /** @type {HTMLElement|null} */ (/** @type {HTMLElement} */ (e.target).closest("[data-fv-go]"));
    if (!go) return;
    const id = /** @type {HTMLElement} */ (go.closest("[data-fv]")).dataset.fv ?? "";
    try { localStorage.setItem(key, id); } catch { /* private window: the card still shows */ }
    show(id);
  });
  try { const saved = localStorage.getItem(key); if (saved) show(saved); } catch { /* no storage */ }
  const provider = ctx.providers.vote;
  if (provider) provider.load(ctx).then((/** @type {import("../../lib/vote.js").Votes} */ r) => {
    if (!r.ok || !r.total) return;
    const { shares, leader } = voteShares(r.counts);
    for (const li of /** @type {NodeListOf<HTMLElement>} */ (root.querySelectorAll("[data-fv]"))) {
      const id = li.dataset.fv ?? "";
      /** @type {HTMLElement} */ (li.querySelector("[data-fv-bar]")).style.width = `${shares[id] ?? 0}%`;
      /** @type {HTMLElement} */ (li.querySelector("[data-fv-pc]")).textContent = `${shares[id] ?? 0}%`;
      /** @type {HTMLElement} */ (li.querySelector("[data-fv-share]")).hidden = false;
      li.classList.toggle("is-leading", id === leader);
    }
    total.textContent = `${r.total} vote${r.total === 1 ? "" : "s"} so far this week.`;
  }, () => {});
  root.dataset.ready = "true";
}
