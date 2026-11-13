// @ts-check
/**
 * The shortlist: "Keep" on any gown adds it; the bar sends the list on WhatsApp so the gowns are ready, and gives a
 * link (gowns.html#shortlist=a.b.c) that opens the same list on her mother's phone. The phone remembers the list
 * (a convenience only); the appointment request picks it up on any page. A list opened from a shared link is a
 * separate view: it is never saved over the phone's own list, unless the visitor chooses "Keep these on my phone"
 * (which adds them to it).
 */
import { shortlistHash, shortlistFromHash, shortlistText } from "../../lib/gowns.js";

const KEY = "sf-shortlist";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data);
  const gowns = /** @type {{ id: string, name: string, houseName: string }[]} */ (data.gowns?.items ?? []);
  const q = (/** @type {string} */ s) => /** @type {HTMLElement|null} */ (root.querySelector(s));
  const count = q("[data-sl-count]"), word = q("[data-sl-word]"), names = q("[data-sl-names]"), shared = q("[data-sl-shared]");
  const send = /** @type {HTMLAnchorElement|null} */ (q("[data-sl-send]")), copy = q("[data-sl-copy]"), clear = q("[data-sl-clear]");
  const linkBox = q("[data-sl-linkbox]"), link = q("[data-sl-link]"), adopt = q("[data-sl-adopt]"), mineBtn = q("[data-sl-mine]");
  if (!data.shortlist || !count || !word || !names || !shared || !send || !copy || !clear || !linkBox || !link || !adopt || !mineBtn) throw new Error("shortlist markup missing");
  const known = gowns.map((g) => g.id);
  const keeps = /** @type {HTMLButtonElement[]} */ ([...document.querySelectorAll("[data-keep]")]);

  /** The phone's own saved list. @returns {string[]} */
  const saved = () => {
    try { const v = JSON.parse(localStorage.getItem(KEY) ?? "[]"); return Array.isArray(v) ? v.filter((id) => known.includes(id)) : []; } catch { return []; }
  };
  /** @type {string[]} */ let mine = saved();
  /** @type {string[]|null} */ let fromLink = shortlistFromHash(location.hash, known);
  if (!fromLink.length) fromLink = null;
  const current = () => fromLink ?? mine;
  const url = () => `${location.origin}${location.pathname}${shortlistHash(current())}`;

  const render = () => {
    const ids = current();
    const kept = ids.map((id) => /** @type {{ id: string, name: string, houseName: string }} */ (gowns.find((g) => g.id === id)));
    count.textContent = String(kept.length);
    word.textContent = kept.length === 1 ? "gown" : "gowns";
    names.textContent = kept.map((g) => g.name).join(" · ");
    send.href = ctx.bookHref(shortlistText(data.shortlist.message, kept, url()));
    for (const b of keeps) b.setAttribute("aria-pressed", String(ids.includes(b.dataset.keep ?? "")));
    link.textContent = url();
    shared.hidden = !fromLink;
    adopt.hidden = !fromLink;
    mineBtn.hidden = !fromLink || !mine.length;
    root.hidden = !kept.length && !(fromLink && mine.length);
    // Only the phone's own list is saved, and only that list goes with an appointment request.
    if (!fromLink) {
      try { localStorage.setItem(KEY, JSON.stringify(mine)); } catch { /* storage off */ }
      ctx.share("shortlist", kept.map((g) => g.name));
    }
  };
  const toggle = (/** @type {string[]} */ list, /** @type {string} */ id) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  for (const b of keeps) b.addEventListener("click", () => {
    const id = b.dataset.keep ?? "";
    if (fromLink) fromLink = toggle(fromLink, id); else mine = toggle(mine, id);
    render();
  });
  adopt.addEventListener("click", () => {
    mine = [...mine, ...(fromLink ?? []).filter((id) => !mine.includes(id))];
    fromLink = null; render();
  });
  mineBtn.addEventListener("click", () => { fromLink = null; render(); });
  clear.addEventListener("click", () => { if (fromLink) fromLink = null; else mine = []; linkBox.hidden = true; render(); });
  copy.addEventListener("click", async () => {
    linkBox.hidden = false;
    try { await navigator.clipboard.writeText(url()); copy.textContent = "Link copied"; }
    catch { const r = document.createRange(); r.selectNodeContents(link); getSelection()?.removeAllRanges(); getSelection()?.addRange(r); copy.textContent = "Copy the link above"; }
    setTimeout(() => { copy.textContent = "Copy the link"; }, 2500);
  });
  render();
}
