// @ts-check
/**
 * Your tray: "Set aside" on any piece adds it (up to three), kept in this browser only; the tab shows how many,
 * the panel lists them with Remove, and the request names them. Shared as ctx "tray" for the appointment request.
 */
import { trayText } from "../../lib/messages.js";

const KEY = "jw-tray";
const MAX = 3;

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const tab = /** @type {HTMLButtonElement} */ (root.querySelector("[data-tray-toggle]"));
  const panel = /** @type {HTMLElement} */ (root.querySelector("[data-tray-panel]"));
  const list = /** @type {HTMLElement} */ (root.querySelector("[data-tray-list]"));
  const n = /** @type {HTMLElement} */ (root.querySelector("[data-tray-n]"));
  const send = /** @type {HTMLAnchorElement} */ (root.querySelector("[data-tray-send]"));
  const say = /** @type {HTMLElement} */ (root.querySelector("[data-tray-say]"));
  /** @type {{ id: string, name: string }[]} */ let items = [];
  try { items = JSON.parse(localStorage.getItem(KEY) ?? "[]").filter((/** @type {any} */ x) => x && typeof x.id === "string" && typeof x.name === "string").slice(0, MAX); } catch { items = []; }

  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* private mode: the tray lasts this visit */ } };
  const paint = () => {
    root.hidden = !items.length;
    n.textContent = String(items.length);
    tab.setAttribute("aria-label", `Your tray, ${items.length} of ${MAX}`);
    list.replaceChildren(...items.map((p) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button"; b.className = "nc-label nc-btnlink"; b.textContent = "Remove"; b.dataset.trayRemove = p.id;
      b.setAttribute("aria-label", `Remove ${p.name} from your tray`);
      const s = document.createElement("span"); s.textContent = p.name;
      li.append(s, b);
      return li;
    }));
    const text = trayText({ house: ctx.data.name, pieces: items.map((p) => p.name) });
    send.href = ctx.waHref(text); send.dataset.waText = text;
    for (const b of document.querySelectorAll("[data-tray]")) {
      const on = items.some((p) => p.id === /** @type {HTMLElement} */ (b).dataset.tray);
      b.setAttribute("aria-pressed", String(on));
      b.textContent = on ? "On your tray" : "Set aside";
    }
    ctx.share("tray", items);
  };
  document.addEventListener("click", (e) => {
    const t = /** @type {Element} */ (e.target);
    const add = /** @type {HTMLElement|null} */ (t.closest("[data-tray]"));
    const rm = /** @type {HTMLElement|null} */ (t.closest("[data-tray-remove]"));
    if (add) {
      const id = add.dataset.tray ?? "";
      if (items.some((p) => p.id === id)) { items = items.filter((p) => p.id !== id); say.textContent = "Taken off your tray."; }
      else if (items.length >= MAX) { say.textContent = `Your tray holds ${MAX}. Take one off first.`; return; }
      else { items = [...items, { id, name: add.dataset.trayName ?? id }]; say.textContent = `Set aside. ${items.length} on your tray.`; }
      save(); paint();
    } else if (rm) {
      items = items.filter((p) => p.id !== rm.dataset.trayRemove); save(); paint();
      if (!items.length) tab.focus();
    }
  });
  tab.addEventListener("click", () => {
    const open = panel.hidden;
    panel.hidden = !open;
    tab.setAttribute("aria-expanded", String(open));
  });
  paint();
}
