// @ts-check
/**
 * The box: pick a size, tap pieces into its places (tap a place to take one out), tie the ribbon when it's full, write
 * the card, and order it for collection, or as a gift with a link for whoever collects it. Sold-out pieces (from
 * today's sheet) can't go in, and come out if they sell out while the box is open. On the gift page the same module
 * reads the box back from the link and shows it.
 */
import { GRIDS, boxQuote, boxText, giftEncode, giftDecode, giftShareText } from "../../lib/box.js";
import { collectionDays, collectionSlots, slotLabel } from "../../lib/orders.js";
import { stateOf } from "../../lib/bakes.js";
import { startBakes } from "../bakes/sheet-provider.js";
import { allergenName } from "../../../../core/lib/allergens.js";
import { gbp } from "../../../../core/lib/text.js";
import { longDay } from "../../lib/cake.js";

/** @typedef {{ id: string, name: string, allergens: string[], src: string }} Piece */

/** Draws a box's places, filled from `places`. @param {HTMLElement} list @param {number} n @param {(Piece|null)[]} places @param {boolean} buttons */
function drawPlaces(list, n, places, buttons) {
  const [cols, rows] = GRIDS[n] ?? [n, 1];
  /** @type {HTMLElement} */ (list.parentElement).style.setProperty("--cols", String(cols));
  /** @type {HTMLElement} */ (list.parentElement).style.setProperty("--rows", String(rows));
  if (list.children.length !== n) {
    list.replaceChildren(...Array.from({ length: n }, (_, i) => {
      const li = document.createElement("li");
      const el = document.createElement(buttons ? "button" : "span");
      if (el instanceof HTMLButtonElement) el.type = "button";
      el.className = "bx-place";
      el.dataset.bxSlot = String(i);
      el.append(Object.assign(document.createElement("img"), { alt: "", decoding: "async" }));
      li.append(el);
      return li;
    }));
  }
  [...list.querySelectorAll(".bx-place")].forEach((el, i) => {
    const p = places[i], img = /** @type {HTMLImageElement} */ (el.querySelector("img"));
    el.classList.toggle("is-full", Boolean(p));
    if (p) { if (img.src !== p.src) img.src = p.src; img.hidden = false; } else { img.removeAttribute("src"); img.hidden = true; }
    if (buttons) el.setAttribute("aria-label", p ? `${p.name}, place ${i + 1} of ${n}: take it out` : `Place ${i + 1} of ${n}, empty`);
  });
}

