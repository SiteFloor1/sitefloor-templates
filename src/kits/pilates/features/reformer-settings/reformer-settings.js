// @ts-check
/**
 * Your reformer settings. The card reads the link's hash (lib settingsFromHash: anything out of range is dropped, an
 * empty link shows no card), or the copy kept on this phone. "Keep on this phone" saves it in the phone's own browser
 * storage; nothing is sent anywhere. Teachers make the link with the form and share it from the phone's own share
 * sheet (WhatsApp, Messages, email), or copy it.
 */
import { settingsFromHash, settingsToHash, cleanText } from "../../lib/members.js";

const KEY = "sf-reformer-settings";
/** @param {() => any} f */
const safe = (f) => { try { return f(); } catch { return null; } };

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const m = /** @type {any} */ (ctx.data).pilates?.machine;
  const q = (/** @type {string} */ s) => /** @type {HTMLElement|null} */ (root.querySelector(s));
  const card = q("[data-rs-card]"), none = q("[data-rs-none]"), who = q("[data-rs-who]"), note = q("[data-rs-note]");
  const keep = /** @type {HTMLButtonElement|null} */ (q("[data-rs-keep]")), forget = /** @type {HTMLButtonElement|null} */ (q("[data-rs-forget]"));
  const form = /** @type {HTMLFormElement|null} */ (q("[data-rs-form]")), link = /** @type {HTMLInputElement|null} */ (q("[data-rs-link]"));
  const send = /** @type {HTMLButtonElement|null} */ (q("[data-rs-send]")), copy = q("[data-rs-copy]"), copied = q("[data-rs-copied]");
  if (!m || !card || !none || !who || !note || !keep || !forget || !form || !link || !send || !copy || !copied) throw new Error("reformer settings markup missing");
  const set = (/** @type {string} */ sel, /** @type {string} */ text) => { const el = q(sel); if (el) el.textContent = text; };
  let hash = "";

  /** @param {import("../../lib/members.js").Settings|null} s */
  const show = (s) => {
    card.hidden = !s; none.hidden = Boolean(s);
    if (!s) return;
    who.textContent = s.name ? `${s.name}'s reformer` : "Your reformer";
    const springs = q("[data-rs-springs]");
    if (springs) springs.replaceChildren(...m.springs.filter((/** @type {any} */ sp) => s.springs[sp.id]).map((/** @type {any} */ sp) => {
      const row = document.createElement("span"); row.className = "pl-sp";
      const marks = document.createElement("span"); marks.className = "pl-sp-m"; marks.setAttribute("aria-hidden", "true");
      for (let i = 0; i < s.springs[sp.id]; i++) marks.append(document.createElement("i"));
      row.append(marks, `${s.springs[sp.id]} × ${sp.name}`);
      return row;
    }));
    if (springs && !springs.childElementCount) springs.textContent = "None";
    set("[data-rs-footbar]", s.footbar ? `Position ${s.footbar} of ${m.footbar}` : "Ask your teacher");
    set("[data-rs-headrest]", s.headrest ? s.headrest[0].toUpperCase() + s.headrest.slice(1) : "Ask your teacher");
    set("[data-rs-straps]", s.straps ? s.straps[0].toUpperCase() + s.straps.slice(1) : "Ask your teacher");
    set("[data-rs-gear]", s.gear ? `${s.gear} of ${m.gear}` : "Ask your teacher");
    note.textContent = s.note; note.hidden = !s.note;
  };

  const load = () => {
    hash = location.hash.replace(/^#/, "");
    const fromLink = settingsFromHash(hash, m);
    const saved = safe(() => localStorage.getItem(KEY)) ?? "";
    const s = fromLink ?? settingsFromHash(saved, m);
    if (!fromLink && s) hash = saved;
    show(s);
    const isSaved = Boolean(s) && saved === hash;
    keep.hidden = isSaved; forget.hidden = !isSaved;
  };
  keep.addEventListener("click", () => { safe(() => localStorage.setItem(KEY, hash)); load(); });
  forget.addEventListener("click", () => { safe(() => localStorage.removeItem(KEY)); if (!settingsFromHash(location.hash, m)) history.replaceState(null, "", location.pathname); load(); });
  window.addEventListener("hashchange", load);

  const make = () => {
    const v = (/** @type {string} */ n) => (/** @type {HTMLInputElement|null} */ (form.querySelector(`[name="${n}"]`))?.value ?? "");
    /** @type {Record<string, number>} */
    const springs = {};
    for (const sp of m.springs) { const n = Number(v(`rs-s-${sp.id}`)); if (Number.isInteger(n) && n > 0) springs[sp.id] = Math.min(n, m.maxPerSpring); }
    const h = settingsToHash({ name: cleanText(v("rs-name"), 30), springs, footbar: Number(v("rs-f")) || 1, headrest: v("rs-h"), straps: v("rs-t"), gear: Number(v("rs-g")) || 1, note: cleanText(v("rs-x"), 140) }, m);
    const url = `${location.origin}${location.pathname}#${h}`;
    link.value = url;
  };
  const copyLink = () => {
    navigator.clipboard?.writeText(link.value).then(() => { copied.textContent = "Copied."; }, () => { link.select(); copied.textContent = "Selected: copy it from here."; });
  };
  send.addEventListener("click", () => {
    if (typeof navigator.share === "function") navigator.share({ text: m.message, url: link.value }).catch(() => {});
    else { copyLink(); }
  });
  form.addEventListener("input", make);
  copy.addEventListener("click", copyLink);
  make();
  load();
}
