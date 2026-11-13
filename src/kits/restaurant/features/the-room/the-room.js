// @ts-check
/**
 * The Room: pick an area or a table on the plan. The choice is shared as "seat" for the table request.
 * With The Table's group, tables too small for it are dimmed and the choice says so.
 */
/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  openDrawerOnLink(root);
  const tables = /** @type {SVGGElement[]} */ ([...root.querySelectorAll("[data-table]")]);
  const areas = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-rm-area]")]);
  const choice = root.querySelector("[data-rm-choice]"), fit = root.querySelector("[data-rm-fit]");
  if (!tables.length || !choice || !fit) throw new Error("the room markup missing");
  let area = "";
  /** @type {SVGGElement|null} */ let table = null;
  let party = 0;

  const paint = () => {
    for (const b of areas) b.setAttribute("aria-pressed", String(b.dataset.rmArea === area && !table));
    for (const t of tables) {
      const on = t === table;
      t.classList.toggle("sel", on);
      t.setAttribute("aria-pressed", String(on));
      t.classList.toggle("lit", !table && area !== "" && t.dataset.area === area);
      t.classList.toggle("small", party > 0 && Number(t.dataset.seats) < party);
    }
    /** @type {{ label: string }|null} */ let seat = null;
    if (table) {
      seat = { label: `${table.dataset.label} (${(table.dataset.areaName ?? "").toLowerCase()})` };
      choice.textContent = `${table.dataset.label} · ${table.dataset.areaName} · seats ${table.dataset.seats}`;
    } else if (area) {
      const name = areas.find((b) => b.dataset.rmArea === area)?.textContent ?? "";
      seat = { label: name.toLowerCase() };
      choice.textContent = name;
    } else choice.textContent = "Anywhere is fine";
    const seats = table ? Number(table.dataset.seats) : 0;
    const small = party > 0 && tables.some((t) => Number(t.dataset.seats) < party);
    fit.textContent = table && party > seats ? `This table seats ${seats}; for ${party} we'll find you a bigger one nearby.` : party ? `For your group of ${party}.${small ? " Faded tables are too small for it." : ""}` : "";
    ctx.share("seat", seat);
  };

  for (const b of areas) b.addEventListener("click", () => { area = b.dataset.rmArea ?? ""; table = null; paint(); });
  /** @param {SVGGElement} t */
  const pick = (t) => { table = table === t ? null : t; area = t.dataset.area ?? ""; paint(); };
  for (const t of tables) {
    t.addEventListener("click", () => pick(t));
    t.addEventListener("keydown", (e) => { const k = /** @type {KeyboardEvent} */ (e).key; if (k === "Enter" || k === " ") { e.preventDefault(); pick(t); } });
  }
  ctx.watch("group", (/** @type {{ count: number }|null} */ g) => { party = g?.count ?? 0; paint(); });
  paint();
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
