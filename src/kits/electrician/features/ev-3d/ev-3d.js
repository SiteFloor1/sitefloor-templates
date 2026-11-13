// @ts-check
/**
 * The charger on your driveway, in 3D. The slider and the port choice work before the 3D loads (they price the run
 * with the client's figures); "See it in 3D" loads three.js and the car on tap. The cable run is shared with the
 * EV check above, so its answer follows.
 */
import { cablePrice, pounds } from "../../lib/quotes.js";

const BOARD_X = -2.2; // keep in step with DRIVE.boardX in drive-scene.js
/** @param {number} x */
const run = (x) => Math.abs(x - BOARD_X) + 1;

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const ev = /** @type {any} */ (ctx.data).ev;
  const open = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-ev3-open]"));
  const canvas = /** @type {HTMLCanvasElement|null} */ (root.querySelector("[data-ev3-canvas]"));
  const xIn = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-ev3-x]"));
  const portIn = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-ev3-port]"));
  const load = /** @type {HTMLElement|null} */ (root.querySelector("[data-ev3-load]"));
  if (!ev || !open || !canvas || !xIn || !portIn || !load) throw new Error("ev-3d markup missing");
  const $ = (/** @type {string} */ s) => /** @type {HTMLElement|null} */ (root.querySelector(s));
  /** @type {Awaited<ReturnType<import("./drive-scene.js").driveScene>> | null} */ let drive = null;
  let leadNeeded = 0;

  const show = () => {
    const metres = run(Number(xIn.value));
    const capped = Math.min(metres, ev.maxMetres);
    const { extraMetres, price } = cablePrice(ev, capped);
    const runEl = $("[data-ev3-run]"); if (runEl) runEl.textContent = `about ${metres.toFixed(1)} m`;
    const priceEl = $("[data-ev3-price]");
    if (priceEl) priceEl.textContent = metres > ev.maxMetres ? "We'd survey the route first" : `${pounds(price)}${extraMetres ? ` (${extraMetres} m extra)` : ""}`;
    const leadEl = $("[data-ev3-lead]");
    if (leadEl && ev.leadMetres) leadEl.textContent = !leadNeeded ? `${ev.leadMetres} m` : leadNeeded <= ev.leadMetres ? `reaches, ${(ev.leadMetres - leadNeeded).toFixed(1)} m to spare` : `${(leadNeeded - ev.leadMetres).toFixed(1)} m short: move it nearer the port`;
    ctx.share("evRun", metres);
  };
  xIn.addEventListener("input", () => { drive?.setCharger(Number(xIn.value)); show(); });
  portIn.addEventListener("change", () => drive?.setPort(/** @type {any} */ (portIn.value)));
  root.querySelector("[data-ev3-form]")?.addEventListener("submit", (e) => e.preventDefault());

  open.addEventListener("click", () => {
    open.hidden = true; load.hidden = false; load.textContent = "Loading the driveway…";
    import("./drive-scene.js").then(async ({ driveScene }) => {
      canvas.hidden = false;
      drive = await driveScene(canvas, {
        model: `${document.querySelector('link[rel="icon"]')?.getAttribute("href")?.startsWith("/") ? "/" : ""}img/kit/ev-car.glb`,
        chargerX: Number(xIn.value), port: /** @type {any} */ (portIn.value),
        onProgress: (a, b) => { if (b) load.textContent = `Loading the car… ${Math.round((a / b) * 100)}%`; },
        onMove: (x, lead) => { xIn.value = x.toFixed(1); leadNeeded = lead; show(); },
      });
      load.hidden = true;
      root.classList.add("is-3d");
    }).catch((err) => {
      console.error("[sitefloor] the driveway in 3D could not start", err);
      canvas.hidden = true;
      load.textContent = "The 3D driveway can't open on this device. The slider still prices the cable run.";
    });
  });
  show();
}
