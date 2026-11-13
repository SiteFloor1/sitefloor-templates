// @ts-check
/**
 * The mirror: opens a gown in three panes. The gown's first photograph sits in the middle; its next two angle in at
 * either side, as the side mirrors of a fitting room do. Escape, the Close button or a tap outside closes it.
 */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const dlg = /** @type {HTMLDialogElement} */ (root);
  const panes = root.querySelector("[data-gm-panes]"), name = root.querySelector("[data-gm-name]"), close = root.querySelector("[data-gm-close]");
  const more = root.querySelector("[data-gm-more]");
  if (!panes || !name || !close || !more || typeof dlg.showModal !== "function") throw new Error("mirror markup missing");
  /** @type {HTMLElement|null} */ let opener = null;

  const pane = (/** @type {HTMLElement} */ v, /** @type {string} */ side) => {
    const fig = document.createElement("figure"); fig.className = `bd-pane bd-pane-${side}`;
    const img = document.createElement("img");
    Object.assign(img, { src: v.dataset.src ?? "", alt: v.dataset.alt ?? "", width: Number(v.dataset.w), height: Number(v.dataset.h), decoding: "async" });
    const cap = document.createElement("figcaption"); cap.textContent = v.dataset.label ?? "";
    fig.append(img, cap);
    return fig;
  };

  document.addEventListener("click", (e) => {
    const btn = /** @type {HTMLElement|null} */ (/** @type {HTMLElement} */ (e.target).closest("[data-mirror]"));
    if (!btn) return;
    const card = btn.closest("[data-gown]");
    const views = /** @type {HTMLElement[]} */ ([...(card?.querySelectorAll("[data-views] li") ?? [])]);
    if (!card || views.length < 2) return;
    const [main, left, right, ...rest] = views;
    const order = right ? [pane(left, "l"), pane(main, "c"), pane(right, "r")] : [pane(left, "l"), pane(main, "c")];
    panes.replaceChildren(...order);
    panes.setAttribute("data-count", String(order.length));
    name.textContent = card.querySelector(".bd-gown-n")?.textContent ?? "";
    more.textContent = rest.length ? `And ${rest.length} more ${rest.length === 1 ? "photograph" : "photographs"} at your appointment.` : "";
    opener = btn;
    dlg.showModal();
  });
  close.addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", () => { opener?.focus(); });
}
