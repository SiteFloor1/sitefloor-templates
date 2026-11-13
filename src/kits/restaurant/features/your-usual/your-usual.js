// @ts-check
/**
 * Your usual: builds a coffee from the café's own price list and draws it filling a glass. The price,
 * allergens and ready times come from src/kits/restaurant/lib/usual.js. The phone keeps "your usual" in
 * localStorage (never sent anywhere); the order goes on WhatsApp with any bakes from the counter.
 */
import { priceDrink, readyTimes, usualMessage, price, allergenLine } from "../../lib/usual.js";
import { formatTime12, DAY_NAMES, addDays } from "../../../../core/lib/hours.js";

/** How each kind of drink sits in the glass, as heights from the bottom (0–1 of the glass). */
const POURS = {
  "espresso": { shots: 2, mix: 0, foam: 0, art: false, kind: "black" },
  "long-black": { shots: 2, mix: .8, foam: 0, art: false, kind: "black" },
  "filter": { shots: 0, mix: .84, foam: 0, art: false, kind: "filter" },
  "cortado": { shots: 2, mix: .5, foam: .54, art: true, kind: "milk" },
  "flat-white": { shots: 2, mix: .8, foam: .85, art: true, kind: "milk" },
  "latte": { shots: 1, mix: .78, foam: .88, art: true, kind: "milk" },
  "cappuccino": { shots: 1, mix: .58, foam: .88, art: true, kind: "milk" },
  "mocha": { shots: 1, mix: .78, foam: .88, art: true, kind: "mocha" },
  "chai": { shots: 0, mix: .8, foam: .87, art: true, kind: "chai" },
  "hot-chocolate": { shots: 0, mix: .8, foam: .87, art: false, kind: "choc" },
  "matcha": { shots: 0, mix: .8, foam: .87, art: true, kind: "matcha" },
};
const SHOT = .07;
/** The glass, in the drawing's units: the liquid sits from y 328 (inside the thick base) up to y 110 at most. */
const BOTTOM = 328, H = 218, K = .3;
/** Inside half-width of the glass at a height (it widens towards the rim). @param {number} y */
const halfAt = (y) => 70 - 15 * (y - 96) / 232;
const KEY = "sitefloor:usual";

/**
 * How high each layer comes (0–1 of the glass): a syrup or chocolate base, the espresso, the milk, the foam.
 * More shots mean more espresso and a little less milk, as in a real cup.
 * @param {(typeof POURS)[keyof typeof POURS]} pour @param {{ syrup: string, shots: number }} c
 */
