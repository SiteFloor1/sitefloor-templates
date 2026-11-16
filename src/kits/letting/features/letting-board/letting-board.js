// @ts-check
/**
 * Homes free now: lists the free homes (all of them, or one floor's once the lift plate picks one), opens a home's
 * card with its rent, size, deposits within the caps, council tax band, EPC and the rest of its material information,
 * and a viewing request by WhatsApp. Shares "letting-picked" (the open home's ref) and listens for "letting-floor"
 * and "letting-open" from the lift plate and the 3D building. Fails closed: no list when the sheet is stale.
 */
import { homesState, free, countLine } from "./load.js";
import { updatedText, partA, sqft, viewingText } from "../../lib/homes.js";
import { pounds } from "../../lib/fees.js";

/** @param {string} tag @param {string} [cls] @param {string} [text] */
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
/** @param {number} n @param {string} w */
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

/**
 * Fills a home's card and opens it. Shared with the residences page.
 * @param {HTMLElement} card @param {import("../../lib/homes.js").Home} h @param {import("../../../../core/js/core.js").Ctx} ctx @param {() => void} onClose
 */
export function openCard(card, h, ctx, onClose) {
  const cfg = /** @type {any} */ (ctx.data).homes;
  const building = cfg.buildings.find((/** @type {any} */ b) => b.id === h.building);
  const head = el("h2", "lb-c-name", h.name);
  const where = el("p", "lb-c-where", building ? `${building.name}, ${building.kind.toLowerCase()}` : "");
  const rent = el("p", "lb-c-rent", pounds(h.rent)); rent.append(" ", el("span", "", "a month"));
  const spec = [h.beds !== null ? plural(h.beds, "bedroom") : "", h.baths !== null ? plural(h.baths, "bathroom") : "",
    h.m2 ? `${h.m2} m² (${sqft(h.m2).toLocaleString("en-GB")} sq ft)` : "", h.available === "now" ? "free now" : `from ${h.available}`].filter(Boolean).join(" · ");
  const more = el("dl", "lb-c-more");
  for (const [k, v] of h.more) more.append(el("dt", "", k), el("dd", "", v));
  const book = /** @type {HTMLAnchorElement} */ (el("a", "lb-c-book", "Book a viewing"));
  book.href = ctx.waHref(viewingText(cfg.viewing, h, building?.name ?? ""));
  book.target = "_blank"; book.rel = "noopener";
  const close = /** @type {HTMLButtonElement} */ (el("button", "lb-c-close", "Close"));
  close.type = "button";
  const row = el("div", "lb-c-row"); row.append(book, close);
  card.replaceChildren(head, where, rent, el("p", "lb-c-spec", spec), el("p", "lb-c-a", partA(h, cfg.tenant)), ...(h.more.length ? [more] : []),
    ...(h.notes ? [el("p", "lb-c-notes", h.notes)] : []), row);
  card.setAttribute("role", "dialog"); card.setAttribute("aria-label", h.name);
  card.classList.add("on");
  close.addEventListener("click", () => { card.classList.remove("on"); onClose(); });
  card.onkeydown = (e) => { if (e.key === "Escape") close.click(); };
  book.focus({ preventScroll: true });
}

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).homes;
  const list = /** @type {HTMLElement} */ (root.querySelector("[data-lb-list]"));
  const upd = /** @type {HTMLElement} */ (root.querySelector("[data-lb-updated]"));
  const card = /** @type {HTMLElement|null} */ (document.querySelector("[data-lb-card]"));
  const count = /** @type {HTMLElement|null} */ (document.querySelector("[data-lb-count]"));
  if (!list || !upd || !card) throw new Error("letting-board markup missing");
  const where = cfg.hero ?? cfg.buildings[0].id;
  const tz = ctx.data.hours.timezone;
  /** @type {string|null} */ let floor = null;
  /** @type {import("./load.js").HomesState|null} */ let state = null;
  /** @type {HTMLElement|null} */ let opener = null;

  const open = (/** @type {import("../../lib/homes.js").Home} */ h, /** @type {HTMLElement|null} */ from) => {
    opener = from;
    openCard(card, h, ctx, () => { ctx.share("letting-picked", null); opener?.focus(); });
    ctx.share("letting-picked", h.ref);
  };
  const render = () => {
    if (!state) return;
    const homes = free(state, where, floor);
    list.replaceChildren(...homes.map((h) => {
      const li = el("li"), b = /** @type {HTMLButtonElement} */ (el("button", "lb-home"));
      b.type = "button";
      b.append(el("span", "lb-h-n", h.name), el("span", "lb-h-r", `${pounds(h.rent)} a month`));
      b.addEventListener("click", () => open(h, b));
      li.append(b); return li;
    }));
  };

  homesState(ctx).then((s) => {
    state = s;
    if (s.ok) {
      upd.textContent = updatedText(s.updatedAt, Date.now(), tz);
      if (count) count.textContent = countLine(free(s, where).length);
    } else {
      upd.textContent = "";
      upd.append("Our list is being updated. Call us on ");
      const a = /** @type {HTMLAnchorElement} */ (el("a", "", ctx.data.phone.replace("+44 ", "0")));
      a.href = `tel:${ctx.data.phone.replace(/\s/g, "")}`;
      upd.append(a, " for today's homes.");
      if (count) count.textContent = "";
    }
    root.dataset.state = s.ok ? "live" : "stale";
    render();
    ctx.share("letting", s);
  });
  ctx.watch("letting-floor", (/** @type {string|null} */ f) => { floor = f; render(); });
  ctx.watch("letting-open", (/** @type {string|null} */ ref) => {
    const h = state?.ok ? state.homes.find((x) => x.ref === ref && x.status === "available") : undefined;
    if (h) open(h, null);
  });
}
