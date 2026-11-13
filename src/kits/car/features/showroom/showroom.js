// @ts-check
/**
 * The Showroom: every change reprices the build from the studio's own jobs and rewrites the WhatsApp message.
 * The page shows a still picture of a car of the visitor's size; the 3D car (./studio-3d.js and that size's model,
 * 1–4 MB) loads only when the visitor asks for it: the "Turn it in 3D" button, or picking a colour, a shade or a
 * wheel. Changing the vehicle size changes the car (and the picture, before 3D is open).
 * Illegal front shades can be previewed but are kept out of the build and the message, because a studio can't
 * legally fit them.
 */
import { priceBuild, buildMessage, hoursText } from "../../lib/pricing.js";
import { minimumLight, ruleText } from "../../lib/legality.js";

/**
 * How much of a car file has arrived: a percentage when the server sends the file's size, otherwise megabytes of the
 * size shown on the button.
 * @param {number} loaded bytes @param {number} total bytes, or 0 when unknown @param {string} mb the file's size in MB, as on the button
 */
export function progressText(loaded, total, mb) {
  if (total > 0) return `${Math.min(100, Math.round((loaded / total) * 100))}%`;
  return `${Math.min(Number(mb) || Infinity, loaded / 1048576).toFixed(1)} of ${mb} MB`;
}

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const d = /** @type {any} */ (ctx.data);
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-sr-form]"));
  const stage = /** @type {HTMLElement|null} */ (root.querySelector("[data-sr-stage]"));
  const box = /** @type {HTMLElement|null} */ (root.querySelector("[data-sr-3d]"));
  const canvas = /** @type {HTMLCanvasElement|null} */ (root.querySelector("[data-sr-canvas]"));
  const go = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-sr-go]"));
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-sr-send]"));
  if (!form || !stage || !box || !canvas || !go || !send || !d.vehicles || !d.tint || !d.wrap || !d.showroom) throw new Error("showroom markup or data missing");
  const $ = (/** @type {string} */ s) => /** @type {HTMLElement} */ (root.querySelector(s));
  const cfg = { jobs: d.jobs, tint: d.tint, wrap: d.wrap, showroom: d.showroom };
  /** @type {"wrap"|"tint"|"wheels"} */
  let view = "wrap";
  /** The window the Tint view looks at. @type {"windscreen"|"fronts"|"rear"} */
  let pane = "fronts";
  /** @type {Awaited<ReturnType<import("./studio-3d.js").studio>> | null} */
  let car = null;
  /** @type {Promise<void>|null} */
  let loading = null;
  /** @type {Record<string, { model: string, poster: string, small: string, mb: string, credit: { text: string, url: string, licence: string, licenceUrl: string } }>} */
  const cars = JSON.parse(canvas.dataset.cars ?? "{}");
  const poster = /** @type {HTMLImageElement|null} */ (root.querySelector("[data-sr-poster]"));
  let shown = ""; // the vehicle whose car is on the stage

  const read = () => {
    const f = new FormData(form);
    const val = (/** @type {string} */ k) => String(f.get(k) ?? "") || null;
    const vehicle = d.vehicles.find((/** @type {any} */ v) => v.id === val("vehicle")) ?? d.vehicles[0];
    const colour = val("wrap");
    return {
      vehicle,
      build: {
        vehicle: vehicle.id, before1985: f.has("before1985"),
        tint: Object.fromEntries(Object.keys(d.tint.jobs).map((w) => [w, val(`t-${w}`)])),
        wrap: colour ? { colour, finish: val("finish") ?? d.wrap.finishes[0].id } : null,
        wheels: val("wheels"), dechrome: f.has("dechrome"),
      },
      make: val("make") ?? "",
    };
  };

  /** What the 3D car should show for this build. @param {ReturnType<typeof read>["build"]} build */
  const lookOf = (build) => {
    const glass = (/** @type {string} */ w) => {
      const s = d.tint.shades.find((/** @type {any} */ x) => x.id === build.tint[w]);
      return { light: s ? s.light : 100, sheen: s?.sheen ?? null };
    };
    return {
      paint: d.wrap.colours.find((/** @type {any} */ c) => c.id === build.wrap?.colour)?.hex ?? null,
      finish: build.wrap?.finish ?? "gloss",
      rim: d.showroom.wheels?.colours.find((/** @type {any} */ c) => c.id === build.wheels)?.hex ?? null,
      glass: { windscreen: glass("windscreen"), fronts: glass("fronts"), rear: glass("rear") },
    };
  };

  /** The car for this vehicle: the picture before 3D is open, the 3D model after. @param {string} id */
  const showCar = (id) => {
    const c = cars[id];
    if (!c || id === shown) return;
    shown = id;
    const credit = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-sr-credit]"));
    if (credit) { credit.textContent = c.credit.text; credit.href = c.credit.url; }
    const lic = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-sr-licence]"));
    if (lic) { lic.textContent = c.credit.licence; lic.href = c.credit.licenceUrl; }
    const mb = root.querySelector("[data-sr-mb]");
    if (mb) mb.textContent = `${c.mb} MB`;
    if (poster && !car) { poster.srcset = `${c.small} 900w, ${c.poster} 1600w`; poster.src = c.poster; }
    if (car) { box.classList.add("loading"); box.dataset.pct = ""; car.swap(c.model).then(() => { box.classList.remove("loading"); camera(); }, () => box.classList.remove("loading")); }
  };

  const paint = () => {
    const { vehicle, build, make } = read();
    showCar(vehicle.id);
    car?.set(lookOf(build));
    /** @type {HTMLElement} */ ($("[data-sr-finishes]")).classList.toggle("off", !build.wrap);
    for (const row of root.querySelectorAll("[data-sr-win]")) {
      const min = minimumLight(/** @type {any} */ (/** @type {HTMLElement} */ (row).dataset.srWin), build.before1985);
      for (const chip of row.querySelectorAll("[data-light]")) chip.classList.toggle("nl", min !== null && Number(/** @type {HTMLElement} */ (chip).dataset.light) < min);
    }
    $("[data-sr-rule]").textContent = `${ruleText("fronts", build.before1985)} ${ruleText("windscreen", build.before1985)}`;

    const r = priceBuild(build, cfg);
    $("[data-sr-price]").textContent = `£${r.price.toLocaleString("en-GB")}`;
    $("[data-sr-hours]").textContent = r.hours ? `about ${hoursText(r.hours)}` : "nothing chosen yet";
    $("[data-sr-read]").replaceChildren(...(r.summary.length ? r.summary : ["As it left the factory"]).map((s) => Object.assign(document.createElement("span"), { textContent: s })));
    const refused = $("[data-sr-refused]");
    refused.hidden = !r.refused.length;
    refused.textContent = r.refused.map((x) => `${x.shade.name} on the ${x.window.toLowerCase()} is darker than the law allows. You can see it here, but we can't fit it, so it's not in your build.`).join(" ");
    send.href = ctx.waHref(buildMessage({ vehicle, make, ...r }));
    send.classList.toggle("off", !r.lines.length);
  };

  const camera = () => car?.view(view === "tint" ? pane : view);

  /** @param {string} next */
  const setView = (next) => {
    view = /** @type {any} */ (next);
    for (const t of root.querySelectorAll("[data-sr-view]")) t.setAttribute("aria-selected", String(/** @type {HTMLElement} */ (t).dataset.srView === view));
    for (const p of root.querySelectorAll("[data-sr-panel]")) /** @type {HTMLElement} */ (p).hidden = /** @type {HTMLElement} */ (p).dataset.srPanel !== view;
    stage.dataset.view = view;
    camera();
  };

  /** A tapped part on the 3D car opens what changes it. @param {string} part */
  const pick = (part) => {
    if (part === "wrap" || part === "wheels") setView(part);
    else if (part === "windscreen" || part === "fronts" || part === "rear") {
      pane = part;
      setView("tint");
      const row = root.querySelector(`[data-sr-win="${part}"]`);
      if (row) { row.classList.remove("flash"); requestAnimationFrame(() => row.classList.add("flash")); }
    }
  };

  /** @param {string} text */
  const label = (text) => { if (go.firstChild) go.firstChild.textContent = text; };

  /** How much of the car file has arrived: on the button the first time, over the old car when changing size. @param {number} loaded @param {number} total */
  const progress = (loaded, total) => {
    const pct = progressText(loaded, total, cars[shown]?.mb ?? "");
    if (car) box.dataset.pct = pct; else label(`Opening the studio… ${pct} `);
  };

  const load = () => {
    if (loading) return loading;
    box.classList.add("loading");
    go.disabled = true;
    label("Opening the studio… ");
    loading = import("./studio-3d.js")
      .then((m) => m.studio(canvas, { model: cars[shown]?.model ?? "", onPick: pick, onProgress: progress }))
      .then((c) => { car = c; paint(); camera(); box.classList.add("live"); box.classList.remove("loading"); })
      .catch(() => { box.classList.remove("loading"); label("3D couldn't open here "); });
    return loading;
  };

  root.querySelector("[role=tablist]")?.addEventListener("click", (e) => {
    const t = /** @type {HTMLElement|null} */ (/** @type {Element} */ (e.target).closest("[data-sr-view]"));
    if (t) setView(t.dataset.srView ?? "wrap");
  });
  root.querySelector("[role=tablist]")?.addEventListener("keydown", (e) => {
    const k = /** @type {KeyboardEvent} */ (e).key;
    if (k !== "ArrowRight" && k !== "ArrowLeft") return;
    const tabs = [...root.querySelectorAll("[data-sr-view]")];
    const i = (tabs.findIndex((t) => t.getAttribute("aria-selected") === "true") + (k === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length;
    /** @type {HTMLElement} */ (tabs[i]).focus();
    setView(/** @type {HTMLElement} */ (tabs[i]).dataset.srView ?? "wrap");
  });
  go.addEventListener("click", () => { load(); });
  // Picking something to change is asking to see it: the 3D car loads, and a shade turns the camera to its window.
  form.addEventListener("input", (e) => {
    const n = /** @type {HTMLInputElement} */ (e.target).name;
    paint();
    if (n.startsWith("t-")) { pane = /** @type {any} */ (n.slice(2)); if (view !== "tint") setView("tint"); else camera(); }
    if (/^(wrap|finish|wheels|t-)/.test(n)) load();
  });
  form.addEventListener("submit", (e) => e.preventDefault());
  paint();
}
