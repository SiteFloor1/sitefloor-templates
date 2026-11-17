// @ts-check
/** Milestones: the visitor's own pension years from their year of birth, under today's law. Nothing is stored or sent. */
import { milestones } from "../../lib/milestones.js";

const WHAT = { pension: "The earliest you can usually take money from a personal or workplace pension", state: "Your State Pension age" };

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-ms-form]"));
  const input = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-ms-yob]"));
  const list = root.querySelector("[data-ms-list]");
  const note = root.querySelector("[data-ms-note]");
  if (!form || !input || !list || !note) return; // the rules weren't checked recently: only the GOV.UK link shows
  form.classList.remove("if-wait");
  form.addEventListener("submit", (e) => e.preventDefault());
  const base = note.innerHTML;
  input.addEventListener("input", () => {
    list.replaceChildren();
    note.innerHTML = base;
    const v = input.value.trim();
    if (/\D/.test(v)) { note.insertAdjacentText("afterbegin", "Type your year of birth as four figures, like 1975. "); return; }
    if (v.length < 4) return;
    const r = milestones(Number(input.value.trim()), Date.now());
    if (!r.ok) {
      if (r.why === "changeover") note.insertAdjacentText("afterbegin", "Your year falls in a change-over, so the date depends on your birthday. ");
      if (r.why === "early") note.insertAdjacentText("afterbegin", "For years before 1960 the rules were different; GOV.UK has your dates. ");
      if (r.why === "year") note.insertAdjacentText("afterbegin", "Type a year between 1950 and 16 years ago. ");
      return;
    }
    for (const m of r.items) {
      const li = document.createElement("li");
      const y = document.createElement("span"); y.className = "if-ms-y"; y.textContent = String(m.year);
      const a = document.createElement("span"); a.className = "if-ms-a"; a.textContent = `at ${m.age}`;
      const w = document.createElement("span"); w.className = "if-ms-w"; w.textContent = WHAT[m.what];
      const s = document.createElement("small"); s.textContent = m.source;
      w.append(s); li.append(y, a, w); list.append(li);
    }
  });
}
