// @ts-check
/**
 * The 3D stage both 3D features share: the photograph stays until the visitor taps the button, then three.js and the
 * chosen car load (the button says how big that car's download is) and the 3D bay fades in over the photograph in the
 * same box, so nothing on the page moves. The car size (hatch, saloon, SUV) can be picked before or after: once the bay
 * is open, a new size swaps the car in place. The size is shared, so both 3D features show the same car. Without WebGL,
 * or if a car can't load, the photograph stays and the stage says why. The look's colours come from its tokens.
 */

const hasWebGL = () => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") ?? c.getContext("webgl")); } catch { return false; } };

/**
 * @param {HTMLElement} root the feature's section
 * @param {import("../../../../core/js/core.js").Ctx} ctx
 * @param {"correction"|"protection"} mode
 * @param {(bay: import("./bay-3d.js").Bay) => void} ready called once the car is on the stage
 */
export function stage(root, ctx, mode, ready) {
  const go = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-3d-go]"));
  const host = /** @type {HTMLElement|null} */ (root.querySelector("[data-3d-host]"));
  const box = /** @type {HTMLElement|null} */ (root.querySelector("[data-3d-stage]"));
  const msg = root.querySelector("[data-3d-msg]"), mb = root.querySelector("[data-3d-mb]");
  if (!go || !host || !box || !msg || !mb) throw new Error("3D stage markup missing");
  /** @type {Record<string, string>} */ const models = JSON.parse(host.dataset.models ?? "{}");
  /** @type {Record<string, string>} */ const sizes = JSON.parse(host.dataset.mb ?? "{}");
  let body = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-body-pick]:checked"))?.value ?? Object.keys(models)[0];
  /** @type {import("./bay-3d.js").Bay|null} */ let bay = null;
  const said = mode === "correction" ? "Drag to turn the car. Move the light below." : "Drag to turn the car.";
  const pick = async (/** @type {string} */ next) => {
    if (!(next in models)) return;
    body = next;
    mb.textContent = `${sizes[body] ?? ""} MB`;
    for (const r of /** @type {NodeListOf<HTMLInputElement>} */ (root.querySelectorAll("[data-body-pick]"))) r.checked = r.value === body;
    if (!bay) return;
    msg.textContent = "Loading the car…";
    try { await bay.car(body); msg.textContent = said; } catch { msg.textContent = "That car couldn't load. Try again, or pick another size."; }
  };
  root.addEventListener("change", (e) => {
    const t = /** @type {HTMLInputElement} */ (e.target);
    if (t.matches("[data-body-pick]")) ctx.share("detailBody", t.value);
  });
  ctx.watch("detailBody", (b) => { if (b !== body) pick(b); });
  /** @type {{ hex: string, finish: string, name: string }|null} */ let colour = null;
  paints(root, ctx, (c) => { colour = c; bay?.paint(c.hex, c.finish); });
  if (!hasWebGL()) { go.disabled = true; msg.textContent = "3D isn't available on this device; the photograph shows the same."; return; }
  let started = false;
  go.addEventListener("click", async () => {
    if (started) return;
    started = true;
    go.disabled = true;
    msg.textContent = "Loading the car…";
    const css = getComputedStyle(root);
    const tok = (/** @type {string} */ k, /** @type {string} */ d) => css.getPropertyValue(k).trim() || d;
    try {
      const { bay: open } = await import("./bay-3d.js");
      host.hidden = false;
      bay = await open(host, {
        models, body, mode,
        paint: tok("--car-paint", "#1c3a31"), ground: tok("--bg", "#0b0d0f"), line: tok("--tube", "#f4f7f8"), tape: tok("--tape", "#d8d4c8"),
        still: matchMedia("(prefers-reduced-motion: reduce)").matches,
        onFrame: () => { if (!box.classList.contains("is-3d")) { box.classList.add("is-3d"); msg.textContent = said; } },
      });
      go.hidden = true;
      if (colour) bay.paint(colour.hex, colour.finish);
      ready(bay);
    } catch {
      host.hidden = true;
      box.classList.remove("is-3d");
      go.disabled = false;
      started = false;
      msg.textContent = "The 3D car couldn't load. Try again, or see the photograph.";
    }
  });
}

/**
 * The studio's paint chart under the stage (the paint-chart feature): swatches from its sheet, the chosen colour shared
 * so both 3D features show it. Without the feature, or if the chart can't be read, nothing shows and the car keeps the
 * look's colour.
 * @param {HTMLElement} root @param {import("../../../../core/js/core.js").Ctx} ctx
 * @param {(c: { hex: string, finish: string, name: string }) => void} onPick
 */
function paints(root, ctx, onPick) {
  const box = /** @type {HTMLFieldSetElement|null} */ (root.querySelector("[data-paints]"));
  const row = root.querySelector("[data-paints-row]"), said = root.querySelector("[data-paints-name]");
  const provider = /** @type {{ load: (c: typeof ctx) => Promise<import("../../lib/paint.js").Chart> }|null} */ (ctx.providers.paintChart);
  if (!box || !row || !said || !provider) return;
  const group = `dt-paint-${Math.random().toString(36).slice(2, 7)}`;
  const show = (/** @type {any} */ c) => {
    said.textContent = `${c.name}, ${c.finish}`;
    for (const r of /** @type {NodeListOf<HTMLInputElement>} */ (row.querySelectorAll("input"))) r.checked = r.value === c.id;
    onPick(c);
  };
  provider.load(ctx).then((chart) => {
    if (!chart.ok) return;
    for (const c of chart.colours) {
      const label = document.createElement("label");
      label.className = "dt-paint";
      label.title = c.name;
      const input = Object.assign(document.createElement("input"), { type: "radio", name: group, value: c.id });
      input.setAttribute("aria-label", `${c.name}, ${c.finish}`);
      const dot = document.createElement("span");
      dot.className = `dt-paint-dot is-${c.finish}`;
      dot.style.backgroundColor = c.hex;
      label.append(input, dot);
      row.append(label);
    }
    row.addEventListener("change", (e) => {
      const c = chart.colours.find((x) => x.id === /** @type {HTMLInputElement} */ (e.target).value);
      if (c) ctx.share("detailPaint", c);
    });
    ctx.watch("detailPaint", (c) => show(c));
    box.hidden = false;
  }, () => {});
}
