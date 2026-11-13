/** The bridal party evening: free evenings from the shop's sheet (or the demo's sample), one chosen, asked for on WhatsApp. */
import { parseEvenings, openEvenings, isFresh, partyText } from "../../lib/evenings.js";
import { ukDate, isYmd } from "../../../../core/lib/diary.js";
import { readData, must, sheetRows } from "../dom.js";
import { formatTime12, toMinutes } from "../../../../core/lib/hours.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = readData(root);
  const list = /** @type {HTMLElement} */ (must(root, "[data-party-list]"));
  const none = /** @type {HTMLElement} */ (must(root, "[data-party-none]"));
  const form = /** @type {HTMLElement} */ (must(root, "[data-party-form]"));
  const send = /** @type {HTMLAnchorElement} */ (must(root, "[data-party-send]"));
  const size = /** @type {HTMLSelectElement} */ (must(root, "[data-party-size]"));
  const wedding = /** @type {HTMLInputElement} */ (must(root, "[data-party-wedding]"));
  const names = /** @type {HTMLTextAreaElement} */ (must(root, "[data-party-names]"));
  const bride = /** @type {HTMLInputElement} */ (must(root, "[data-party-bride]"));
  wedding.min = ctx.now().date;
  let picked = "";
  const label = (/** @type {{ date: string, start: string }} */ e) => `${ukDate(e.date).replace(/ \d{4}$/, "")}, ${formatTime12(toMinutes(e.start))}`;
  const update = () => {
    if (!picked) return;
    send.href = ctx.waHref(partyText({ business: ctx.data.name, when: picked, party: Number(size.value), wedding: isYmd(wedding.value) ? ukDate(wedding.value) : "", names: names.value, bride: bride.value }));
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
