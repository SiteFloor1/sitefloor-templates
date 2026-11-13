// @ts-check
/**
 * Your table: a stand per guest. Each piece that isn't right for the chosen guest is marked with why ("has milk",
 * "not vegetarian"), and the note says whether the kitchen makes it differently (tea.swaps) or to ask. Each guest's
 * name is set on a place card; the champagne table adds a bottle poured at the table. The group, how each takes tea,
 * the place cards, the champagne, the occasion and the words for the plate are shared as "group" for the table request.
 */
import { canEat, reasons } from "../../lib/group.js";
import { standNote, standSummary, INSCRIPTION_MAX } from "../../lib/tearoom.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const tea = /** @type {any} */ (ctx.data).tea;
  const strip = root.querySelector("[data-yt-guests]"), whose = root.querySelector("[data-yt-whose]"), note = root.querySelector("[data-yt-note]");
  const occ = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-yt-occ]")), ins = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-yt-ins]"));
  const nameIn = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-yt-name]")), cards = root.querySelector("[data-yt-cards]");
  const items = /** @type {HTMLElement[]} */ ([...root.querySelectorAll(".yt-items [data-dish]")]);
  if (!tea || !strip || !whose || !note || !occ || !ins || !nameIn || !cards) throw new Error("your table markup or data missing");
  const dishes = items.map((el) => ({ el, d: { id: el.dataset.dish ?? "", name: "", diets: (el.dataset.diets ?? "").split(" ").filter(Boolean), allergens: (el.dataset.allergens ?? "").split(" ").filter(Boolean) }, base: el.querySelector("[data-yt-why]")?.textContent ?? "" }));
  const first = tea.services[0].id;
  /** @type {{ service: string, name: string, diets: string[], avoid: string[] }[]} */
  const guests = [{ service: first, name: "", diets: [], avoid: [] }, { service: first, name: "", diets: [], avoid: [] }];
  const label = (/** @type {number} */ i) => guests[i].name.trim() || `Guest ${i + 1}`;
  let cur = 0;
  const radios = (/** @type {string} */ n) => /** @type {HTMLInputElement[]} */ ([...root.querySelectorAll(`input[name="${n}"]`)]);

  const drawStrip = () => {
    const btn = (/** @type {string} */ label, /** @type {() => void} */ on, /** @type {string} */ cls) => { const b = document.createElement("button"); b.type = "button"; b.className = cls; b.textContent = label; b.addEventListener("click", on); return b; };
    strip.replaceChildren(
      ...guests.map((_, i) => { const b = btn(label(i), () => { cur = i; drawAll(); }, "yt-g"); b.setAttribute("aria-pressed", String(i === cur)); return b; }),
      ...(guests.length < tea.maxGuests ? [btn("Add a guest", () => { guests.push({ service: first, name: "", diets: [], avoid: [] }); cur = guests.length - 1; drawAll(); }, "yt-add")] : []),
      ...(guests.length > 1 ? [btn(`Remove guest ${cur + 1}`, () => { guests.splice(cur, 1); cur = Math.min(cur, guests.length - 1); drawAll(); }, "yt-rm")] : []),
    );
  };
  const drawPanel = () => {
    const g = guests[cur];
    whose.textContent = label(cur);
    nameIn.value = g.name; nameIn.placeholder = `Guest ${cur + 1}`;
    for (const r of radios("yt-svc")) r.checked = r.value === g.service;
    for (const r of radios("yt-diet")) r.checked = r.value === (g.diets[0] ?? "");
    for (const c of radios("yt-avoid")) c.checked = g.avoid.includes(c.value);
  };
  const drawStand = () => {
    const g = guests[cur];
    for (const { el, d, base } of dishes) {
      const ok = canEat(g, d);
      if (ok) delete el.dataset.state; else el.dataset.state = tea.swaps ? "swap" : "not";
      const why = el.querySelector("[data-yt-why]");
      if (why) why.textContent = ok ? base : `${reasons(g, d).join(", ")}: ${tea.swaps ? "made differently for this guest" : "ask us"}`;
    }
    note.textContent = standNote(g, tea.tiers, tea.swaps);
  };
  // The place cards: one per guest, the name set in the house style.
  const drawCards = () => {
    cards.replaceChildren(...guests.map((g, i) => {
      const c = document.createElement("p"); c.className = "yt-card";
      const n = document.createElement("span"); n.className = "yt-card-n"; n.textContent = label(i);
      const s = document.createElement("span"); s.className = "yt-card-s"; s.textContent = tea.services.find((/** @type {any} */ x) => x.id === g.service)?.name ?? "";
      c.append(n, s);
      return c;
    }));
  };
  const share = () => {
    const pick = /** @type {HTMLInputElement|null} */ (root.querySelector('input[name="yt-champ"]:checked'))?.value;
    const champagne = (tea.bottles ?? []).find((/** @type {any} */ b) => b.id === pick) ?? null;
    drawCards();
    ctx.share("group", standSummary(guests, tea.services, { occasion: occ.value, inscription: ins.value.slice(0, INSCRIPTION_MAX), champagne }));
  };
  const drawAll = () => { drawStrip(); drawPanel(); drawStand(); share(); };

  root.addEventListener("change", (e) => {
    const t = /** @type {any} */ (e.target), g = guests[cur];
    if (t.name === "yt-svc") g.service = t.value;
    else if (t.name === "yt-diet") g.diets = t.value ? [t.value] : [];
    else if (t.name === "yt-avoid") g.avoid = radios("yt-avoid").filter((c) => c.checked).map((c) => c.value);
    else if (t.name === "yt-champ") { /* the table's bottle */ }
    else if (t === occ) { ins.disabled = !occ.value; if (!occ.value) ins.value = ""; }
    else return;
    drawStand(); share();
  });
  ins.addEventListener("input", share);
  nameIn.addEventListener("input", () => { guests[cur].name = nameIn.value.slice(0, 24); whose.textContent = label(cur); drawStrip(); share(); });
  drawAll();
}
