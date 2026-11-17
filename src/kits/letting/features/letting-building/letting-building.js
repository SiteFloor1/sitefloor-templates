// @ts-check
/**
 * The lift indicator and the building in 3D. The plate shows each floor of the hero building with how many homes
 * are free on it (from the sheet, via letting-board); a lamp picks the floor and the list below follows. "See the
 * building" loads the illustration (building-scene.js and three.js, only then) over the photograph, with every free
 * home's windows lit; tapping a lit window opens that home. When 3D can't start (no WebGL), the photograph, the
 * plate and the list stay. A stale sheet lights no lamp and no window.
 */
import { free } from "../letting-board/load.js";

/** The look's palette for the illustration, from its custom properties. @param {HTMLElement} root */
function palette(root) {
  const cs = getComputedStyle(root);
  const v = (/** @type {string} */ k) => cs.getPropertyValue(`--b3-${k}`).trim();
  return { brick: v("brick"), stone: v("stone"), roof: v("roof"), iron: v("iron"), glass: v("glass"), glassLit: v("glass-lit"), glow: v("glow"),
    frame: v("frame"), accent: v("accent"), sky: v("sky"), groundLight: v("ground"), sun: v("sun") };
}

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).homes;
  const hero = /** @type {HTMLElement} */ (root.closest("[data-lbd-host]") ?? root.parentElement);
  const stage = /** @type {HTMLElement} */ (root.querySelector("[data-lbd-stage]"));
  const load = /** @type {HTMLButtonElement} */ (root.querySelector("[data-lbd-load]"));
  const status = /** @type {HTMLElement} */ (root.querySelector("[data-lbd-status]"));
  const lamps = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-lbd-floor]")]);
  const building = cfg.buildings.find((/** @type {any} */ b) => b.id === root.dataset.building);
  if (!stage || !load || !building) throw new Error("letting-building markup missing");
  /** @type {import("../letting-board/load.js").HomesState|null} */ let state = null;
  /** @type {string|null} */ let floor = null;
  /** @type {any} */ let api = null;
  const phone = () => matchMedia("(max-width: 820px)").matches;

  const paintLamps = () => {
    for (const b of lamps) {
      const f = building.floors.find((/** @type {any} */ x) => x.id === b.dataset.lbdFloor);
      const n = state ? free(state, building.id, f.id).length : 0;
      const note = /** @type {HTMLElement} */ (b.querySelector("[data-lbd-note]"));
      note.textContent = f.note ?? (!state?.ok ? "–" : n ? `${n} free` : "Let");
      /** @type {HTMLElement} */ (b.querySelector("[data-lbd-label]")).textContent = `${f.label}, ${f.note ?? (!state?.ok ? "not known" : n ? `${n} free` : "let")}`;
      b.classList.toggle("free", n > 0);
      b.disabled = !state?.ok || (!n && !f.note);
      b.setAttribute("aria-pressed", String(floor === f.id));
    }
  };
  const go = (/** @type {string|null} */ id) => { floor = id; paintLamps(); api?.setFloor(id); ctx.share("letting-floor", id); };
  for (const b of lamps) b.addEventListener("click", () => go(floor === b.dataset.lbdFloor ? null : b.dataset.lbdFloor ?? null));

  ctx.watch("letting", (/** @type {import("../letting-board/load.js").HomesState} */ s) => { state = s; paintLamps(); api?.setLive(s.ok); });
  ctx.watch("letting-picked", (/** @type {string|null} */ ref) => {
    if (!api) return;
    if (ref) { api.pick(ref); if (phone()) api.lift(true); } else { api.setFloor(floor); api.lift(false); }
  });

  load.addEventListener("click", async () => {
    load.disabled = true; load.setAttribute("aria-busy", "true"); status.textContent = "Loading the building…";
    try {
      if (!document.createElement("canvas").getContext("webgl2")) throw new Error("no WebGL");
      const { mountBuilding } = await import("./building-scene.js");
      const homes = state?.ok ? state.homes : [];
      const data = { floors: building.floors.map((/** @type {any} */ f) => ({ id: f.id, units: f.units.map((/** @type {string} */ ref) => {
        const h = homes.find((x) => x.ref === ref);
        return { id: ref, status: h?.status === "available" ? "available" : "let" };
      }) })) };
      api = mountBuilding(stage, {
        type: building.model, data, palette: palette(root), stale: !state?.ok, angle: 24, zoom: 1.05, lookAt: 0.45,
        shiftX: () => (phone() ? 0 : 0.08), reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
        onPick: (/** @type {{ id: string }} */ u) => ctx.share("letting-open", u.id),
      });
      hero.classList.add("is-3d");
      api.setFloor(floor);
      status.textContent = "";
    } catch {
      hero.classList.add("no-3d"); // the photograph, the plate and the list stay
      status.textContent = "The 3D building can't start on this device; the floors and homes still work.";
    } finally { load.removeAttribute("aria-busy"); }
  }, { once: true });
}
