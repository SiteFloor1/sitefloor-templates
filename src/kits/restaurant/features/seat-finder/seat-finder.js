// @ts-check
/**
 * Seat finder: needs light up the seats that have all of them; a tapped seat is shared as "seat" for Your
 * usual and the table request (a preference, never a reservation).
 */
import { seatsFor, seatLabel } from "../../lib/seats.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  /** @type {import("../../lib/seats.js").Seat[]} */
  const places = /** @type {any} */ (ctx.data).seats;
  const seats = /** @type {SVGGElement[]} */ ([...root.querySelectorAll("[data-sf-seat]")]);
  const needs = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-sf-need]")]);
  const choice = root.querySelector("[data-sf-choice]"), count = root.querySelector("[data-sf-count]");
  if (!places || !seats.length || !choice || !count) throw new Error("seat finder markup or data missing");
  /** @type {string[]} */ let want = [];
  /** @type {string|null} */ let picked = null;

  const paint = () => {
    const fit = new Set(seatsFor(places, want));
    for (const n of needs) n.setAttribute("aria-pressed", String(want.includes(n.dataset.sfNeed ?? "")));
    for (const g of seats) {
      const id = g.dataset.sfSeat ?? "";
      g.classList.toggle("fit", want.length > 0 && fit.has(id));
      g.classList.toggle("dim", want.length > 0 && !fit.has(id));
      g.classList.toggle("sel", id === picked);
      g.setAttribute("aria-pressed", String(id === picked));
    }
    count.textContent = want.length ? (fit.size ? `${fit.size} seat${fit.size === 1 ? "" : "s"} ${fit.size === 1 ? "has" : "have"} all of that.` : "No seat has all of that. Try one fewer.") : "";
    const p = places.find((x) => x.id === picked);
    choice.textContent = p ? `${p.label} · ${p.seats} seat${p.seats === 1 ? "" : "s"}` : "Tap a seat, or pick what you need.";
    ctx.share("seat", p ? { label: seatLabel(p) } : null);
  };
  for (const n of needs) n.addEventListener("click", () => {
    const id = n.dataset.sfNeed ?? "";
    want = want.includes(id) ? want.filter((x) => x !== id) : [...want, id];
    paint();
  });
  /** @param {SVGGElement} g */
  const pick = (g) => { picked = picked === g.dataset.sfSeat ? null : g.dataset.sfSeat ?? null; paint(); };
  for (const g of seats) {
    g.addEventListener("click", () => pick(g));
    g.addEventListener("keydown", (e) => { const k = /** @type {KeyboardEvent} */ (e).key; if (k === "Enter" || k === " ") { e.preventDefault(); pick(g); } });
  }
  paint();
}
