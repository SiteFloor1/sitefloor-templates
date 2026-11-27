// @ts-check
/**
 * Places, room by room: the age buttons pick a room and say its next month with a place; the sheet (or the demo's
 * simulation) fills six months for every room. Fails closed: an unreadable or old sheet leaves the months hidden and
 * the answer names the room only, with "Ask about a place". Shares the answer for the phone bar ("nurseryNext").
 */
import { monthsAhead, monthWords, nextPlace, placesWords, placeKey, roomKnown, ymdIn } from "../../lib/nursery.js";

/** @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx) => Promise<import("../../lib/nursery.js").PlacesResult> }} PlacesProvider */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).nursery.places;
  /** @type {PlacesProvider|null} */
  const provider = ctx.providers.nurseryPlaces;
  if (!cfg || !provider) throw new Error("places data or provider missing");
  const months = monthsAhead(ymdIn(Date.now(), ctx.data.hours.timezone), cfg.months);
  /** @type {Record<string, number>|null} */
  let places = null;
  const answer = /** @type {HTMLElement} */ (root.querySelector("[data-nu-answer]"));
  const buttons = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-nu-age]")]);
  let room = buttons.find((b) => b.getAttribute("aria-pressed") === "true")?.dataset.nuAge ?? cfg.rooms[0].id;

  const ask = (/** @type {any} */ r, /** @type {string} */ ym) =>
    `${cfg.message} is there a place in the ${r.name} (${r.ages})${ym ? ` from ${monthWords(ym, "long")}` : ""}?`;

  const paint = () => {
    for (const art of /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-nu-room]")])) {
      const id = art.dataset.nuRoom ?? "";
      const r = cfg.rooms.find((/** @type {any} */ x) => x.id === id);
      art.classList.toggle("is-on", id === room);
      const strip = /** @type {HTMLElement} */ (art.querySelector("[data-nu-months]"));
      const known = places !== null && roomKnown(places, id, months);
      strip.hidden = !known;
      if (known && places) {
        strip.replaceChildren(...months.map((ym) => {
          const w = placesWords(places?.[placeKey(id, ym)]);
          const cell = document.createElement("div");
          cell.dataset.nuMonth = `${id}|${ym}`;
          if (w) cell.dataset.state = w.state;
          const m = document.createElement("span"); m.textContent = monthWords(ym);
          const b = document.createElement("b"); b.textContent = w ? w.words : "";
          cell.append(m, b);
          return cell;
        }));
      }
      const link = /** @type {HTMLAnchorElement} */ (art.querySelector("[data-nu-ask]"));
      const next = places && known ? nextPlace(places, id, months) : "";
      link.href = ctx.bookHref(ask(r, next));
    }
    const r = cfg.rooms.find((/** @type {any} */ x) => x.id === room);
    const known = places !== null && roomKnown(places, room, months);
    const next = places && known ? nextPlace(places, room, months) : "";
    answer.replaceChildren(`${r.name}, ${r.ages}. `);
    if (known) {
      const em = document.createElement("em");
      em.textContent = next ? monthWords(next, "long") : "join the waiting list";
      answer.append(next ? "Next place: " : "Full for six months: ", em, ".");
    }
    ctx.share("nurseryNext", { room: r.name, month: next ? monthWords(next, "long") : "", known });
    // The phone bar's left half (the look draws it with [data-nu-bar-text]).
    const bar = document.querySelector("[data-nu-bar-text]");
    if (bar) bar.textContent = known ? `${r.name}, ${next ? monthWords(next, "long") : "waiting list"}` : r.name;
  };

  for (const b of buttons) b.addEventListener("click", () => {
    room = b.dataset.nuAge ?? room;
    for (const x of buttons) x.setAttribute("aria-pressed", String(x === b));
    paint();
  });
  paint();
  provider.load(ctx).then((r) => { places = r.ok ? r.places : null; paint(); }, () => { places = null; paint(); });
}
