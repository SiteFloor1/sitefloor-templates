// @ts-check
/**
 * Your flowers this week: reads the client's code from the link (your-flowers#GLB2Q8) or the box and asks the provider
 * (the florist's Sheet, or the demo's simulation). Unknown or unreadable: "message us", never a guess.
 */
import { cleanRef } from "../../lib/track.js";

const WHY = {
  unknown: "We can't find that code. Check it against our message, or message us.",
  stale: "We haven't updated this for a while, so it may be out of date. Message us and we'll tell you what's coming.",
  unreadable: "This week's flowers aren't loading right now. Message us and we'll tell you what's coming.",
};

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  /** @type {import("../follow-order/sheet-provider.js").FloristProvider|null} */
  const provider = ctx.providers.florist;
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-acc-form]"));
  const input = /** @type {HTMLInputElement|null} */ (root.querySelector("#acc-code"));
  const card = /** @type {HTMLElement|null} */ (root.querySelector("[data-acc-card]"));
  const off = /** @type {HTMLElement|null} */ (root.querySelector("[data-acc-off]"));
  if (!provider || !form || !input || !card || !off) throw new Error("your flowers: markup or provider missing");
  const $ = (/** @type {string} */ s) => /** @type {HTMLElement} */ (root.querySelector(s));
  let code = "";
  /** @param {import("../../lib/track.js").Account | import("../../lib/track.js").NoResult} r */
  const show = (r) => {
    if (!r.ok) {
      card.hidden = true; off.hidden = false;
      $("[data-acc-why]").textContent = WHY[r.reason];
      /** @type {HTMLAnchorElement} */ ($("[data-acc-help]")).href = ctx.waHref(`Hello, a question about our flowers. Our code is ${code}.`);
      return;
    }
    off.hidden = true; card.hidden = false;
    $("[data-acc-name]").textContent = r.name || "Your flowers";
    $("[data-acc-week]").textContent = r.weekOf;
    const ul = $("[data-acc-list]");
    ul.replaceChildren(...r.pieces.map((p) => {
      const li = document.createElement("li");
      if (p.place) { const b = document.createElement("b"); b.textContent = p.place; li.append(b, " "); }
      li.append(p.what);
      return li;
    }));
    $("[data-acc-next]").textContent = r.next ? `Next change: ${r.next}` : "";
    const note = $("[data-acc-note]"); note.hidden = !r.note; note.textContent = r.note;
    const fig = $("[data-acc-fig]"), img = /** @type {HTMLImageElement} */ ($("[data-acc-photo]"));
    fig.hidden = !r.photo; if (r.photo) img.src = r.photo;
    /** @type {HTMLAnchorElement} */ ($("[data-acc-ask]")).href = ctx.waHref(`Hello, a change to this week's flowers, please. Our code is ${code}.`);
  };
  /** @param {string} raw */
  const open = (raw) => {
    const c = cleanRef(raw);
    if (!c) { input.setCustomValidity("Codes are 4 to 10 letters and numbers."); input.reportValidity(); return; }
    input.setCustomValidity("");
    code = c; input.value = c;
    if (location.hash.slice(1) !== c) history.replaceState(null, "", `#${c}`);
    provider.account(ctx, c).then(show, () => show({ ok: false, reason: "unreadable" }));
  };
  form.addEventListener("submit", (e) => { e.preventDefault(); open(input.value); });
  input.addEventListener("input", () => input.setCustomValidity(""));
  const fromLink = cleanRef(decodeURIComponent(location.hash.slice(1)));
  if (fromLink) open(fromLink);
}
