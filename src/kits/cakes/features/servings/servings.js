// @ts-check
/**
 * How many are you feeding: the guests and how it's served pick the smallest cake from the studio's own chart
 * (lib planCake), drawn as a stack of tier sizes in type. Shares the answer as "cake" for the order page and the
 * phone bar.
 */
import { planCake, tiersWords, pounds, sizesWords } from "../../lib/cakes.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const chart = /** @type {any} */ (ctx.data).cakes?.chart;
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-sv-form]"));
  const range = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-sv-range]"));
  const n = root.querySelector("[data-sv-n]"), tiers = root.querySelector("[data-sv-tiers]");
  const cake = root.querySelector("[data-sv-cake]"), portions = root.querySelector("[data-sv-portions]"), from = root.querySelector("[data-sv-from]");
  const go = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-sv-go]"));
  if (!chart || !form || !range || !n || !tiers || !cake || !portions || !from) throw new Error("servings markup missing");
  const render = () => {
    const guests = Number(range.value);
    const portion = /** @type {"finger"|"dessert"} */ ((/** @type {HTMLInputElement|null} */ (form.querySelector("input[name=sv-portion]:checked")))?.value ?? "finger");
    const plan = planCake(guests, portion, chart);
    n.textContent = String(guests);
    if (!plan) {
      tiers.replaceChildren(Object.assign(document.createElement("span"), { className: "ck-tiers-ask", textContent: "Ask us" }));
      tiers.setAttribute("aria-label", "More than our biggest cake: ask us");
      cake.textContent = "Bigger than our chart";
      portions.textContent = "";
      from.textContent = "Ask us";
    } else {
      tiers.replaceChildren(...plan.sizes.map((s) => {
        const span = document.createElement("span");
        span.className = "ck-tier";
        span.style.setProperty("--d", String(s));
        span.textContent = `${s} in`;
        return span;
      }));
      tiers.setAttribute("aria-label", `${tiersWords(plan.sizes.length)}: ${sizesWords(plan.sizes)}`);
      cake.textContent = tiersWords(plan.sizes.length);
      portions.textContent = `${plan.portions} ${portion}`;
      from.textContent = plan.from ? pounds(plan.from) : "Ask us";
    }
    if (go) { go.textContent = `Order a cake for ${guests}`; go.search = `?guests=${guests}&portion=${portion}`; }
    const bar = document.querySelector("[data-sv-bar]");
    if (bar) bar.textContent = plan ? `${tiersWords(plan.sizes.length)} · ${guests} guests` : `${guests} guests · ask us`;
    ctx.share("cake", { guests, portion, plan });
  };
  range.addEventListener("input", render);
  form.addEventListener("change", render);
  root.querySelectorAll("[data-sv-step]").forEach((b) => b.addEventListener("click", () => {
    range.value = String(Math.min(Number(range.max), Math.max(Number(range.min), Number(range.value) + Number(/** @type {HTMLElement} */ (b).dataset.svStep))));
    render();
  }));
  render();
}
