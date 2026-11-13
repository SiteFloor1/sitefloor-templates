// @ts-check
/**
 * Today's bouquets: the range switch, what's left of each bouquet (from the florist's Sheet when there is one; a Sheet
 * that fails keeps what was built) and the order, written out for WhatsApp or copied for an Instagram DM.
 */
import { bouquetStatus, igDm, countsFresh } from "../../lib/social.js";
import { orderMessage, cardText } from "../../lib/orders.js";
import { startStudio } from "../../lib/studio.js";
import { shortDate } from "../../lib/delivery.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const B = /** @type {any} */ (ctx.data).florist?.bouquets;
  const feed = root.querySelector("#tb-feed");
  if (!B || !feed) throw new Error("today's bouquets: markup or data missing");

  // --- Ranges: show one at a time; the first of the range sits beside the pinned post.
  const tabs = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-tb-range]")]);
  const posts = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-tb-item]")]);
  const show = (/** @type {string} */ id) => {
    let n = 0;
    for (const p of posts) {
      const mine = p.dataset.tbIn === id && p.dataset.tbHidden !== "1";
      p.hidden = !mine;
      if (mine) n++;
      p.classList.toggle("tb-lead", mine && n === 1);
      p.dataset.pos = mine ? String(n) : "";
    }
    for (const t of tabs) t.setAttribute("aria-selected", String(t.dataset.tbRange === id));
    feed.setAttribute("aria-labelledby", `tb-tab-${id}`);
  };
  const current = () => tabs.find((t) => t.getAttribute("aria-selected") === "true")?.dataset.tbRange ?? tabs[0]?.dataset.tbRange;
  for (const t of tabs) {
    t.addEventListener("click", () => show(/** @type {string} */ (t.dataset.tbRange)));
    t.addEventListener("keydown", (e) => {
      const i = tabs.indexOf(t), n = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : -1;
      if (n < 0 || n >= tabs.length) return;
      e.preventDefault(); tabs[n].focus(); tabs[n].click();
    });
  }
  if (tabs.length) show(/** @type {string} */ (current()));

  // --- The pinned clip: muted, slow, pausable; it stays on its still when motion is reduced.
  const clip = /** @type {HTMLVideoElement|null} */ (root.querySelector("[data-tb-clip]"));
  const pause = root.querySelector("[data-tb-pause]");
  if (clip && pause) {
    clip.playbackRate = 0.8;
    const setBtn = () => { pause.setAttribute("aria-label", clip.paused ? "Play the clip" : "Pause the clip"); pause.innerHTML = `<span aria-hidden="true">${clip.paused ? "▶" : "II"}</span>`; };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { clip.removeAttribute("autoplay"); clip.pause(); }
    pause.addEventListener("click", () => { if (clip.paused) void clip.play().catch(() => {}); else clip.pause(); });
    clip.addEventListener("play", setBtn); clip.addEventListener("pause", setBtn); setBtn();
  }

  // --- What's left, from the Sheet (rows "bouquet,<id>,few:2" / "sold" / "hidden", and "bouquet,updated,<time>").
  // Fails closed: a count or "sold" is only shown while the Sheet's update time is recent.
  const paintStatus = (/** @type {Record<string, string>} */ sheet) => {
    const fresh = countsFresh(sheet.updated, B.staleMinutes, Date.now(), /** @type {any} */ (ctx.data).florist.timeZone);
    for (const p of posts) {
      const item = B.items.find((/** @type {any} */ x) => x.id === p.dataset.tbItem);
      if (!item) continue;
      const s = bouquetStatus(item, sheet[item.id], fresh);
      const label = p.querySelector("[data-tb-status]"), ask = /** @type {HTMLElement|null} */ (p.querySelector("[data-tb-ask]"));
      if (label) { label.textContent = s.label; /** @type {HTMLElement} */ (label).hidden = !s.label; }
      p.classList.toggle("is-sold", s.state === "sold");
      if (ask) ask.hidden = s.state === "sold";
      p.dataset.tbHidden = s.state === "hidden" ? "1" : "";
    }
    if (tabs.length) show(/** @type {string} */ (current()));
    else for (const p of posts) p.hidden = p.dataset.tbHidden === "1";
  };
  startStudio(ctx);
  /** @type {Record<string, string>|null} */ let last = null;
  ctx.watch("studio", (s) => { if (s?.ok) { const rows = s.bouquet ?? {}; last = rows; paintStatus(rows); } });
  ctx.everyMinute(() => { if (last) paintStatus(last); }); // a count that goes stale while the page is open stops showing

  // --- The order: the day, the card, add-ons, written out as the florist will read it.
  const dlg = /** @type {HTMLDialogElement|null} */ (root.querySelector("[data-tb-order]"));
  if (!dlg || typeof dlg.showModal !== "function") return; // no dialog support: each Ask keeps its WhatsApp link
  const $ = (/** @type {string} */ s) => /** @type {any} */ (dlg.querySelector(s));
  const day = $("[data-tb-o-day]"), card = $("[data-tb-o-card]"), left = $("[data-tb-o-left]"), msg = $("[data-tb-o-msg]");
  const wa = $("[data-tb-o-wa]"), ig = $("[data-tb-o-ig]"), say = $("[data-tb-o-say]");
  const adds = /** @type {HTMLInputElement[]} */ ([...dlg.querySelectorAll("[data-tb-o-add]")]);
  const today = ctx.now().date;
  day.min = today;
  /** @type {{ name: string, price: number, from: boolean }} */ let chosen = { name: "", price: 0, from: false };
  const text = () => {
    const c = card ? cardText(card.value, B.card?.max ?? 200) : null;
    if (left && c) left.textContent = c.left >= 0 ? `${c.left} left` : "";
    return orderMessage({
      lead: B.message, item: `${chosen.name} (${chosen.from ? "from " : ""}£${chosen.price})`,
      extras: adds.filter((a) => a.checked).map((a) => ({ name: /** @type {string} */ (a.dataset.name), price: Number(a.dataset.price) })),
      when: day.value ? (day.value === today ? "today" : shortDate(day.value)) : undefined,
      card: c?.text,
    });
  };
  const refresh = () => { const t = text(); msg.textContent = t; wa.href = ctx.waHref(t); };
  dlg.addEventListener("input", refresh);
  dlg.addEventListener("change", refresh);
  for (const a of root.querySelectorAll("[data-tb-ask]")) {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const el = /** @type {HTMLElement} */ (a);
      chosen = { name: /** @type {string} */ (el.dataset.tbName), price: Number(el.dataset.tbPrice), from: el.hasAttribute("data-tb-from") };
      $("[data-tb-o-name]").textContent = chosen.name;
      $("[data-tb-o-price]").textContent = `${chosen.from ? "From " : ""}£${chosen.price}`;
      if (say) say.textContent = "Instagram can't carry the words, so we copy them: paste them into the DM.";
      refresh();
      dlg.showModal();
    });
  }
  const dm = B.instagram ? igDm(B.instagram) : null;
  if (ig && dm) ig.addEventListener("click", async () => {
    const t = text();
    try {
      await navigator.clipboard.writeText(t);
      say.textContent = "Copied. Paste it into the DM that's opening now.";
      window.open(dm, "_blank", "noopener");
    } catch {
      say.textContent = "Couldn't copy here: select the words above and copy them, then message us on Instagram.";
      const r = document.createRange(); r.selectNodeContents(msg); const s = getSelection(); s?.removeAllRanges(); s?.addRange(r);
    }
  });
}
