// @ts-check
/** The guest mehndi sum: the count and the design size give the artists, the hours and a from price, sent on WhatsApp. */
import { guestPlan, guestText, artistsWords, hoursWords, pounds } from "../../lib/mehndi.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).guests;
  const n = root.querySelector("[data-gq-n]"), line = root.querySelector("[data-gq-line]"), from = root.querySelector("[data-gq-from]");
  const up = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-gq-up]")), down = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-gq-down]"));
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-gq-send]"));
  const sizes = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-gq-size]")]);
  if (!cfg || !n || !line || !from || !up || !down || !send || !sizes.length) throw new Error("guest quote markup missing");
  let guests = Number(n.textContent) || 1;
  let size = sizes.find((b) => b.getAttribute("aria-pressed") === "true") ?? sizes[0];
  let wedding = "";
  const paint = () => {
    const minutes = Number(size.dataset.min), price = Number(size.dataset.price), name = size.dataset.name ?? "";
    const p = guestPlan(guests, minutes, cfg.perArtistMinutes, cfg.artists);
    n.textContent = String(guests);
    if (p.over) line.textContent = "More than we can do in one night: we'd plan it with you.";
    else line.replaceChildren(`${artistsWords(p.artists)}, about `, Object.assign(document.createElement("b"), { textContent: hoursWords(p.minutes) }), ".");
    from.textContent = `${name} each · from ${pounds(guests * price)}`;
    send.href = ctx.bookHref(guestText(cfg.message, { guests, size: name, minutes, price: guests * price, wedding }));
    down.disabled = guests <= 1; up.disabled = guests >= cfg.max;
  };
  up.addEventListener("click", () => { if (guests < cfg.max) { guests++; paint(); } });
  down.addEventListener("click", () => { if (guests > 1) { guests--; paint(); } });
  for (const b of sizes) b.addEventListener("click", () => {
    size = b;
    for (const x of sizes) x.setAttribute("aria-pressed", String(x === b));
    paint();
  });
  ctx.watch("wedding", (/** @type {string} */ v) => { wedding = v ?? ""; paint(); });
  paint();
}
