// @ts-check
/**
 * The spec dial: one control turns seats, power, budget or "free on my dates". It drives the fleet page's own radio
 * filters (the no-JavaScript fallback stays the source of truth), so the grid below and the row of night photographs
 * here always agree. role="slider": arrows step, Home/End jump; each mark can be tapped. Nothing moves by itself; the
 * hand turns with a short ease, never under reduced motion.
 */
const STEPS = {
  seats: { values: ["", "2", "4", "5", "7"], words: (/** @type {string} */ v) => (v ? `${v}+` : "Any"), unit: "seats" },
  power: { values: ["", "300", "450", "600", "750"], words: (/** @type {string} */ v) => (v ? `${v}+` : "Any"), unit: "bhp" },
  budget: { values: ["", "300", "600", "1000", "2000"], words: (/** @type {string} */ v) => (v ? `£${Number(v).toLocaleString("en-GB")}` : "Any"), unit: "a day, at most" },
  dates: { values: ["off", "on"], words: (/** @type {string} */ v) => (v === "on" ? "On" : "Off"), unit: "free on my dates" },
};
const ARC = 270; const START = -135;

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const page = /** @type {HTMLElement|null} */ (root.closest("[data-feature='fleet-page']"));
  const found = /** @type {HTMLFormElement|null} */ (page?.querySelector("[data-fl-form]") ?? null);
  if (!page || !found) return;
  const form = found;
  const dial = /** @type {HTMLElement} */ (root.querySelector("[data-sd-dial]"));
  const hand = /** @type {SVGLineElement} */ (root.querySelector("[data-sd-hand]"));
  const ticks = /** @type {SVGGElement} */ (root.querySelector("[data-sd-ticks]"));
  const row = /** @type {HTMLElement} */ (root.querySelector("[data-sd-row]"));
  const count = /** @type {HTMLElement} */ (root.querySelector("[data-sd-count]"));
  const dates = /** @type {HTMLDetailsElement|null} */ (page.querySelector("[data-fl-dates]"));
  /** @type {keyof typeof STEPS} */ let mode = "seats";
  let datesOn = false;

  const radioValue = (/** @type {string} */ name) => /** @type {HTMLInputElement|null} */ (form.querySelector(`input[name="${name}"]:checked`))?.value ?? "";
  const index = () => (mode === "dates" ? (datesOn ? 1 : 0) : Math.max(0, STEPS[mode].values.indexOf(radioValue(mode))));

  /** Draw the marks for the mode, each one a tap target. */
  function drawTicks() {
    const n = STEPS[mode].values.length;
    ticks.innerHTML = STEPS[mode].values.map((v, i) => {
      const a = ((START + (ARC * i) / (n - 1)) * Math.PI) / 180;
      const [x1, y1, x2, y2, tx, ty] = [120 + 96 * Math.sin(a), 120 - 96 * Math.cos(a), 120 + 112 * Math.sin(a), 120 - 112 * Math.cos(a), 120 + 80 * Math.sin(a), 120 - 80 * Math.cos(a)];
      return `<g data-sd-tick="${i}" style="cursor:pointer"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--muted)" stroke-width="1"/>`
        + `<text x="${tx}" y="${ty + 4}" text-anchor="middle" font-size="11" fill="var(--muted)">${STEPS[mode].words(v).replace("£", "£")}</text>`
        + `<circle cx="${(x1 + x2) / 2}" cy="${(y1 + y2) / 2}" r="16" fill="transparent"/></g>`;
    }).join("");
  }

  function paint() {
    const n = STEPS[mode].values.length; const i = index();
    hand.style.transform = `rotate(${START + (ARC * i) / (n - 1)}deg)`;
    const v = STEPS[mode].values[i];
    const value = root.querySelector("[data-sd-value]"); const unit = root.querySelector("[data-sd-unit]");
    if (value) value.textContent = STEPS[mode].words(v);
    if (unit) unit.textContent = STEPS[mode].unit;
    dial.setAttribute("aria-valuemax", String(n - 1));
    dial.setAttribute("aria-valuenow", String(i));
    dial.setAttribute("aria-valuetext", `${mode === "dates" ? "Free on my dates" : mode[0].toUpperCase() + mode.slice(1)}: ${STEPS[mode].words(v)}${mode === "dates" ? "" : ` ${STEPS[mode].unit}`}`);
    for (const t of ticks.querySelectorAll("[data-sd-tick]")) t.querySelector("text")?.setAttribute("fill", Number(/** @type {HTMLElement} */ (t).dataset.sdTick) === i ? "var(--text)" : "var(--muted)");
  }

  /** Set the step for the current mode and filter. @param {number} i */
  function setIndex(i) {
    const n = STEPS[mode].values.length;
    const k = Math.max(0, Math.min(n - 1, i));
    if (mode === "dates") {
      datesOn = k === 1;
      if (datesOn && dates) { dates.open = true; }
      if (!datesOn) ctx.share("date-range:fleet", null);
    } else {
      const v = STEPS[mode].values[k];
      const input = /** @type {HTMLInputElement|null} */ (form.querySelector(`input[name="${mode}"][value="${v}"]`));
      if (input) { input.checked = true; form.dispatchEvent(new Event("change", { bubbles: true })); }
    }
    paint();
  }

  dial.addEventListener("keydown", (e) => {
    const i = index();
    const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (step) { e.preventDefault(); setIndex(i + step); }
    else if (e.key === "Home") { e.preventDefault(); setIndex(0); }
    else if (e.key === "End") { e.preventDefault(); setIndex(STEPS[mode].values.length - 1); }
  });
  ticks.addEventListener("click", (e) => {
    const t = /** @type {Element} */ (e.target).closest("[data-sd-tick]");
    if (t) { setIndex(Number(/** @type {HTMLElement} */ (t).dataset.sdTick)); dial.focus(); }
  });
  for (const b of root.querySelectorAll("[data-sd-mode]")) b.addEventListener("click", () => {
    mode = /** @type {any} */ (/** @type {HTMLElement} */ (b).dataset.sdMode);
    for (const x of root.querySelectorAll("[data-sd-mode]")) x.setAttribute("aria-pressed", String(x === b));
    drawTicks(); paint(); dial.focus();
  });

  // One row of night photographs: the cars the fleet page shows now, in its order.
  const cards = new Map([...page.querySelectorAll(".hr-fl-list > [data-car]")].map((el) => [/** @type {HTMLElement} */ (el).dataset.car, el]));
  ctx.watch("fleet:shown", (/** @type {string[]} */ ids) => {
    row.innerHTML = ids.map((id) => {
      const el = cards.get(id); const img = el?.querySelector("img"); const a = el?.querySelector("a");
      return img && a ? `<li><a href="${a.getAttribute("href")}"><img src="${img.getAttribute("src")}" alt="" width="${img.getAttribute("width")}" height="${img.getAttribute("height")}" loading="lazy" decoding="async"><span>${el?.querySelector(".hr-fc-name")?.textContent ?? ""}</span><small>${el?.querySelector(".hr-fc-from")?.textContent ?? ""}</small></a></li>` : "";
    }).join("");
    count.textContent = `${ids.length} ${ids.length === 1 ? "car fits" : "cars fit"}`;
  });
  form.addEventListener("change", paint);
  drawTicks(); paint();
}
