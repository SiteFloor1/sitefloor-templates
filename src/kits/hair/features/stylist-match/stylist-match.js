// @ts-check
/** Stylist match: three answers pick one stylist; their level, next free day and a message to book them. */
import { matchStylist, freeWords, bookText } from "../../lib/hair.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), cfg = data.stylists;
  const q = (/** @type {string} */ s) => /** @type {HTMLElement|null} */ (root.querySelector(s));
  const form = q("[data-mt-form]"), name = q("[data-mt-name]"), line = q("[data-mt-line]"), free = q("[data-mt-free]");
  const book = /** @type {HTMLAnchorElement|null} */ (q("[data-mt-book]"));
  const cards = Object.fromEntries([.../** @type {NodeListOf<HTMLElement>} */ (root.querySelectorAll("[data-mt-card]"))].map((el) => [el.dataset.mtCard ?? "", { line: el.dataset.line ?? "" }]));
  if (!cfg || !form || !name || !line || !free || !book) throw new Error("stylist-match markup missing");
  /** @type {Record<string, string>} */ let days = {};
  const val = (/** @type {string} */ n) => /** @type {HTMLInputElement|null} */ (form.querySelector(`input[name=${n}]:checked`))?.value ?? "";
  const render = () => {
    const s = matchStylist(cfg.items, cfg.levels, { doing: val("mt-doing"), texture: val("mt-texture") || undefined, want: val("mt-want") === "senior" ? "senior" : "soon" }, days);
    if (!s) return;
    const c = cards[s.id];
    name.textContent = s.name;
    line.textContent = c?.line ?? "";
    free.textContent = days[s.id] ? `Next free ${freeWords(days[s.id], ctx.now().date)}` : " ";
    book.textContent = `Book ${s.name.split(" ")[0]}`;
    book.href = ctx.bookHref(bookText(cfg.message, { extra: [`I'd like to book with ${s.name}.`] }));
  };
  form.addEventListener("change", render);
  ctx.watch("freeDays", (d) => { days = d ?? {}; render(); });
  render();
}
