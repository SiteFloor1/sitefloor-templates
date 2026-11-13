// @ts-check
/** The family map: people by generation and the advisers they already have, kept in this browser only. */
import { readMap, emptyMap, mapText, ADVISERS } from "../../lib/family-map.js";

const KEY = "sf-family-map";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const personF = /** @type {HTMLFormElement|null} */ (root.querySelector("#fm-person"));
  const advF = /** @type {HTMLFormElement|null} */ (root.querySelector("#fm-adviser"));
  const advList = root.querySelector("[data-fm-adv]");
  const empty = /** @type {HTMLElement|null} */ (root.querySelector("[data-fm-empty]"));
  const said = root.querySelector("[data-fm-said]");
  if (!personF || !advF || !advList || !empty || !said) throw new Error("family map markup missing");
  /** @type {import("../../lib/family-map.js").FamilyMap} */
  let map = emptyMap();
  try { map = readMap(localStorage.getItem(KEY)); } catch { /* storage blocked: the map lives for this visit only */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(map)); } catch { /* not kept; still works on the page */ } };
  const id = () => Math.random().toString(36).slice(2, 9);

  /** @param {string} text @param {() => void} remove */
  const item = (text, remove) => {
    const li = document.createElement("li");
    const span = document.createElement("span"); span.textContent = text;
    const b = document.createElement("button"); b.type = "button"; b.className = "wm-fm-x"; b.textContent = "Remove";
    b.setAttribute("aria-label", `Remove ${text}`);
    b.addEventListener("click", () => { remove(); save(); draw(); });
    li.append(span, b);
    return li;
  };
  const draw = () => {
    root.querySelectorAll("[data-fm-gen]").forEach((ul) => {
      const g = Number(/** @type {HTMLElement} */ (ul).dataset.fmGen);
      ul.replaceChildren(...map.people.filter((p) => p.gen === g).map((p) => item(p.note ? `${p.name}, ${p.note}` : p.name, () => { map.people = map.people.filter((x) => x.id !== p.id); })));
    });
    advList.replaceChildren(...map.advisers.map((a) => item(`${a.role}: ${a.name}`, () => { map.advisers = map.advisers.filter((x) => x.id !== a.id); })));
    empty.hidden = map.people.length + map.advisers.length > 0;
  };
  personF.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(personF);
    const next = readMap({ ...map, people: [...map.people, { id: id(), name: fd.get("name"), gen: Number(fd.get("gen")), note: fd.get("note") }] });
    if (next.people.length === map.people.length) return;
    map = next; save(); draw();
    personF.reset(); /** @type {HTMLSelectElement} */ (personF.elements.namedItem("gen")).value = "1";
    /** @type {HTMLInputElement} */ (personF.elements.namedItem("name")).focus();
  });
  advF.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(advF);
    const role = String(fd.get("role"));
    const next = readMap({ ...map, advisers: [...map.advisers, { id: id(), role: ADVISERS.includes(role) ? role : ADVISERS[4], name: fd.get("name") }] });
    if (next.advisers.length === map.advisers.length) return;
    map = next; save(); draw(); advF.reset();
  });
  root.querySelector("[data-fm-copy]")?.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(mapText(map, ctx.data.name)); said.textContent = "Copied."; } catch { said.textContent = "Couldn't copy here. Use Print instead."; }
  });
  root.querySelector("[data-fm-print]")?.addEventListener("click", () => window.print());
  root.querySelector("[data-fm-clear]")?.addEventListener("click", () => { map = emptyMap(); save(); draw(); said.textContent = "Cleared."; });
  draw();
}
