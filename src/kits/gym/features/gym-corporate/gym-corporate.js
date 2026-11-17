// @ts-check
/** Corporate rate: a company typed (any case, spacing, "Ltd" or not) is matched against the club's own list. */

/** @param {string} s */
export const companyKey = (s) => s.toLowerCase().replace(/&/g, "and").replace(/\b(ltd|limited|plc|llp|uk|group)\b/g, "").replace(/[^a-z0-9]+/g, "");

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).gym.corporate;
  const q = /** @type {HTMLInputElement} */ (root.querySelector("#gc2-q")), out = /** @type {HTMLElement} */ (root.querySelector("[data-gc2-out]"));
  const ask = /** @type {HTMLAnchorElement} */ (root.querySelector("[data-gc2-ask]"));
  if (!cfg || !q || !out || !ask) return;
  const rates = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-rate]")]);
  const paint = () => {
    const k = companyKey(q.value);
    const hit = k.length >= 3 ? cfg.companies.find((/** @type {any} */ c) => companyKey(c.name) === k) : null;
    rates.forEach((r) => r.classList.toggle("is-yours", !!hit && r.dataset.rate === hit.rate));
    if (!k) { out.textContent = ""; ask.hidden = true; return; }
    if (hit) {
      const name = /** @type {HTMLElement} */ (root.querySelector(`[data-rate="${hit.rate}"] h2`))?.textContent ?? "";
      out.textContent = `${hit.name} has the ${name}.`;
      ask.hidden = true;
    } else {
      out.textContent = k.length >= 3 ? "Not on our list yet. Ask us, or ask your HR team to get in touch." : "";
      ask.hidden = k.length < 3;
      ask.href = ctx.waHref(`${cfg.message} I work at ${q.value.trim().replace(/[<>]/g, "")}.`);
    }
  };
  q.addEventListener("input", paint);
  root.querySelector("form")?.addEventListener("submit", (e) => e.preventDefault());
}
