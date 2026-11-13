// @ts-check
/**
 * The Table: guests around a drawn table, each with diets and allergies; every dish shows a dot per seat
 * (can or can't eat), dishes the whole table can eat come first, and the group is shared with the table
 * request ("group") and The Pass ("guests").
 */
import { canEat, tableView, reasons, groupSummary } from "../../lib/group.js";
import { dishData } from "../../lib/filter.js";
import { sittingToShow } from "../../lib/sittings.js";
import { DIETS, ALLERGENS } from "../../../../core/lib/allergens.js";

const NS = "http://www.w3.org/2000/svg";
const SHORT = { halal: "H", vegetarian: "V", vegan: "VG" };

/** @param {string} tag @param {Record<string, string|number>} attrs */
const svg = (tag, attrs) => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
};

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  openDrawerOnLink(root);
  const max = Number(root.dataset.max) || 12;
  const board = /** @type {SVGSVGElement|null} */ (root.querySelector("[data-tb-svg]"));
  const who = root.querySelector("[data-tb-who]"), sum = root.querySelector("[data-tb-sum]"), share = root.querySelector("[data-tb-share]");
  const dietBox = root.querySelector("[data-tb-diets]"), avoidBox = root.querySelector("[data-tb-avoid]");
  const add = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-tb-add]")), del = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-tb-del]"));
  const rows = /** @type {HTMLElement[]} */ ([...root.querySelectorAll(".tb-dish")]);
  const tabs = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-tb-tab]")]);
  const startEl = root.querySelector("[data-tb-start]");
  if (!board || !who || !sum || !share || !dietBox || !avoidBox || !add || !del || !rows.length) throw new Error("the table markup missing");

  /** @type {import("../../lib/group.js").Guest[]} */
  let guests = [];
  try { guests = JSON.parse(startEl?.textContent || "[]").map((/** @type {any} */ g) => ({ diets: g.diets ?? [], avoid: g.avoid ?? [] })); } catch { guests = []; }
  if (!guests.length) guests = [{ diets: [], avoid: [] }, { diets: [], avoid: [] }];
  let sel = 0;
  /** @type {string|null} */ let hover = null;
  const sittings = /** @type {any} */ (ctx.data).sittings ?? [];
  let sitting = sittingToShow(sittings, ctx.now()).id;
  const dishes = rows.map((el) => ({ el, d: dishData(el), share: el.hasAttribute("data-share"), sit: el.dataset.sit }));

  /** Seat positions around a long table, alternating sides. */
  const layout = () => {
    const n = guests.length, perSide = Math.max(2, Math.ceil(n / 2)), step = 92;
    const tw = perSide * step, W = tw + 80, H = 250, x0 = 40, ty = 95, th = 60;
    const seats = guests.map((_, i) => {
      const side = i % 2, k = Math.floor(i / 2);
      return { cx: x0 + step / 2 + k * step, cy: side === 0 ? ty - 42 : ty + th + 42, side };
    });
    return { W, H, x0, tw, ty, th, seats };
  };

  const draw = () => {
    const L = layout();
    board.setAttribute("viewBox", `0 0 ${L.W} ${L.H}`);
    board.replaceChildren();
    board.append(svg("rect", { class: "tb-top", x: L.x0, y: L.ty, width: L.tw, height: L.th, rx: 6 }));
    const hoverDish = hover ? dishes.find((x) => x.d.id === hover) : null;
    guests.forEach((g, i) => {
      const s = L.seats[i];
      const can = hoverDish ? canEat(g, hoverDish.d) : null;
      // the place setting on the table, in front of the seat
      const py = s.side === 0 ? L.ty + 16 : L.ty + L.th - 16;
      board.append(svg("circle", { class: `tb-plate${can === true ? " can" : can === false ? " cant" : ""}`, cx: s.cx, cy: py, r: 11 }));
      const avoid = g.avoid.length === 1 ? [`no ${(ALLERGENS.find((a) => a.id === g.avoid[0])?.name ?? g.avoid[0]).toLowerCase().replace("tree nuts", "nuts")}`] : g.avoid.length ? [`avoids ${g.avoid.length}`] : [];
      const tags = [...g.diets.map((d) => SHORT[/** @type {keyof typeof SHORT} */ (d)] ?? d), ...avoid].join(" · ");
      // The accessible name starts with what's visible on the seat (its number and tags), then says it in full.
      const full = `guest ${i + 1}${g.diets.length ? `, ${g.diets.join(", ")}` : ""}${g.avoid.length ? `, avoids ${g.avoid.join(", ")}` : ""}${i === sel ? ", selected" : ""}`;
      const g0 = svg("g", { class: `tb-seat${i === sel ? " sel" : ""}${can === true ? " can" : can === false ? " cant" : ""}`, "data-i": i, tabindex: 0, role: "button",
        "aria-label": `${i + 1}${tags ? ` ${tags}` : ""}: ${full}` });
      g0.append(svg("circle", { class: "tb-chair", cx: s.cx, cy: s.cy, r: 24 }));
      const num = svg("text", { class: "tb-num", x: s.cx, y: s.cy + 6, "text-anchor": "middle" }); num.textContent = String(i + 1);
      g0.append(num);
      if (tags) {
        const t = svg("text", { class: "tb-tag", x: s.cx, y: s.side === 0 ? s.cy - 32 : s.cy + 44, "text-anchor": "middle" }); t.textContent = tags;
        g0.append(t);
      }
      board.append(g0);
    });
  };

  const editor = () => {
    const g = guests[sel];
    who.textContent = `Guest ${sel + 1}`;
    for (const inp of /** @type {NodeListOf<HTMLInputElement>} */ (dietBox.querySelectorAll("input"))) inp.checked = g.diets.includes(inp.value);
    for (const inp of /** @type {NodeListOf<HTMLInputElement>} */ (avoidBox.querySelectorAll("input"))) inp.checked = g.avoid.includes(inp.value);
    del.disabled = guests.length <= 1;
    add.disabled = guests.length >= max;
  };

  const dishesView = () => {
    const shown = dishes.filter((x) => x.sit === sitting);
    const view = tableView(guests, shown.map((x) => x.d));
    let all = 0, allShare = 0;
    for (const x of dishes) x.el.hidden = x.sit !== sitting;
    shown.forEach((x, k) => {
      const v = view[k];
      const n = guests.length;
      if (v.count === n) { all++; if (x.share) allShare++; }
      x.el.style.order = String((n - v.count) * 100 + k);
      x.el.classList.toggle("all", v.count === n);
      x.el.classList.toggle("none", v.count === 0);
      const dots = x.el.querySelector("[data-tb-seats]");
      if (dots) dots.replaceChildren(...guests.map((_, i) => Object.assign(document.createElement("span"), { className: v.cant.includes(i) ? "no" : "yes", title: `Guest ${i + 1}` })));
      const why = x.el.querySelector("[data-tb-why]");
      if (why) why.textContent = v.count === n ? `Everyone can eat this${x.share ? ", and it's for sharing" : ""}.` : `${v.count} of ${n}. Not for ${v.cant.map((i) => `guest ${i + 1} (${reasons(guests[i], x.d).join(", ")})`).join("; ")}.`;
    });
    share.textContent = `${all} of ${shown.length} dishes work for the whole table${allShare ? `, ${allShare} of them for sharing` : ""}.`;
  };

  const publish = () => {
    const summary = groupSummary(guests);
    sum.textContent = summary;
    ctx.share("guests", guests.map((g) => ({ diets: [...g.diets], avoid: [...g.avoid] })));
    ctx.share("group", { count: guests.length, summary });
  };
  const all = () => { draw(); editor(); dishesView(); publish(); };

  board.addEventListener("click", (e) => {
    const seat = /** @type {Element} */ (e.target).closest(".tb-seat");
    if (seat) { sel = Number(seat.getAttribute("data-i")); draw(); editor(); }
  });
  board.addEventListener("keydown", (e) => {
    const k = /** @type {KeyboardEvent} */ (e).key;
    const seat = /** @type {Element} */ (e.target).closest(".tb-seat");
    if (seat && (k === "Enter" || k === " ")) { e.preventDefault(); sel = Number(seat.getAttribute("data-i")); draw(); editor(); /** @type {SVGElement|null} */ (board.querySelector(`.tb-seat[data-i="${sel}"]`))?.focus(); }
  });
  add.addEventListener("click", () => { if (guests.length < max) { guests.push({ diets: [], avoid: [] }); sel = guests.length - 1; all(); } });
  del.addEventListener("click", () => { if (guests.length > 1) { guests.splice(sel, 1); sel = Math.max(0, sel - 1); all(); } });
  dietBox.addEventListener("change", (e) => {
    const inp = /** @type {HTMLInputElement} */ (e.target);
    const g = guests[sel];
    g.diets = inp.checked ? [...new Set([...g.diets, inp.value])] : g.diets.filter((d) => d !== inp.value);
    // Vegan covers vegetarian: keep the marks tidy.
    if (inp.checked && inp.value === "vegan") g.diets = g.diets.filter((d) => d !== "vegetarian");
    if (inp.checked && inp.value === "vegetarian") g.diets = g.diets.filter((d) => d !== "vegan");
    g.diets = DIETS.map((d) => d.id).filter((d) => g.diets.includes(d));
    all();
  });
  avoidBox.addEventListener("change", (e) => {
    const inp = /** @type {HTMLInputElement} */ (e.target);
    const g = guests[sel];
    g.avoid = inp.checked ? [...new Set([...g.avoid, inp.value])] : g.avoid.filter((a) => a !== inp.value);
    all();
  });
  for (const r of rows) {
    r.addEventListener("pointerenter", () => { hover = r.dataset.dish ?? null; draw(); });
    r.addEventListener("pointerleave", () => { hover = null; draw(); });
  }
  tabs.forEach((t) => {
    t.setAttribute("aria-selected", String(t.dataset.tbTab === sitting));
    t.addEventListener("click", () => { sitting = t.dataset.tbTab ?? sitting; for (const x of tabs) x.setAttribute("aria-selected", String(x === t)); dishesView(); });
  });
  all();
}

/** The section's drawer opens when something links to the section (#table, #room). @param {HTMLElement} root */
function openDrawerOnLink(root) {
  const drawer = /** @type {HTMLDetailsElement|null} */ (root.querySelector("details[data-drawer]"));
  if (!drawer) return;
  const check = () => { if (location.hash === `#${root.id}`) drawer.open = true; };
  check();
  addEventListener("hashchange", check);
  document.addEventListener("click", (e) => { if (/** @type {HTMLElement} */ (e.target).closest(`a[href="#${root.id}"]`)) drawer.open = true; });
}