/** The gift page: the box someone sent, from the link. @param {HTMLElement} root */
function giftView(root) {
  const cat = new Map([...root.querySelectorAll("[data-bx-catalog] li")].map((li) => {
    const e = /** @type {HTMLElement} */ (li);
    return [e.dataset.id ?? "", { id: e.dataset.id ?? "", name: e.dataset.name ?? "", allergens: [], src: new URL(e.dataset.src ?? "", location.href).href }];
  }));
  const code = new URLSearchParams(location.hash.slice(1)).get("g") ?? "";
  const g = giftDecode(code, Object.keys(GRIDS).map(Number), new Set(cat.keys()));
  const q = (/** @type {string} */ s) => /** @type {HTMLElement} */ (root.querySelector(s));
  if (!g) { q("[data-gift-bad]").hidden = false; q("[data-bx-box]").hidden = true; root.dataset.ready = "true"; return; }
  drawPlaces(q("[data-bx-places]"), g.n, g.p.map((id) => cat.get(id) ?? null), false);
  q("[data-gift-h]").textContent = g.t ? `${g.t}, a box for you` : "A box for you";
  if (g.c) { q("[data-gift-card]").textContent = `“${g.c}”`; q("[data-gift-card]").hidden = false; }
  if (g.f) { q("[data-gift-from]").textContent = `From ${g.f}`; q("[data-gift-from]").hidden = false; }
  if (g.w) { q("[data-gift-when]").textContent = `Ready to collect: ${g.w}. Show this page at the counter.`; q("[data-gift-when]").hidden = false; }
  root.dataset.ready = "true";
}

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  if (root.hasAttribute("data-bx-gift")) { giftView(root); return; }
  const d = /** @type {any} */ (ctx.data);
  const q = (/** @type {string} */ s) => /** @type {HTMLElement} */ (root.querySelector(s));
  const sizes = /** @type {HTMLInputElement[]} */ ([...root.querySelectorAll('[name="bx-size"]')]);
  const adds = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-bx-add]")]);
  const list = q("[data-bx-places]"), lid = q("[data-bx-lid]"), fill = q("[data-bx-fill]"), tied = q("[data-bx-tied]");
  const tie = /** @type {HTMLButtonElement} */ (q("[data-bx-tie]"));
  const card = /** @type {HTMLTextAreaElement} */ (q("[data-bx-card]")), gift = /** @type {HTMLInputElement} */ (q("[data-bx-gift]"));
  const to = /** @type {HTMLInputElement} */ (q("[data-bx-to]")), from = /** @type {HTMLInputElement} */ (q("[data-bx-from]"));
  const when = /** @type {HTMLSelectElement} */ (q("[data-bx-when]"));
  const send = /** @type {HTMLAnchorElement} */ (q("[data-bx-send]")), share = /** @type {HTMLAnchorElement} */ (q("[data-bx-share]"));
  const pieceOf = (/** @type {HTMLElement} */ b) => /** @type {Piece} */ ({ id: b.dataset.bxAdd ?? "", name: b.dataset.name ?? "", allergens: (b.dataset.allergens ?? "").split(" ").filter(Boolean), src: new URL(b.dataset.src ?? "", location.href).href });
  const size = () => { const s = sizes.find((x) => x.checked) ?? sizes[0]; return { n: Number(s.value), price: Number(s.dataset.price) }; };
  /** @type {(Piece|null)[]} */ let places = Array(size().n).fill(null);
  let isTied = false;
  const cfg = d.collect ? { prepMinutes: d.collect.prepMinutes, step: d.collect.step, daysAhead: Math.min(3, d.collect.daysAhead) } : { prepMinutes: 30, step: 15, daysAhead: 2 };

  const fillWhen = () => {
    const now = ctx.now(), keep = when.value;
    /** @type {HTMLOptionElement[]} */ const opts = [];
    for (const day of collectionDays(d.hours, now, cfg)) {
      const name = day === now.date ? "Today" : longDay(day);
      for (const s of collectionSlots(d.hours, day, now, { ...cfg, step: 30 })) opts.push(new Option(`${name}, ${slotLabel(s)}`, `${day} ${s}`));
    }
    when.replaceChildren(...opts.slice(0, 40));
    if (opts.some((o) => o.value === keep)) when.value = keep;
  };
  const render = () => {
    const z = size(), quote = boxQuote(z, places);
    drawPlaces(list, z.n, places, true);
    q("[data-bx-count]").textContent = quote.full ? `A box of ${z.n}, full` : `${quote.filled} of ${z.n}`;
    q("[data-bx-price]").textContent = gbp(z.price);
    const names = quote.allergens.map(allergenName);
    q("[data-bx-allergens]").textContent = quote.filled ? (names.length ? `Contains ${names.join(", ")}.` : "Nothing in it lists an allergen.") : "Tap a chocolate to place it.";
    tie.disabled = !quote.full;
    for (const a of adds) a.toggleAttribute("aria-disabled", quote.full);
    lid.hidden = !isTied; fill.hidden = isTied; tied.hidden = !isTied;
    root.classList.toggle("is-tied", isTied);
    q("[data-bx-card-view]").textContent = card.value.trim();
    q("[data-bx-left]").textContent = `${card.maxLength - card.value.length} left`;
    /** @type {HTMLElement} */ (q("[data-bx-giftf]")).hidden = !gift.checked;
    for (const p of /** @type {NodeListOf<HTMLElement>} */ (root.querySelectorAll("[data-bx-pay]"))) p.hidden = !isTied || Number(p.dataset.bxPay) !== z.n;
    // Dated, never "Today": the gift message and its link may be read on another day.
    const whenText = when.value ? `${longDay(when.value.slice(0, 10))}, ${slotLabel(when.value.slice(11))}` : "as soon as you can";
    const giftOf = gift.checked ? { to: to.value, from: from.value } : null;
    send.href = ctx.waHref(boxText(quote, { business: d.name, when: whenText, card: card.value, gift: giftOf, allergenNames: names }));
    send.textContent = gift.checked ? "Order the gift" : "Order for collection";
    share.hidden = !gift.checked;
    if (gift.checked) {
      const code = giftEncode({ n: z.n, p: quote.pieces.map((p) => p.id), c: card.value.trim(), t: to.value.trim(), f: from.value.trim(), w: whenText });
      const link = `${new URL(root.dataset.giftUrl ?? "gift.html", location.href).href}#g=${code}`;
      share.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(giftShareText({ business: d.name, to: to.value, from: from.value, when: whenText, link }))}`;
    }
  };
  root.addEventListener("click", (e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    const add = /** @type {HTMLButtonElement|null} */ (t.closest("[data-bx-add]"));
    const slot = /** @type {HTMLElement|null} */ (t.closest("[data-bx-slot]"));
    if (add && !add.disabled && !isTied) {
      const i = places.indexOf(null);
      if (i < 0) return;
      places[i] = pieceOf(add);
      render();
      const el = list.querySelectorAll(".bx-place")[i];
      el.classList.add("is-new"); setTimeout(() => el.classList.remove("is-new"), 600);
      return;
    }
    if (slot && !isTied) places[Number(slot.dataset.bxSlot)] = null;
    else if (t.closest("[data-bx-clear]")) places.fill(null);
    else if (t.closest("[data-bx-tie]") && boxQuote(size(), places).full) { isTied = true; render(); card.focus(); return; }
    else if (t.closest("[data-bx-untie]")) isTied = false;
    else return;
    render();
  });
  for (const s of sizes) s.addEventListener("change", () => { const n = size().n; places = Array.from({ length: n }, (_, i) => places[i] ?? null); isTied = false; render(); });
  for (const el of [card, gift, to, from, when]) el.addEventListener("input", render);
  when.addEventListener("change", render);
  startBakes(ctx);
  ctx.watch("bakes", (/** @type {import("../../lib/bakes.js").Bakes} */ b) => {
    for (const a of adds) {
      const out = stateOf(b, { id: a.dataset.bxAdd ?? "", name: a.dataset.name ?? "" })?.status === "sold out";
      a.disabled = out;
      /** @type {HTMLElement} */ (a.querySelector("[data-bx-out]")).hidden = !out;
      if (out) places = places.map((p) => (p?.id === a.dataset.bxAdd ? null : p));
    }
    if (isTied && !boxQuote(size(), places).full) isTied = false;
    render();
  });
  // The shop's suggested box to start from (site.json → box.start).
  (d.box.start ?? []).forEach((/** @type {string} */ id, /** @type {number} */ i) => { const a = adds.find((x) => x.dataset.bxAdd === id); if (a && i < places.length) places[i] = pieceOf(a); });
  fillWhen();
  ctx.everyMinute(() => { fillWhen(); render(); });
  render();
  root.dataset.ready = "true";
}
