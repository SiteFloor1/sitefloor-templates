// @ts-check
/**
 * The hand in the hero. A swatch on the rail shows that shade on the hand: on every plan, the salon's own photo of the
 * hand wearing it (a slow cross-fade); on Signature ("shade-on-hand"), any shade, laid into the nails from the hand's
 * mask with the photo's own light kept, on whichever hand (skin tone) is chosen. The card, and every Book in the shade's
 * colour on the page (header, card, phone bar), follow the shade. Markup: the look's hero.njk.
 */
import { recolour, nailBase, nailTone } from "../../lib/shade.js";
import { shadeText } from "../../lib/messages.js";

const MAX_W = 1200; // the recolour works on a picture no wider than this; the photos are 1200 wide

/**
 * @typedef {{ id: string, src: string, mask: string, wearing: string, alt: string }} Hand
 * @typedef {{ id: string, no: string, name: string, hex: string, line: string, dark: boolean, shot: string }} PickData
 */

/** @param {string} src @returns {Promise<HTMLImageElement>} */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const frame = root.querySelector("[data-sh-frame]");
  const layers = /** @type {HTMLImageElement[]} */ ([...root.querySelectorAll("[data-sh-layer]")]);
  const canvas = /** @type {HTMLCanvasElement|null} */ (root.querySelector("[data-sh-canvas]"));
  const rail = root.querySelector("[data-sh-rail]");
  const no = root.querySelector("[data-sh-no]"), name = root.querySelector("[data-sh-name]"), line = root.querySelector("[data-sh-line]");
  const opening = root.dataset.shOpening ?? "";
  if (!frame || layers.length !== 2 || !canvas || !rail || !no || !name || !line) throw new Error("shade-hand markup missing");
  const handBtns = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-sh-hand]")]);
  const handsBox = /** @type {HTMLElement|null} */ (root.querySelector("[data-sh-hands]"));
  /** @type {Hand[]} */
  const hands = handBtns.length ? handBtns.map((b) => ({ id: b.dataset.shHand ?? "", src: b.dataset.src ?? "", mask: b.dataset.mask ?? "", wearing: b.dataset.wearing ?? "", alt: b.dataset.alt ?? "" }))
    : [{ id: "", src: layers[0].getAttribute("src") ?? "", mask: "", wearing: root.dataset.shWearing ?? "", alt: layers[0].alt }];
  const firstHand = hands[0].id;
  /** Masks are on (Signature) and showing (a demo's plan switcher can hide them). */
  const masksOn = () => Boolean(handsBox && !handsBox.classList.contains("tier-off") && hands.every((h) => h.mask));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let hand = hands[0];
  let shade = hand.wearing;
  let front = 0; // which <img> layer is showing
  let ticket = 0; // only the latest pick may draw
  /** @type {Map<string, Promise<{ w: number, h: number, src: Uint8ClampedArray, mask: Uint8ClampedArray, base: number, tone: Float32Array }>>} */
  const cache = new Map();

  /** The pixels of a hand and its mask, once. @param {Hand} h */
  const pixels = (h) => {
    let p = cache.get(h.id);
    if (!p) {
      p = Promise.all([loadImage(h.src), loadImage(h.mask)]).then(([img, m]) => {
        const w = Math.min(MAX_W, img.naturalWidth), hh = Math.round(img.naturalHeight * (w / img.naturalWidth));
        const c = document.createElement("canvas"); c.width = w; c.height = hh;
        const g = /** @type {CanvasRenderingContext2D} */ (c.getContext("2d", { willReadFrequently: true }));
        g.drawImage(img, 0, 0, w, hh); const src = g.getImageData(0, 0, w, hh).data;
        g.clearRect(0, 0, w, hh); g.drawImage(m, 0, 0, w, hh); const mask = g.getImageData(0, 0, w, hh).data;
        return { w, h: hh, src, mask, base: nailBase(src, mask), tone: nailTone(src, mask, w, hh) };
      });
      p.catch(() => cache.delete(h.id));
      cache.set(h.id, p);
    }
    return p;
  };

  /** Shows a photo (a URL) by fading the back layer in. @param {string} src @param {string} alt */
  const showPhoto = (src, alt) => {
    const back = layers[1 - front];
    const swap = () => { back.classList.add("on"); layers[front].classList.remove("on"); canvas.classList.remove("on"); front = 1 - front; };
    if (back.getAttribute("src") === src && back.complete) { back.alt = alt; swap(); return; }
    back.onload = swap;
    back.alt = alt;
    back.src = src;
  };

  /** @param {PickData} d @param {number} t */
  const showRecolour = async (d, t) => {
    frame.setAttribute("aria-busy", "true");
    try {
      const px = await pixels(hand);
      if (t !== ticket) return;
      canvas.width = px.w; canvas.height = px.h;
      const g = /** @type {CanvasRenderingContext2D} */ (canvas.getContext("2d"));
      const out = g.createImageData(px.w, px.h);
      recolour(px.src, px.mask, out.data, d.hex, px.base, px.tone);
      g.putImageData(out, 0, 0);
      canvas.setAttribute("aria-label", `${hand.alt}, the nails shown in ${d.name}`);
      canvas.classList.add("on");
    } catch {
      // A photo or mask that won't load: the card still names the shade; the hand stays as it was photographed.
    } finally { if (t === ticket) frame.removeAttribute("aria-busy"); }
  };

  /** Everything that follows the shade: the card, the colour, every Book. @param {PickData} d */
  const follow = (d) => {
    no.textContent = `No. ${d.no}`; name.textContent = d.name; line.textContent = d.line;
    for (const el of /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll("[data-sh-swatch], a[data-sh-book]"))) {
      el.style.setProperty("--shade", d.hex);
      el.classList.toggle("is-dark", d.dark);
    }
    const href = ctx.bookHref(shadeText(opening, `${d.name} (No. ${d.no})`));
    for (const a of /** @type {NodeListOf<HTMLAnchorElement>} */ (document.querySelectorAll("a[data-sh-book]"))) {
      a.href = href;
      a.dataset.usual = `${d.name} (No. ${d.no})`;
      if (a.dataset.waText !== undefined) a.dataset.waText = shadeText(opening, `${d.name} (No. ${d.no})`);
      for (const s of a.querySelectorAll("[data-sh-word]")) s.textContent = d.name;
    }
  };

  /** @param {HTMLElement} b */
  const dataOf = (b) => /** @type {PickData} */ ({ id: b.dataset.shPick ?? "", no: b.dataset.no ?? "", name: b.dataset.name ?? "", hex: b.dataset.hex ?? "", line: b.dataset.line ?? "", dark: b.dataset.dark === "true", shot: b.dataset.shot ?? "" });

  const render = () => {
    const b = /** @type {HTMLElement|null} */ (rail.querySelector(`[data-sh-pick="${CSS.escape(shade)}"]`));
    if (!b) return;
    const d = dataOf(b);
    follow(d);
    const t = ++ticket;
    if (shade === hand.wearing) showPhoto(hand.src, hand.alt);
    else if (hand.id === firstHand && d.shot) showPhoto(d.shot, `${hand.alt}, wearing ${d.name}`);
    else if (masksOn()) showRecolour(d, t);
  };

  rail.addEventListener("click", (e) => {
    const b = /** @type {HTMLElement|null} */ (/** @type {Element} */ (e.target).closest("[data-sh-pick]"));
    if (!b || b.closest(".tier-off")) return;
    for (const x of rail.querySelectorAll("[data-sh-pick]")) x.setAttribute("aria-pressed", String(x === b));
    shade = b.dataset.shPick ?? shade;
    render();
  });
  handsBox?.addEventListener("click", (e) => {
    const b = /** @type {HTMLButtonElement|null} */ (/** @type {Element} */ (e.target).closest("[data-sh-hand]"));
    const h = hands.find((x) => x.id === b?.dataset.shHand);
    if (!b || !h || h === hand) return;
    for (const x of handBtns) x.setAttribute("aria-pressed", String(x === b));
    hand = h;
    render();
  });
  // The demo's plan switcher can hide the masks: go back to a photographed shade.
  if (handsBox) new MutationObserver(() => {
    if (masksOn()) return;
    const shotOnly = rail.querySelector("[data-sh-pick]:not(.tier-off)");
    if (hand.id !== firstHand) { hand = hands[0]; for (const x of handBtns) x.setAttribute("aria-pressed", String(x.dataset.shHand === firstHand)); }
    const cur = rail.querySelector(`[data-sh-pick="${CSS.escape(shade)}"]`);
    if (cur && cur.classList.contains("tier-off") && shotOnly instanceof HTMLElement) { shade = shotOnly.dataset.shPick ?? shade; for (const x of rail.querySelectorAll("[data-sh-pick]")) x.setAttribute("aria-pressed", String(x === shotOnly)); }
    render();
  }).observe(handsBox, { attributes: true, attributeFilter: ["class"] });
  if (reduced) root.classList.add("sh-still");
  // Read the hand's pixels the first time someone reaches for the rail, not while the page loads.
  const warm = () => { if (masksOn()) pixels(hand).catch(() => {}); };
  rail.addEventListener("pointerover", warm, { once: true });
  rail.addEventListener("focusin", warm, { once: true });
}
