// @ts-check
/** What to gather: tabs, ticks kept in this browser only (try/catch: storage may be off), copy and email the list. */

const KEY = "sf-law-gather";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const tabs = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-ga-tab]")]);
  const lists = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-ga]")]);
  if (!lists.length) throw new Error("gather markup missing");
  /** @type {Record<string, boolean>} */ let ticks = {};
  try { ticks = JSON.parse(localStorage.getItem(KEY) ?? "{}") ?? {}; } catch { ticks = {}; }
  const boxes = /** @type {HTMLInputElement[]} */ ([...root.querySelectorAll("[data-ga-item]")]);
  for (const b of boxes) {
    b.checked = Boolean(ticks[b.dataset.gaItem ?? ""]);
    b.addEventListener("change", () => { ticks[b.dataset.gaItem ?? ""] = b.checked; try { localStorage.setItem(KEY, JSON.stringify(ticks)); } catch { /* storage off: ticks last for this visit */ } });
  }
  /** @param {HTMLElement} l */
  const text = (l) => `${l.querySelector("h2")?.textContent}\n\n${[...l.querySelectorAll("li")].map((li) => `${li.querySelector("input")?.checked ? "[x]" : "[ ]"} ${li.textContent?.trim()}`).join("\n")}`;
  for (const l of lists) {
    const mail = /** @type {HTMLAnchorElement} */ (l.querySelector("[data-ga-mail]"));
    mail.addEventListener("click", () => { mail.href = `mailto:?subject=${encodeURIComponent(l.querySelector("h2")?.textContent ?? "")}&body=${encodeURIComponent(text(l))}`; });
    const copy = /** @type {HTMLButtonElement} */ (l.querySelector("[data-ga-copy]"));
    copy.addEventListener("click", () => { navigator.clipboard?.writeText(text(l)).then(() => { copy.textContent = "Copied"; }, () => { copy.textContent = "Select and copy the list"; }); });
  }
  /** @param {string} id */
  const pick = (id) => { for (const t of tabs) t.setAttribute("aria-selected", String(t.dataset.gaTab === id)); for (const l of lists) l.hidden = l.dataset.ga !== id; };
  for (const t of tabs) t.addEventListener("click", () => pick(t.dataset.gaTab ?? ""));
  if (tabs.length) pick(tabs[0].dataset.gaTab ?? "");
  root.setAttribute("data-ready", "");
}
