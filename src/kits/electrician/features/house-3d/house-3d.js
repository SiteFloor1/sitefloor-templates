// @ts-check
/**
 * The house in 3D. "Light the house" loads the model (villa-scene.js, three.js) over its still, and the house lights up
 * room by room. Then the keypad sets a scene, the colour slider sets the light's colour, a tap on a room lights it and
 * flies to it, and "Lit now" opens the quote for the lit rooms. The rooms and the quote work on their own when 3D can't
 * start (no WebGL, an old phone). Prices only from site.json ("house3d").
 */
import { houseQuote, pounds, quoteText } from "../../lib/quotes.js";
import { ROOMS, SCENE_LEVELS, LIGHT_UP_ORDER } from "../../lib/house.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).house3d;
  const q = (/** @type {string} */ s) => /** @type {HTMLElement} */ (root.querySelector(s));
  const open = /** @type {HTMLButtonElement} */ (q("[data-h3-open]"));
  const canvas = /** @type {HTMLCanvasElement} */ (q("[data-h3-canvas]"));
  const stage = q("[data-h3-stage]"), tags = q("[data-h3-tags]"), load = q("[data-h3-load]"), bar = q("[data-h3-bar]");
  const panel = q("[data-h3-panel]"), hint = q("[data-h3-hint]"), whole = q("[data-h3-whole]"), quoteBtn = q("[data-h3-quote]");
  const warm = /** @type {HTMLInputElement} */ (q("[data-h3-warm]"));
  if (!cfg || !open || !canvas || !panel || !bar) throw new Error("house-3d markup missing");
  const roomBtns = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-h3-room]")]);
  const sceneBtns = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-h3-scene]")]);
  for (const b of roomBtns) /** @type {HTMLElement} */ (b.querySelector("[data-h3-room-name]")).textContent = /** @type {any} */ (ROOMS)[b.dataset.h3Room ?? ""]?.label ?? "";

  /** @type {Record<string, number>} */ let levels = {};
  let scene = "off";
  /** @type {ReturnType<import("./villa-scene.js").villaScene> | null} */ let house = null;
  let started = false;

  const lit = () => cfg.rooms.map((/** @type {any} */ r) => r.id).filter((/** @type {string} */ id) => (levels[id] ?? 0) > 0);
  const update = (/** @type {{ order?: string[], gap?: number }} */ opt = {}) => {
    const on = lit();
    for (const b of roomBtns) b.setAttribute("aria-pressed", String(on.includes(b.dataset.h3Room)));
    for (const b of sceneBtns) b.setAttribute("aria-pressed", String(b.dataset.h3Scene === scene));
    const quote = houseQuote(cfg.types, cfg.rooms, on);
    q("[data-h3-lines]").replaceChildren(...quote.lines.map((l) => {
      const li = document.createElement("li"); const a = document.createElement("span"); const b = document.createElement("b");
      a.textContent = `${l.count} × ${l.name}`; b.textContent = pounds(l.total); li.append(a, b); return li;
    }));
    q("[data-h3-total]").textContent = pounds(quote.total);
    q("[data-h3-mini]").textContent = pounds(quote.total);
    const names = on.map((/** @type {string} */ id) => /** @type {any} */ (ROOMS)[id].label).join(", ");
    /** @type {HTMLAnchorElement} */ (q("[data-h3-send]")).href = ctx.waHref(`${cfg.message}\n\nRooms: ${names || "none yet"}\n${quoteText(quote.lines)}\nWebsite price for the fittings: ${pounds(quote.total)}`);
    house?.setLevels(levels, opt);
    house?.setScreen(scene === "cinema");
  };
  /** @param {string} s @param {{ order?: string[], gap?: number }} [opt] */
  const setScene = (s, opt) => {
    scene = s;
    const base = SCENE_LEVELS[s] ?? {};
    levels = Object.fromEntries(cfg.rooms.map((/** @type {any} */ r) => [r.id, base[r.id] ?? 0]));
    // Goodnight: the rooms go out one after another, the bedroom last
    const order = opt?.order ?? (s === "off" ? [...LIGHT_UP_ORDER].reverse().filter((id) => id !== "bedroom").concat("bedroom") : []);
    update({ order, gap: opt?.gap ?? (s === "off" ? 0.35 : 0) });
  };
  /** @param {string} id */
  const toggle = (id) => {
    levels[id] = (levels[id] ?? 0) > 0 ? 0 : 0.85;
    scene = "custom";
    if (levels[id] > 0) { house?.focus(id); whole.hidden = !house; }
    house?.select(id);
    update();
  };
  const showTools = () => { bar.hidden = false; open.hidden = true; };

  const start = () => {
    if (started) return;
    started = true;
    open.disabled = true;
    load.hidden = false; load.textContent = "Wiring the house…";
    import("./villa-scene.js").then(({ villaScene }) => {
      stage.classList.add("is-live");
      // the still shows the garden and the pool lit and the house dark; the model starts the same way
      const outside = Object.fromEntries(["garden", "pool"].map((id) => [id, SCENE_LEVELS.evening[id] ?? 0]));
      house = villaScene(canvas, tags, {
        rooms: cfg.rooms,
        onPick: (id) => toggle(id),
        onFirstFrame: () => {
          stage.classList.add("is-3d");
          load.hidden = true; hint.hidden = false; showTools();
          house?.setWarmth(Number(warm.value));
          // then the house lights up: the landing first, room by room, the floor above, the cinema last
          setScene("evening", { order: LIGHT_UP_ORDER.filter((id) => !(id in outside)), gap: 0.55 });
        },
      });
      house.setLevels(outside, { instant: true });
    }).catch((err) => {
      console.error("[sitefloor] the house in 3D could not start", err);
      stage.classList.remove("is-live", "is-3d");
      load.textContent = "The house in 3D can't open on this device. The rooms and prices below still work.";
      showTools(); panel.hidden = false; quoteBtn.setAttribute("aria-expanded", "true");
      setScene("evening");
    });
  };

  open.addEventListener("click", start);
  for (const b of sceneBtns) b.addEventListener("click", () => { house?.focus(""); whole.hidden = true; setScene(b.dataset.h3Scene ?? "evening"); });
  for (const b of roomBtns) b.addEventListener("click", () => toggle(b.dataset.h3Room ?? ""));
  whole.addEventListener("click", () => { house?.focus(""); whole.hidden = true; });
  quoteBtn.addEventListener("click", () => {
    const show = panel.hidden;
    panel.hidden = !show; quoteBtn.setAttribute("aria-expanded", String(show));
    root.classList.toggle("is-quote", show);
  });
  warm.addEventListener("input", () => {
    q("[data-h3-warm-out]").textContent = `${warm.value} K`;
    house?.setWarmth(Number(warm.value));
  });
  // A tap on the hero's keypad carries on into the house once it is open.
  ctx.watch("scene", (/** @type {string} */ s) => { if (house && s && SCENE_LEVELS[s]) setScene(s); });
  update();
}