function levels(pour, c) {
  const base = (c.syrup ? .05 : 0) + (pour.kind === "mocha" ? .08 : 0);
  const esp = base + (pour.shots + c.shots) * SHOT * (pour.kind === "black" && pour.mix ? .6 : 1);
  const mix = pour.mix ? Math.max(pour.mix - (pour.kind === "milk" ? c.shots * .02 : 0), esp + .05) : esp;
  return { syrup: base, esp, mix, foam: pour.foam ? Math.max(pour.foam, mix + .03) : mix };
}

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  /** @type {import("../../lib/usual.js").UsualConfig & { drinks: (import("../../lib/usual.js").Drink & { pour?: string })[], milks: (import("../../lib/usual.js").Milk & { shade?: string })[] }} */
  const cfg = /** @type {any} */ (ctx.data).usual;
  const counter = /** @type {any} */ (ctx.data).counter;
  const $ = (/** @type {string} */ s) => /** @type {HTMLElement} */ (root.querySelector(s));
  const form = /** @type {HTMLFormElement} */ ($("[data-yu-form]"));
  const glass = /** @type {Element} */ (root.querySelector("[data-yu-glass]")), top = /** @type {Element} */ (root.querySelector("[data-yu-top]"));
  const order = $("[data-yu-order]"), lines = $("[data-yu-lines]"), times = $("[data-yu-times]"), send = /** @type {HTMLAnchorElement} */ ($("[data-yu-send]"));
  if (!cfg || !form || !glass || !order || !lines || !times || !send) throw new Error("your usual markup or data missing");
  const stage = /** @type {HTMLElement} */ (root.querySelector(".yu-stage"));
  let shots = 0;
  /** @type {ReturnType<typeof priceDrink>[]} */ const tray = [];
  /** @type {{ label: string }|null} */ let seat = null;
  const sizes = cfg.sizes.map((s) => s.ml);
  const minMl = Math.min(...sizes), maxMl = Math.max(...sizes);

  const read = () => {
    const f = new FormData(form);
    return { drink: String(f.get("drink")), size: String(f.get("size")), milk: String(f.get("milk") ?? ""), shots, syrup: String(f.get("syrup") ?? ""),
      decaf: f.get("decaf") === "on", hot: f.get("hot") === "on", cup: /** @type {any} */ (String(f.get("cup") ?? "takeaway")) };
  };
  /** @param {ReturnType<typeof priceDrink>["choice"]} c */
  const write = (c) => {
    const set = (/** @type {string} */ name, /** @type {string} */ v) => { const el = /** @type {HTMLInputElement|null} */ (form.querySelector(`[name="${name}"][value="${CSS.escape(v)}"]`)); if (el) el.checked = true; };
    set("drink", c.drink); set("size", c.size); if (c.milk) set("milk", c.milk); set("cup", c.cup);
    const syr = /** @type {HTMLSelectElement|null} */ (form.querySelector('[name="syrup"]')); if (syr) syr.value = c.syrup;
    for (const k of /** @type {const} */ (["decaf", "hot"])) { const el = /** @type {HTMLInputElement|null} */ (form.querySelector(`[name="${k}"]`)); if (el) el.checked = c[k]; }
    shots = c.shots;
  };

  /** The drawing: each layer's top as the front edge of the liquid seen from a little above, the surface with its
      art, the glass size; tweened by hand (Safari can't animate path shapes in CSS). */
  const svg = /** @type {SVGSVGElement} */ (root.querySelector(".yu-svg"));
  const paths = Object.fromEntries([...svg.querySelectorAll("[data-yu-layer]")].map((el) => [/** @type {SVGElement} */ (el).dataset.yuLayer ?? "", el]));
  const surface = /** @type {SVGEllipseElement} */ (svg.querySelector("[data-yu-surface]")), art = /** @type {SVGGElement} */ (svg.querySelector("[data-yu-art]"));
  const streak = /** @type {SVGPathElement} */ (svg.querySelector("[data-yu-streak]"));
  const yAt = (/** @type {number} */ f) => BOTTOM - Math.min(.96, f) * H;
  /** @param {number} t top of the layer (y) */
  const layerPath = (t) => { const hw = halfAt(t) + 3; return `M${150 - hw} ${t}A${hw} ${hw * K} 0 0 0 ${150 + hw} ${t}L240 400L60 400Z`; };
  let now = { syrup: 0, esp: 0, mix: 0, foam: 0, scale: 1 };
  let raf = 0;
  /** @param {typeof now} v @param {boolean} withArt */
  const paint = (v, withArt) => {
    paths.syrup?.setAttribute("d", layerPath(yAt(v.syrup)));
    paths.esp?.setAttribute("d", layerPath(yAt(v.esp)));
    paths.mix?.setAttribute("d", layerPath(yAt(v.mix)));
    paths.foam?.setAttribute("d", layerPath(yAt(v.foam)));
    const ty = yAt(v.foam), hw = halfAt(ty);
    top.setAttribute("transform", `translate(150 ${ty.toFixed(2)})`);
    surface.setAttribute("rx", hw.toFixed(2)); surface.setAttribute("ry", (hw * K).toFixed(2));
    art.setAttribute("transform", `scale(${(hw / 44).toFixed(3)} ${(hw / 44 * K * 1.25).toFixed(3)})`);
    art.style.opacity = withArt ? "" : "0";
    // A few streaks of espresso through the milk, as in a poured latte.
    const e = yAt(v.esp), m = yAt(v.mix);
    streak.setAttribute("d", e - m > 40 ? `M118 ${e}C104 ${e - (e - m) * .35} 140 ${e - (e - m) * .55} 126 ${m + 6}M178 ${e}C192 ${e - (e - m) * .4} 160 ${e - (e - m) * .6} 172 ${m + 10}` : "");
    glass.setAttribute("transform", `translate(150 342) scale(${v.scale.toFixed(3)}) translate(-150 -342)`);
  };

  /** Draw the glass for a drink: its size, the layers at their heights, the surface and art, steam, decaf, saucer. */
  const draw = (/** @type {ReturnType<typeof priceDrink>} */ p) => {
    const drink = cfg.drinks.find((d) => d.id === p.choice.drink) ?? cfg.drinks[0];
    const pour = POURS[/** @type {keyof typeof POURS} */ (drink.pour ?? (drink.milk ? "latte" : "long-black"))] ?? POURS.latte;
    const ml = cfg.sizes.find((s) => s.id === p.choice.size)?.ml ?? maxMl;
    const target = { ...levels(pour, p.choice), scale: maxMl === minMl ? 1 : .8 + .2 * (ml - minMl) / (maxMl - minMl) };
    const choc = pour.kind === "mocha" && !p.choice.syrup;
    const milk = cfg.milks.find((m) => m.id === p.choice.milk);
    root.dataset.yuKind = pour.kind;
    root.dataset.yuMilk = drink.milk ? milk?.shade ?? "white" : "none";
    root.dataset.yuCup = p.choice.cup;
    root.dataset.yuChoc = choc ? "yes" : "no";
    stage.classList.toggle("is-hot", p.choice.hot);
    stage.classList.toggle("is-decaf", p.choice.decaf);
    cancelAnimationFrame(raf);
    const from = now, t0 = performance.now(), dur = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 750;
    const step = (/** @type {number} */ t) => {
      const k = dur ? Math.min(1, (t - t0) / dur) : 1, ease = 1 - (1 - k) ** 3;
      now = /** @type {typeof now} */ (Object.fromEntries(Object.keys(target).map((key) => [key, from[/** @type {keyof typeof now} */ (key)] + (target[/** @type {keyof typeof now} */ (key)] - from[/** @type {keyof typeof now} */ (key)]) * ease])));
      paint(now, pour.art);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };

  const update = () => {
    // Only the sizes this drink comes in (set before reading, as a disabled choice reads as none); the milk
    // choice only for drinks made with milk.
    const drink = cfg.drinks.find((d) => d.id === read().drink) ?? cfg.drinks[0];
    for (const el of root.querySelectorAll("[data-yu-size]")) {
      const label = /** @type {HTMLElement} */ (el);
      const offered = drink.prices[label.dataset.yuSize ?? ""] !== undefined;
      label.hidden = !offered;
      /** @type {HTMLInputElement} */ (label.querySelector("input")).disabled = !offered;
    }
    const p = priceDrink(cfg, read());
    write(p.choice);
    /** @type {HTMLElement} */ ($("[data-yu-milks]")).hidden = !drink.milk;
    const out = root.querySelector("[data-yu-shots]");
    if (out) out.textContent = String(p.choice.shots);
    $("[data-yu-name]").textContent = p.label;
    $("[data-yu-price]").textContent = price(p.pence);
    const milk = drink.milk ? cfg.milks.find((m) => m.id === p.choice.milk) : null;
    $("[data-yu-all]").textContent = (p.allergens.length ? `Contains: ${allergenLine(p.allergens).toLowerCase()}.` : "None of the 14 allergens.") + (milk?.note ? ` ${milk.name}: ${milk.note}` : "");
    const size = cfg.sizes.find((s) => s.id === p.choice.size);
    $("[data-yu-cap]").textContent = `${size?.name ?? ""} · ${size?.ml ?? ""}ml · ${p.choice.cup === "here" ? "in a glass, to drink here" : p.choice.cup === "own" ? "in your own cup" : "to take away"}`;
    draw(p);
    return p;
  };

  // ---- your usual, kept on this phone ----
  /** @returns {ReturnType<typeof priceDrink>|null} */
  const saved = () => {
    try { const raw = localStorage.getItem(KEY); return raw ? priceDrink(cfg, JSON.parse(raw)) : null; } catch { return null; }
  };
  const showBack = () => {
    const u = saved();
    const back = $("[data-yu-back]");
    back.hidden = !u;
    if (u) { $("[data-yu-back-name]").textContent = u.short; $("[data-yu-back-price]").textContent = price(u.pence); }
    for (const t of document.querySelectorAll("[data-usual-ticket]")) {
      const el = /** @type {HTMLElement} */ (t);
      const name = el.querySelector("[data-usual-name]"), pr = el.querySelector("[data-usual-price]");
      el.dataset.saved = u ? "yes" : "no";
      if (name) name.textContent = u ? u.short : "Build your usual";
      if (pr) pr.textContent = u ? price(u.pence) : "";
    }
  };
  $("[data-yu-save]").addEventListener("click", () => {
    const p = update();
    try { localStorage.setItem(KEY, JSON.stringify(p.choice)); $("[data-yu-saved]").textContent = `Saved: ${p.short}. Next time it's one tap.`; }
    catch { $("[data-yu-saved]").textContent = "This browser won't save it (private browsing?), but you can still order."; }
    showBack();
  });

  // ---- the order ----
  const timeChoice = () => Number(/** @type {HTMLInputElement|null} */ (times.querySelector("input:checked"))?.value ?? NaN);
  const buildTimes = () => {
    const prev = timeChoice();
    const r = readyTimes(ctx.data.hours, ctx.now(), cfg.prepMinutes);
    const closed = /** @type {HTMLElement} */ ($("[data-yu-closed]"));
    times.replaceChildren(...r.times.map((t, i) => {
      const l = document.createElement("label"); l.className = "yu-chip";
      const inp = document.createElement("input"); inp.type = "radio"; inp.name = "yu-time"; inp.value = String(t); inp.checked = i === 0;
      l.append(inp, i === 0 ? `${formatTime12(t)} (soonest)` : formatTime12(t));
      return l;
    }));
    const keep = /** @type {HTMLInputElement|null} */ (times.querySelector(`input[value="${prev}"]`));
    if (keep) keep.checked = true;
    closed.hidden = r.times.length > 0 && r.opensAt === null;
    if (r.opensAt !== null) closed.textContent = `We're not open yet: the first drinks are ready a few minutes after we open at ${formatTime12(r.opensAt)}.`;
    else if (!r.times.length) {
      const n = r.nextOpen;
      const when = !n ? "" : n.date === addDays(ctx.now().date, 1) ? "tomorrow" : DAY_NAMES[new Date(`${n.date}T12:00:00Z`).getUTCDay()];
      closed.textContent = n ? `We're closed for orders now. Order ahead from ${formatTime12(n.minutes)} ${when}.` : "We're closed for orders now.";
    }
    send.hidden = !r.times.length;
  };
  const bakesChosen = () => [...root.querySelectorAll('[name="bake"]:checked')]
    .filter((el) => /** @type {HTMLElement} */ (el.closest("[data-bake]"))?.dataset.state !== "out")
    .map((el) => (counter?.bakes ?? []).find((/** @type {any} */ b) => b.id === /** @type {HTMLInputElement} */ (el).value))
    .filter(Boolean);
  const renderOrder = () => {
    order.hidden = !tray.length;
    lines.replaceChildren(...tray.map((p, i) => {
      const li = document.createElement("li");
      const n = document.createElement("span"); n.textContent = p.label;
      const pr = document.createElement("b"); pr.textContent = price(p.pence);
      const x = document.createElement("button"); x.type = "button"; x.className = "yu-x"; x.textContent = "Remove";
      x.setAttribute("aria-label", `Remove ${p.label}`);
      x.addEventListener("click", () => { tray.splice(i, 1); renderOrder(); });
      li.append(n, pr, x);
      return li;
    }));
    // Sold-out bakes can't be ticked.
    for (const el of root.querySelectorAll('[name="bake"]')) {
      const box = /** @type {HTMLInputElement} */ (el);
      const out = /** @type {HTMLElement} */ (box.closest("[data-bake]"))?.dataset.state === "out";
      box.disabled = out; if (out) box.checked = false;
    }
    const bakes = bakesChosen();
    const total = tray.reduce((s, p) => s + p.pence, 0) + bakes.reduce((s, b) => s + Math.round(b.price * 100), 0);
    $("[data-yu-total]").textContent = price(total);
    const all = [...new Set([...tray.flatMap((p) => p.allergens), ...bakes.flatMap((b) => b.allergens)])];
    $("[data-yu-oall]").textContent = all.length ? `Allergens in this order: ${allergenLine(all).toLowerCase()}.` : "No allergens listed in this order.";
    const here = tray.some((p) => p.choice.cup === "here");
    const seatLine = /** @type {HTMLElement} */ ($("[data-yu-seat]"));
    seatLine.hidden = !(seat && here);
    seatLine.textContent = seat && here ? `Where you'd like to sit: ${seat.label}. A preference; we'll do our best.` : "";
    const t = timeChoice();
    send.href = ctx.waHref(usualMessage(tray, bakes, {
      opening: cfg.message, time: Number.isFinite(t) ? t : ctx.now().minutes + cfg.prepMinutes,
      name: /** @type {HTMLInputElement} */ ($("[data-yu-who]")).value.trim() || undefined,
      seat: seat && here ? seat.label : undefined,
    }));
  };
  const add = (/** @type {ReturnType<typeof priceDrink>} */ p) => {
    if (tray.length >= 8) return;
    tray.push(p);
    renderOrder();
    order.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
  };
  $("[data-yu-add]").addEventListener("click", () => add(update()));
  $("[data-yu-again]").addEventListener("click", () => { const u = saved(); if (!u) return; write(u.choice); update(); add(u); });
  for (const b of root.querySelectorAll("[data-yu-shot]")) {
    b.addEventListener("click", () => { shots = Math.max(0, Math.min(cfg.maxShots, shots + Number(/** @type {HTMLElement} */ (b).dataset.yuShot))); update(); });
  }
  form.addEventListener("change", () => update());
  order.addEventListener("change", renderOrder);
  order.addEventListener("input", renderOrder);
  ctx.watch("seat", (/** @type {{ label: string }|null} */ s) => { seat = s; renderOrder(); });
  ctx.watch("tonight", () => renderOrder());
  ctx.everyMinute(() => { buildTimes(); renderOrder(); });

  const u = saved();
  if (u) write(u.choice);
  update();
  showBack();
  buildTimes();
  renderOrder();
}
