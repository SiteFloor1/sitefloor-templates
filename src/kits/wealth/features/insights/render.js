// @ts-check
/** Insights drawn from the firm's sheet, in the same markup the build writes. Shared by the home section and the page. */
import { ukDate } from "../../lib/insights.js";

export const NOT_ADVICE = "General information, not advice";

/** @param {string} tag @param {string} [cls] @param {string} [text] */
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

/** The site's own photograph for an insight, from the templates the build wrote. @param {HTMLElement} root @param {string} key */
export function photo(root, key) {
  const t = /** @type {HTMLTemplateElement|null} */ (root.querySelector(`template[data-ins-photo="${CSS.escape(key)}"]`) ?? root.querySelector("template[data-ins-photo]"));
  return t ? /** @type {HTMLElement} */ (t.content.firstElementChild?.cloneNode(true)) : el("span");
}

/** @param {import("../../lib/insights.js").Insight} x */
function meta(x) {
  const m = el("span", "wm-ins-meta");
  m.append(el("span", "", x.category));
  const t = /** @type {HTMLTimeElement} */ (el("time", "", ukDate(x.date)));
  t.dateTime = x.date;
  m.append(t);
  return m;
}

/** A home card. @param {HTMLElement} root @param {import("../../lib/insights.js").Insight} x @param {string|undefined} page */
export function card(root, x, page) {
  const a = /** @type {HTMLAnchorElement} */ (el("a", "wm-ins-a"));
  if (page) a.href = `${page}#${x.id}`;
  a.append(photo(root, x.photo), meta(x), el("h3", "", x.title));
  const art = el("article", "wm-ins-card");
  art.append(a, el("span", "wm-ins-tag", NOT_ADVICE));
  return art;
}

/** An entry on the insights page, its full text folded under the summary. @param {HTMLElement} root @param {import("../../lib/insights.js").Insight} x */
export function entry(root, x) {
  const art = el("article", "wm-insp-e");
  art.id = x.id;
  art.dataset.cat = x.category;
  const body = el("div", "wm-insp-b");
  const d = /** @type {HTMLDetailsElement} */ (el("details", "wm-insp-d"));
  d.append(el("summary", "", "Read the full insight"));
  const full = el("div", "wm-insp-full");
  for (const p of x.body) full.append(el("p", "", p));
  full.append(el("p", "wm-insp-by", `${x.author ? `By ${x.author}. ` : ""}Approved for publication on ${ukDate(x.approvedOn)}.`));
  d.append(full);
  body.append(meta(x), el("h2", "", x.title), el("p", "wm-insp-s", x.summary), d, el("span", "wm-ins-tag", NOT_ADVICE));
  art.append(photo(root, x.photo), body);
  return art;
}
