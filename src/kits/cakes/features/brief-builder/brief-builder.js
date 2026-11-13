// @ts-check
/**
 * Order a cake: guests and how it's served pick the tiers from the studio's chart (lib planCake); one flavour picker
 * per tier; the brief is written as it will be sent (lib briefText) and the button opens WhatsApp with it. Guests
 * arriving from the servings calculator (?guests=…&portion=…) are filled in.
 */
import { planCake, briefText, sizesWords, tiersWords } from "../../lib/cakes.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data).cakes;
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-bb-form]"));
  const guests = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-bb-guests]"));
  const cake = root.querySelector("[data-bb-cake]"), box = /** @type {HTMLElement|null} */ (root.querySelector("[data-bb-flavours]"));
  const pre = root.querySelector("[data-bb-preview]"), send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-bb-send]"));
  if (!data?.chart || !data.brief || !form || !guests || !cake || !box || !pre || !send) throw new Error("brief builder markup missing");
  const legend = box.querySelector("legend");
  const q = new URLSearchParams(location.search);
  if (Number(q.get("guests")) > 0) guests.value = String(Math.min(2000, Math.round(Number(q.get("guests")))));
  if (q.get("portion") === "dessert") { const d = /** @type {HTMLInputElement|null} */ (form.querySelector("#bb-dessert")); if (d) d.checked = true; }
  const val = (/** @type {string} */ sel) => /** @type {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement|null} */ (form.querySelector(sel))?.value ?? "";
  /** @type {number[]} */
  let shown = [];
  /** @param {number[]} sizes */
  const pickers = (sizes) => {
    if (sizes.join() === shown.join()) return;
    const kept = [...box.querySelectorAll("select")].map((s) => s.value);
    const rows = sizes.map((s, i) => {
      const label = document.createElement("label");
      label.htmlFor = `bb-fl-${i}`;
      const size = document.createElement("span");
      size.textContent = `${s} in`;
      const select = document.createElement("select");
      select.id = `bb-fl-${i}`;
      select.name = `fl-${i}`;
      select.append(new Option("Not sure yet", ""), ...data.flavours.map((/** @type {any} */ f) => new Option(f.name, f.name)));
      select.value = kept[i] ?? "";
      label.append(size, select);
      return label;
    });
    box.replaceChildren(...(legend ? [legend] : []), ...rows);
    shown = sizes;
  };
  const render = () => {
    const portion = /** @type {"finger"|"dessert"} */ (val("input[name=bb-portion]:checked") || "finger");
    const n = Math.round(Number(guests.value));
    const plan = n > 0 ? planCake(n, portion, data.chart) : null;
    cake.textContent = !n ? "How many guests?" : plan ? `${tiersWords(plan.sizes.length)}, ${sizesWords(plan.sizes)}` : "Bigger than our chart: we'll design it with you";
    pickers(plan ? plan.sizes : []);
    box.hidden = !plan;
    const text = briefText({
      intro: data.brief.intro, date: val("[data-bb-date]"), guests: n > 0 ? n : undefined, portion, sizes: plan?.sizes,
      flavours: [...box.querySelectorAll("select")].map((s) => s.value), finish: val("[data-bb-finish]"), venue: val("[data-bb-venue]").trim(), notes: val("[data-bb-notes]"),
    });
    pre.textContent = text;
    send.href = ctx.waHref(text);
    send.dataset.waText = text;
  };
  form.addEventListener("input", render);
  form.addEventListener("change", render);
  render();
}
