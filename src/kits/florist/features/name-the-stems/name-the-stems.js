// @ts-check
/**
 * Name the stems: rings over this week's photograph, placed where the florist marked each stem (on the photo as it's
 * cropped on this screen). A ring opens its name; "Name the stems" opens them all. Stems from the Sheet replace the
 * built ones; with no stems for the photo on show, nothing is drawn.
 */
import { startStudio } from "../../lib/studio.js";
import { stemsFromRows, coverPoint } from "../../lib/week.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const S = /** @type {any} */ (ctx.data).florist?.stems;
  const list = /** @type {HTMLUListElement|null} */ (root.querySelector("[data-stems-list]"));
  const all = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-stems-all]"));
  const fig = root.closest("figure");
  const img = /** @type {HTMLImageElement|null} */ (fig?.querySelector("img[data-week-photo]") ?? null);
  if (!S || !list || !all || !img) throw new Error("name the stems: markup or data missing");
  /** @type {import("../../lib/week.js").StemPoint[]} */
  let points = S.points;
  let photo = S.photo;
  const phone = matchMedia("(max-width: 760px)");

  const render = () => {
    list.replaceChildren();
    const show = img.dataset.weekPhoto === photo && points.length > 0;
    root.hidden = !show;
    if (!show) return;
    points.forEach((p, i) => {
      const li = document.createElement("li");
      li.className = "fl-nts-p";
      const b = document.createElement("button");
      b.type = "button"; b.className = "fl-nts-b"; b.setAttribute("aria-expanded", "false"); b.setAttribute("aria-controls", `stem-${i}`);
      const t = document.createElement("span");
      t.className = "fl-nts-t"; t.id = `stem-${i}`; t.textContent = p.note ? `${p.name} · ${p.note}` : p.name;
      b.setAttribute("aria-label", p.name);
      li.append(b, t);
      list.append(li);
      b.addEventListener("click", () => {
        const open = b.getAttribute("aria-expanded") !== "true";
        for (const o of list.querySelectorAll(".fl-nts-b")) o.setAttribute("aria-expanded", "false");
        if (open) b.setAttribute("aria-expanded", "true");
        all.setAttribute("aria-pressed", "false");
      });
    });
    place();
  };
  const place = () => {
    if (!img.naturalWidth) return;
    const box = { w: img.clientWidth, h: img.clientHeight, nw: img.naturalWidth, nh: img.naturalHeight };
    const onPhone = phone.matches && !!fig?.querySelector("source"); // the look's phone crop is on screen
    [...list.children].forEach((li, i) => {
      const p = points[i], el = /** @type {HTMLElement} */ (li);
      const x = onPhone ? p.px : p.x, y = onPhone ? p.py : p.y;
      if (x === undefined || y === undefined) { el.hidden = true; return; }
      const at = coverPoint(x, y, box);
      el.hidden = !at.inside;
      el.style.left = `${at.left}px`; el.style.top = `${at.top}px`;
      el.classList.toggle("to-left", at.left > box.w * 0.6);
    });
  };
  all.addEventListener("click", () => {
    const on = all.getAttribute("aria-pressed") !== "true";
    all.setAttribute("aria-pressed", String(on));
    for (const o of list.querySelectorAll(".fl-nts-b")) o.setAttribute("aria-expanded", String(on));
  });
  new ResizeObserver(place).observe(img);
  img.addEventListener("load", () => { render(); });
  // The week's photo can change from the Sheet; the stems follow it, or hide.
  new MutationObserver(render).observe(img, { attributes: true, attributeFilter: ["data-week-photo"] });
  startStudio(ctx);
  ctx.watch("studio", (/** @type {any} */ s) => {
    if (!s?.ok) return;
    const fromSheet = stemsFromRows(s.stem ?? {});
    if (fromSheet.length) { points = fromSheet; photo = s.week?.photo || img.dataset.weekPhoto || photo; render(); }
  });
  render();
}
