// @ts-check
/**
 * Price by length. Tapping a length glides the cut line (and the price tag riding it) to that mark on the photograph,
 * and the hair below the line fades in place to a faint trace (its own layer, cut from the same photograph); going
 * longer, it fades back. Nothing moves but the line; with reduced motion the change is instant. The
 * price, the time and the WhatsApp message follow the length, the service and the stylist level. With "my usual" on,
 * the visitor can keep their choice on their own phone; the price opens on it next time.
 */
import { priceAt, minutesAt, hm, money, bookText } from "../../lib/hair.js";

const USUAL = "sf-hair-usual";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).menu;
  const q = (/** @type {string} */ s) => /** @type {HTMLElement|null} */ (root.querySelector(s));
  const frame = q("[data-lp-stage]"), fall = q("[data-lp-fall]");
  const price = q("[data-lp-price]"), time = q("[data-lp-time]"), note = q("[data-lp-note]");
  const ask = /** @type {HTMLAnchorElement|null} */ (q("[data-lp-ask]")), usual = /** @type {HTMLButtonElement|null} */ (q("[data-lp-usual]"));
  if (!cfg || !frame || !fall || !price || !time || !note || !ask) throw new Error("length-price markup missing");
  const lens = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-lp-len]")]);
  const svcs = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-lp-svc]")]);
  const lvls = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-lp-lvl]")]);
  const pressed = (/** @type {HTMLButtonElement[]} */ list, /** @type {string} */ key) => list.find((b) => b.getAttribute("aria-pressed") === "true")?.dataset[key] ?? list[0]?.dataset[key] ?? "";
  const st = { len: pressed(lens, "lpLen"), svc: pressed(svcs, "lpSvc") || cfg.services[0]?.id, lvl: pressed(lvls, "lpLvl") };
  const noteEnd = (note.textContent ?? "").replace(/^A skin test[^.]*\.\s*/, "");
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const y = (/** @type {string} */ id) => Number(lens.find((b) => b.dataset.lpLen === id)?.dataset.y ?? 1);
  const pc = (/** @type {number} */ n) => `${Math.round(n * 1000) / 10}%`;

  const render = () => {
    const s = cfg.services.find((/** @type {any} */ x) => x.id === st.svc), li = cfg.lengths.findIndex((/** @type {any} */ l) => l.id === st.len);
    const len = cfg.lengths[li], lvl = cfg.levels.find((/** @type {any} */ l) => l.id === st.lvl);
    if (!s || !len || !lvl) return;
    const p = priceAt(s, st.lvl, li);
    frame.style.setProperty("--y", String(y(st.len)));
    for (const b of lens) b.setAttribute("aria-pressed", String(b.dataset.lpLen === st.len));
    for (const b of svcs) b.setAttribute("aria-pressed", String(b.dataset.lpSvc === st.svc));
    for (const b of lvls) b.setAttribute("aria-pressed", String(b.dataset.lpLvl === st.lvl));
    price.textContent = p === null ? "Ask us" : money(p);
    time.textContent = p === null ? `Not with a ${lvl.name.toLowerCase()}` : `${len.name}, about ${hm(minutesAt(s, li))}`;
    note.textContent = `${s.skinTest && cfg.skinHours ? `A skin test at least ${cfg.skinHours} hours before. ` : ""}${noteEnd}`;
    ask.href = ctx.bookHref(bookText(cfg.message, { service: s.name, level: lvl.name, length: len.name }));
    if (usual) usual.textContent = saved() === key() ? "Kept as my usual" : "Keep as my usual";
  };

  /**
   * Fade the band of hair between the old line and the new one: out to the faint trace when shorter, back in when
   * longer. The kept hair (--keep) changes at once going shorter, and only after the fade going longer.
   * @param {string} from @param {string} to
   */
  let wait = 0;
  const cut = (from, to) => {
    clearTimeout(wait);
    const a = y(from), b = y(to);
    if (still.matches || a === b) { frame.style.setProperty("--keep", String(b)); return; }
    fall.style.clipPath = `inset(${pc(Math.min(a, b))} 0 ${pc(1 - Math.max(a, b))} 0)`;
    fall.classList.remove("is-out", "is-in");
    fall.style.transition = "none";
    fall.style.opacity = b < a ? "1" : "0";
    void fall.offsetWidth;
    fall.style.transition = "";
    fall.classList.add(b < a ? "is-out" : "is-in");
    if (b < a) frame.style.setProperty("--keep", String(b));
    else wait = window.setTimeout(() => { frame.style.setProperty("--keep", String(b)); fall.classList.remove("is-in"); fall.style.opacity = "0"; }, 820);
  };

  const key = () => `${st.svc}|${st.lvl}|${st.len}`;
  const saved = () => { try { return localStorage.getItem(USUAL) ?? ""; } catch { return ""; } };
  if (usual) {
    const [svc, lvl, len] = saved().split("|");
    if (cfg.services.some((/** @type {any} */ s) => s.id === svc) && lvls.some((b) => b.dataset.lpLvl === lvl) && lens.some((b) => b.dataset.lpLen === len)) Object.assign(st, { svc, lvl, len });
    usual.hidden = false;
    usual.addEventListener("click", () => { try { localStorage.setItem(USUAL, key()); } catch { /* storage unavailable */ } render(); });
  }

  for (const b of lens) b.addEventListener("click", () => { const from = st.len; st.len = b.dataset.lpLen ?? st.len; cut(from, st.len); render(); });
  for (const b of svcs) b.addEventListener("click", () => { st.svc = b.dataset.lpSvc ?? st.svc; render(); });
  for (const b of lvls) b.addEventListener("click", () => { st.lvl = b.dataset.lpLvl ?? st.lvl; render(); });
  render();
}
