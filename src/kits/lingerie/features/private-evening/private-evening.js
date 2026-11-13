// @ts-check
/** The private evening: free evenings from the sheet (or the demo's sample), one chosen, asked for on WhatsApp. */
import { parseEvenings, openEvenings, isFresh, eveningText } from "../../lib/evenings.js";
import { ukDate } from "../../../../core/lib/diary.js";
import { readData, must, sheetRows } from "../dom.js";
import { formatTime12, toMinutes } from "../../../../core/lib/hours.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = readData(root);
  const list = /** @type {HTMLElement} */ (must(root, "[data-eve-list]"));
  const none = /** @type {HTMLElement} */ (must(root, "[data-eve-none]"));
  const form = /** @type {HTMLElement} */ (must(root, "[data-eve-form]"));
  const send = /** @type {HTMLAnchorElement} */ (must(root, "[data-eve-send]"));
  const guests = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-eve-guests]"));
  const occasion = /** @type {HTMLInputElement} */ (must(root, "[data-eve-occasion]"));
  const name = /** @type {HTMLInputElement} */ (must(root, "[data-eve-name]"));
  let picked = "";
  const label = (/** @type {{ date: string, start: string }} */ e) => `${ukDate(e.date).replace(/ \d{4}$/, "")}, ${formatTime12(toMinutes(e.start))}`;
  const update = () => {
    if (!picked) return;
    send.href = ctx.waHref(eveningText({ business: ctx.data.name, when: picked, guests: Number(guests?.value ?? 0), occasion: occasion.value, name: name.value }));
  };
  const show = (/** @type {{ date: string, start: string }[]} */ open) => {
    list.hidden = !open.length;
    none.hidden = Boolean(open.length);
    none.textContent = "Message us for the next free evening.";
    list.replaceChildren(...open.map((e, i) => {
      const b = Object.assign(document.createElement("button"), { type: "button", textContent: label(e) });
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", "false");
      b.addEventListener("click", () => {
        for (const x of list.children) x.setAttribute("aria-checked", String(x === b));
        picked = label(e);
        form.hidden = false;
        update();
      });
      if (i === 0) b.tabIndex = 0;
      return b;
    }));
  };
  (async () => {
    if (cfg.source === "sample") { show(openEvenings(cfg.sample, ctx.now())); return; }
    const rows = await sheetRows(cfg.csvUrl);
    if (!rows) { show([]); return; }
    const { evenings, updated } = parseEvenings(rows, ctx.data.hours.timezone);
    show(isFresh(updated, Date.now(), cfg.staleAfterHours) ? openEvenings(evenings, ctx.now()) : []);
  })();
  root.addEventListener("input", update);
  root.addEventListener("change", update);
}
