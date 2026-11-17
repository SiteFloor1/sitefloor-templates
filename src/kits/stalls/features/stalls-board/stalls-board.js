// @ts-check
/**
 * Today's board as a picture: the next stop, the menu with today's sold-out lines and the allergen key, drawn as a
 * 1080 × 1350 image (the shape Instagram and TikTok show whole) and saved to the phone. Uses the page's own fonts and
 * colours, so it looks like the stall.
 */
import { pounds, shortDay, slug } from "../../lib/stalls.js";
import { placeOf } from "../stalls-where/stalls-where.js";

/**
 * The board's lines, as drawn (exported for the unit tests).
 * @param {{ name: string, price: number, allergens: string, vegan: boolean }[]} items @param {Record<string, string>} soldOut
 */
export const boardLines = (items, soldOut) => items.map((i) => {
  const out = soldOut[i.name.toLowerCase()];
  return { name: i.name, price: pounds(i.price), out: Boolean(out), sub: out ? `Sold out today at ${out}` : `${i.allergens || "None of the 14 allergens"}${i.vegan ? " · VE" : ""}` };
});

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const menu = /** @type {any} */ (ctx.data).menu, cfg = /** @type {any} */ (ctx.data).stops, name = /** @type {any} */ (ctx.data).name;
  if (!menu) throw new Error("board data missing");
  /** @type {Record<string, string>} */ let soldOut = {};
  /** @type {any} */ let stop = null;
  ctx.watch("stallsSoldOut", (/** @type {Record<string, string>} */ o) => { soldOut = o; });
  ctx.watch("stallsChosen", (/** @type {any} */ s) => { stop = s; });
  root.addEventListener("click", async () => {
    await document.fonts.ready;
    const css = getComputedStyle(document.documentElement);
    const v = (/** @type {string} */ k, /** @type {string} */ d) => css.getPropertyValue(k).trim() || d;
    const display = v("--font-display", "sans-serif"), body = v("--font-body", "serif");
    const c = document.createElement("canvas"), w = 1080, h = 1350;
    c.width = w; c.height = h;
    const x = /** @type {CanvasRenderingContext2D} */ (c.getContext("2d"));
    x.fillStyle = v("--board-bg", "#16120F"); x.fillRect(0, 0, w, h);
    x.fillStyle = v("--board-ink", "#FFFFFF"); x.font = `800 112px ${display}`; x.fillText(name, 80, 180);
    if (stop && cfg) {
      const p = placeOf(cfg, stop.place);
      x.fillStyle = v("--board-accent", "#FF9DB0"); x.font = `700 40px ${display}`;
      x.fillText(`${shortDay(stop.date)} · ${p.name} · ${stop.open}–${stop.close}`, 80, 250);
    }
    let y = 390;
    for (const l of boardLines(menu.items, soldOut).slice(0, 6)) {
      x.globalAlpha = l.out ? 0.45 : 1;
      x.fillStyle = v("--board-ink", "#FFFFFF"); x.font = `700 52px ${display}`; x.textAlign = "left"; x.fillText(l.name, 80, y);
      x.fillStyle = v("--board-price", "#E3A04B"); x.textAlign = "right"; x.fillText(l.price, w - 80, y);
      if (l.out) { x.fillStyle = v("--board-ink", "#FFFFFF"); x.fillRect(80, y - 18, w - 160, 4); }
      x.globalAlpha = 1; x.textAlign = "left"; x.fillStyle = v("--board-muted", "#B9B0A8"); x.font = `400 30px ${body}`; x.fillText(l.sub, 80, y + 46);
      y += 160;
    }
    x.fillStyle = v("--board-muted", "#B9B0A8"); x.font = `400 26px ${body}`; x.fillText(menu.key, 80, h - 70, w - 160);
    const blob = await new Promise((res) => c.toBlob(res, "image/png"));
    if (!blob) return;
    const url = URL.createObjectURL(/** @type {Blob} */ (blob));
    const a = Object.assign(document.createElement("a"), { href: url, download: `${slug(name)}-board.png` });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    root.textContent = "Saved. Post it!";
    setTimeout(() => { root.textContent = "Save the board"; }, 2600);
  });
}
