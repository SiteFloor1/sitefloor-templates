// @ts-check
/**
 * The handover checklist: records collection and return on the customer's phone (local storage, per reference and
 * car), dated on the business's clock; shows what changed; sends the record on WhatsApp or saves it as a text file.
 * If the phone can't store, the record lives for the visit only and the page still sends it.
 */
import { fuelWords, cleanMiles, differences, recordText, storeKey } from "../../lib/check.js";
import { cleanRef } from "../../lib/sheet.js";
import { formatTime24 } from "../../../../core/lib/hours.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const hire = /** @type {any} */ (ctx.data).hire;
  const cars = JSON.parse(root.querySelector("[data-hc-cars]")?.textContent ?? "[]");
  const panels = /** @type {string[]} */ (hire.check.panels);
  const $ = (/** @type {string} */ s) => /** @type {any} */ (root.querySelector(s));
  const car = /** @type {HTMLSelectElement} */ ($("[data-hc-car]"));
  const ref = /** @type {HTMLInputElement} */ ($("[data-hc-ref]"));
  const fuel = /** @type {HTMLInputElement} */ ($("[data-hc-fuel]"));
  const miles = /** @type {HTMLInputElement} */ ($("[data-hc-miles]"));
  const photo = /** @type {HTMLImageElement} */ ($("[data-hc-photo]"));
  const send = /** @type {HTMLAnchorElement} */ ($("[data-hc-send]"));
  const prefix = document.querySelector("link[rel=icon]")?.getAttribute("href")?.startsWith("/") ? "/" : "";
  /** @type {Record<string, any>} */ let memory = {};

  const q = new URLSearchParams(location.search);
  if (q.get("car") && cars.some((/** @type {any} */ c) => c.id === q.get("car"))) car.value = /** @type {string} */ (q.get("car"));
  if (q.get("ref")) ref.value = cleanRef(/** @type {string} */ (q.get("ref")));

  const key = () => storeKey(cleanRef(ref.value), car.value);
  const load = () => { try { return JSON.parse(localStorage.getItem(key()) ?? "null") ?? memory[key()] ?? {}; } catch { return memory[key()] ?? {}; } };
  const save = (/** @type {any} */ rec) => { memory[key()] = rec; try { localStorage.setItem(key(), JSON.stringify(rec)); } catch { /* kept for this visit only */ } };
  const when = () => /** @type {HTMLInputElement|null} */ ($("[data-hc-when]:checked"))?.value ?? "collection";
  const carName = () => cars.find((/** @type {any} */ c) => c.id === car.value)?.name ?? "";

  function showCar() {
    const c = cars.find((/** @type {any} */ x) => x.id === car.value);
    if (c) { photo.src = prefix + c.photo.src; photo.alt = c.photo.alt; photo.width = c.photo.width; photo.height = c.photo.height; photo.hidden = false; }
  }
  /** Fill the form with what was recorded for this moment, if anything. */
  function fill() {
    const side = load()[when()];
    for (const el of root.querySelectorAll("[data-hc-panel]")) /** @type {HTMLInputElement} */ (el).value = side?.marks?.[/** @type {HTMLElement} */ (el).dataset.hcPanel ?? ""] ?? "";
    fuel.value = String(side?.fuel ?? 8); miles.value = side?.miles ?? "";
    paintFuel(); paint();
  }
  function paintFuel() { const w = fuelWords(Number(fuel.value)); $("[data-hc-fuel-out]").textContent = w; fuel.setAttribute("aria-valuetext", w); }
  function paint() {
    const rec = load();
    for (const k of ["collection", "back"]) $(`[data-hc-sum="${k}"]`).textContent = rec[k] ? `${rec[k].at} · ${fuelWords(rec[k].fuel)}${rec[k].miles ? ` · ${Number(rec[k].miles).toLocaleString("en-GB")} miles` : ""} · ${panels.filter((p) => (rec[k].marks[p] ?? "").trim()).length} marked` : "Not recorded yet";
    const diff = rec.collection && rec.back ? differences(panels, rec.collection, rec.back) : null;
    $("[data-hc-diff]").innerHTML = diff ? `<h3 class="hr-cp-sh">Changes since collection</h3><ul>${(diff.length ? diff : ["None recorded"]).map((d) => `<li>${esc(d)}</li>`).join("")}</ul>` : "";
    const text = recordText({ business: ctx.data.name, ref: cleanRef(ref.value), car: carName(), panels, collection: rec.collection ?? null, back: rec.back ?? null });
    send.dataset.waText = `${hire.check.message}\n\n${text}`;
    send.href = ctx.bookHref(send.dataset.waText);
    root.dataset.text = text;
  }

  $("[data-hc-form]").addEventListener("submit", (/** @type {Event} */ e) => {
    e.preventDefault();
    const now = ctx.now();
    /** @type {Record<string, string>} */ const marks = {};
    for (const el of root.querySelectorAll("[data-hc-panel]")) marks[/** @type {HTMLElement} */ (el).dataset.hcPanel ?? ""] = /** @type {HTMLInputElement} */ (el).value.trim();
    const rec = load();
    rec[when()] = { at: `${now.date} ${formatTime24(now.minutes)}`, fuel: Number(fuel.value), miles: cleanMiles(miles.value), marks };
    save(rec);
    $("[data-hc-saved]").textContent = `Recorded ${when() === "back" ? "at return" : "at collection"}, ${rec[when()].at}.`;
    paint();
  });
  $("[data-hc-copy]").addEventListener("click", () => {
    const url = URL.createObjectURL(new Blob([root.dataset.text ?? ""], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = `handover-${cleanRef(ref.value) || car.value}-${ctx.now().date}.txt`;
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  $("[data-hc-clear]").addEventListener("click", () => { memory = {}; try { localStorage.removeItem(key()); } catch { /* nothing kept */ } $("[data-hc-saved]").textContent = "Cleared on this phone."; fill(); });
  fuel.addEventListener("input", paintFuel);
  miles.addEventListener("input", () => { miles.value = cleanMiles(miles.value); });
  car.addEventListener("change", () => { showCar(); fill(); });
  ref.addEventListener("change", fill);
  for (const r of root.querySelectorAll("[data-hc-when]")) r.addEventListener("change", fill);
  showCar(); fill();
}

/** @param {string} s */
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
