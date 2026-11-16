// @ts-check
/**
 * The room strip: bedrooms, bathrooms and how often go in; visit() (src/kits/cleaning/lib/visit.js) gives every room's
 * minutes and the price; the line, the ruler, the columns and the room detail are redrawn from that one result. The
 * columns are kept, so their widths ease to the new minutes. The choice is shared (`cleaningChoice`) for the bill.
 */
import { visit, visitWords, ruler, hm } from "../../lib/visit.js";

/** @param {string} s */
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), cfg = data.cleaning?.visit;
  const q = (/** @type {string} */ s) => /** @type {HTMLElement|null} */ (root.querySelector(s));
  const say = q("[data-st-say]"), ctl = q("[data-st-ctl]"), R = q("[data-st-ruler]"), S = q("[data-st-rooms]"), D = q("[data-st-detail]");
  if (!cfg || !say || !ctl || !R || !S || !D) throw new Error("room strip markup or config missing");
  const choice = { ...cfg.defaults, extras: /** @type {string[]} */ ([]) };
  // the controls are live before the script runs: start from whatever is ticked
  const picked = (/** @type {string} */ n) => /** @type {HTMLInputElement|null} */ (ctl.querySelector(`input[name="${n}"]:checked`))?.value;
  if (picked("beds")) choice.beds = Number(picked("beds")); if (picked("baths")) choice.baths = Number(picked("baths"));
  if (picked("freq")) choice.freq = /** @type {any} */ (picked("freq"));
  let open = /** @type {string|null} */ (null), touched = false, v = visit(cfg, choice);

  const fit = () => {
    const w = S.clientWidth, parts = [...v.rooms, ...v.extras];
    const least = Math.min(...parts.map((p) => p.min)) / v.work * w;
    S.style.setProperty("--n", `${Math.max(26, Math.min(92, least * 0.52))}px`);
    S.style.setProperty("--per", `${w / v.work}px`);
  };
  const detail = () => {
    const parts = [...v.rooms, ...v.extras], r = parts.find((p) => p.id === open) ?? v.rooms[0];
    D.innerHTML = r.extra
      ? `<h2>${esc(r.name)}<span>${hm(r.min)}</span></h2><ul><li>Added to this visit, at the same hourly rate</li></ul><p></p>`
      : `<h2>${esc(r.name)}<span>${hm(r.min)}${open ? "" : '<span class="cl-tap"> · tap any room</span>'}</span></h2><ul>${r.tasks.map((t) => `<li>${esc(t)}</li>`).join("")}</ul><p>${esc(r.not)}</p>`;
    D.toggleAttribute("data-open", Boolean(open));
    S.querySelectorAll(".cl-room").forEach((b) => b.setAttribute("aria-pressed", String(/** @type {HTMLElement} */ (b).dataset.id === open)));
  };
  const render = () => {
    v = visit(cfg, choice);
    const w = visitWords(choice, v, data.name ?? "");
    say.innerHTML = `${touched ? "Your" : "A"} ${esc(w.home)}: <b data-st-fig>${w.figures}</b>. ${touched ? '<a href="#bill" data-st-bill>See the bill</a>' : '<span data-st-hint>Change it to yours.</span>'}`;
    R.innerHTML = ruler(v.work).map((t) => `<i class="${t.label ? "cl-r30" : ""}" style="left:${t.at}%"></i>${t.label ? `<b style="left:${t.at}%">${t.label}</b>` : ""}`).join("") + `<b class="cl-r-end">${hm(v.work)}</b>`;
    const keep = new Map([...S.children].map((c) => [/** @type {HTMLElement} */ (c).dataset.id, c]));
    S.replaceChildren(...[...v.rooms, ...v.extras].map((r) => {
      const b = /** @type {HTMLButtonElement} */ (keep.get(r.id) ?? Object.assign(document.createElement("button"), { type: "button" }));
      b.dataset.id = r.id; b.className = `cl-room${r.extra ? " cl-extra" : ""}`; b.style.setProperty("--m", String(r.min));
      b.removeAttribute("aria-label");
      b.innerHTML = `<i class="cl-mins" aria-hidden="true"></i><span class="cl-n">${r.min}<small> min</small></span><span class="cl-nm"><span class="cl-k">${r.extra ? "extra" : `${r.tasks.length} tasks`}</span>${esc(r.name)}</span>`;
      return b;
    }));
    if (open && ![...v.rooms, ...v.extras].some((r) => r.id === open)) open = null;
    fit(); detail();
    ctx.share("cleaningVisit", { choice: { ...choice }, visit: v, words: w });
  };
  S.addEventListener("click", (e) => {
    const b = /** @type {HTMLElement|null} */ (/** @type {HTMLElement} */ (e.target).closest(".cl-room"));
    if (b) { open = open === b.dataset.id ? null : b.dataset.id ?? null; detail(); }
  });
  ctl.addEventListener("change", (e) => {
    const t = /** @type {HTMLInputElement} */ (e.target); touched = true;
    if (t.name === "freq") choice.freq = /** @type {any} */ (t.value); else if (t.name === "beds" || t.name === "baths") choice[t.name] = Number(t.value);
    render();
  });
  ctx.watch("cleaningExtras", (/** @type {string[]} */ ids) => { choice.extras = ids; touched = true; render(); });
  addEventListener("resize", fit);
  render();
}
