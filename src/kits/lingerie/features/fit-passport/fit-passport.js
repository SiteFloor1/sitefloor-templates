// @ts-check
/** Fit passport: the code (typed, or after # in the link) opens her sizes from the shop's sheet; fails closed. */
import { passportFor, passportText, normaliseCode } from "../../lib/fit.js";
import { readData, must, sheetRows } from "../dom.js";
import { ukDate } from "../../../../core/lib/diary.js";

const CODE = /^[A-HJ-NP-Z2-9]{8}$/;

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = readData(root);
  const form = /** @type {HTMLFormElement} */ (must(root, "[data-pass-form]"));
  const input = /** @type {HTMLInputElement} */ (must(root, "[data-pass-code]"));
  const msg = must(root, "[data-pass-msg]");
  const card = /** @type {HTMLElement} */ (must(root, "[data-pass-card]"));
  const rows = must(root, "[data-pass-rows]");
  const when = must(root, "[data-pass-when]");
  const budget = /** @type {HTMLInputElement} */ (must(root, "[data-pass-budget]"));
  const send = /** @type {HTMLAnchorElement} */ (must(root, "[data-pass-send]"));
  let code = "";
  const link = () => { send.href = ctx.waHref(passportText({ business: ctx.data.name, code, budget: budget.value, name: "" })); };
  const open = async (/** @type {string} */ raw) => {
    code = normaliseCode(raw);
    card.hidden = true;
    if (!CODE.test(code)) { msg.textContent = "A code is eight letters and numbers, as the shop gave it."; return; }
    msg.textContent = "Opening…";
    const data = cfg.source === "sample" ? cfg.sample : await sheetRows(cfg.csvUrl);
    if (!data) { msg.textContent = "We couldn't reach the sizes just now. Message us with the code and we'll reply."; return; }
    const found = passportFor(data, code);
    if (!found) { msg.textContent = "We can't find that code. Check it with whoever gave it to you."; return; }
    msg.textContent = "";
    rows.replaceChildren(...found.sizes.map((s) => { const tr = document.createElement("tr"); tr.append(Object.assign(document.createElement("th"), { scope: "row", textContent: s.shape }), Object.assign(document.createElement("td"), { textContent: s.size })); return tr; }));
    when.textContent = /^\d{4}-\d{2}-\d{2}/.test(found.updated) ? `· fitted ${ukDate(found.updated.slice(0, 10), false)}` : "";
    card.hidden = false;
    link();
    if (location.hash.slice(1) !== code) history.replaceState(null, "", `#${code}`);
  };
  form.addEventListener("submit", (e) => { e.preventDefault(); open(input.value); });
  budget.addEventListener("input", link);
  const fromLink = location.hash.slice(1);
  if (fromLink) { input.value = fromLink; open(fromLink); }
  addEventListener("hashchange", () => { const c = location.hash.slice(1); if (c && normaliseCode(c) !== code) { input.value = c; open(c); } });
}
