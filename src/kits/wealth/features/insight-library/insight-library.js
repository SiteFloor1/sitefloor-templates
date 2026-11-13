// @ts-check
/** The insights page: draws the firm's sheet when it publishes from one, filters by subject, opens the one linked by #id. */
import { entry } from "../insights/render.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const listEl = /** @type {HTMLElement|null} */ (root.querySelector("[data-insp-list]"));
  const filter = /** @type {HTMLElement|null} */ (root.querySelector("[data-insp-filter]"));
  const off = /** @type {HTMLElement|null} */ (root.querySelector("[data-ins-off]"));
  if (!listEl || !filter || !off) throw new Error("insights page markup missing");

  const chips = () => {
    const cats = [...new Set([...listEl.querySelectorAll("[data-cat]")].map((e) => /** @type {HTMLElement} */ (e).dataset.cat ?? ""))];
    filter.replaceChildren();
    if (cats.length < 2) return;
    for (const c of ["All subjects", ...cats]) {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = c;
      b.setAttribute("aria-pressed", String(c === "All subjects"));
      b.addEventListener("click", () => {
        for (const o of filter.querySelectorAll("button")) o.setAttribute("aria-pressed", String(o === b));
        for (const e of /** @type {NodeListOf<HTMLElement>} */ (listEl.querySelectorAll("[data-cat]"))) e.hidden = c !== "All subjects" && e.dataset.cat !== c;
      });
      filter.append(b);
    }
  };
  const openLinked = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    const art = id ? listEl.querySelector(`#${CSS.escape(id)}`) : null;
    if (!art) return;
    /** @type {HTMLDetailsElement|null} */ (art.querySelector("details"))?.setAttribute("open", "");
    art.scrollIntoView({ block: "start" });
  };

  const provider = ctx.providers.insights;
  if (!provider) { chips(); openLinked(); window.addEventListener("hashchange", openLinked); return; }
  provider.load(ctx).then((/** @type {any} */ r) => {
    if (r.ok) listEl.replaceChildren(...r.items.map((/** @type {any} */ x) => entry(root, x)));
    off.hidden = r.ok ? r.items.length > 0 : listEl.children.length > 0;
    chips(); openLinked();
  });
  window.addEventListener("hashchange", openLinked);
}
