// @ts-check
/**
 * The chauffeur journey planner: the customer's own stops and times; hours = first to last time, rounded up to the
 * client's billing step and never below the car's minimum; the quote from the client's hourly rate. Never a guessed
 * drive time. The itinerary card updates as they type and can be shared with the wedding party (the phone's share
 * sheet, else copied as text); the request goes to the business on WhatsApp.
 */
import { chauffeurHours, spanMinutes, money } from "../../lib/quote.js";
import { longDate } from "../../lib/words.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const hire = /** @type {any} */ (ctx.data).hire;
  const rates = Object.fromEntries((root.dataset.jpRates ?? "").split(",").filter(Boolean).map((s) => { const [id, h, m] = s.split(":"); return [id, { hourly: Number(h), minHours: Number(m) }]; }));
  const names = Object.fromEntries(JSON.parse(root.dataset.jpCars ?? "[]").map((/** @type {any} */ c) => [c.id, c.name]));
  const $ = (/** @type {string} */ s) => /** @type {any} */ (root.querySelector(s));
  const list = /** @type {HTMLOListElement} */ ($("[data-jp-stops]"));
  const send = /** @type {HTMLAnchorElement} */ ($("[data-jp-send]"));
  const template = /** @type {HTMLElement} */ (list.querySelector("[data-jp-stop]")?.cloneNode(true));

  const stops = () => [...list.querySelectorAll("[data-jp-stop]")].map((li) => ({
    label: li.querySelector("[data-jp-label]")?.textContent ?? "",
    place: /** @type {HTMLInputElement} */ (li.querySelector("[data-jp-place]")).value.trim(),
    time: /** @type {HTMLInputElement} */ (li.querySelector("[data-jp-time]")).value,
  }));

  const text = () => {
    const s = stops(); const car = $("[data-jp-car]").value; const date = $("[data-jp-date]").value;
    return [
      $("[data-jp-title]").value.trim() || "Our day",
      date ? longDate(date) : "",
      ...s.map((x) => `${x.time || "--:--"}  ${x.label}${x.place ? `: ${x.place}` : ""}`),
      names[car] ? `Car: ${names[car]}` : "",
    ].filter(Boolean).join("\n");
  };

  function paint() {
    const s = stops(); const carId = $("[data-jp-car]").value; const car = rates[carId]; const date = $("[data-jp-date]").value;
    $("[data-jp-card-title]").textContent = $("[data-jp-title]").value.trim() || "The day";
    $("[data-jp-card-date]").textContent = date ? longDate(date) : "Choose the day";
    $("[data-jp-card-list]").innerHTML = s.map((x) => `<li><time>${esc(x.time || "--:--")}</time><span>${esc(x.label)}</span>${x.place ? `<small>${esc(x.place)}</small>` : ""}</li>`).join("");
    $("[data-jp-card-car]").textContent = names[carId] ?? "";
    const times = s.map((x) => x.time).filter(Boolean);
    const span = times.length >= 2 && times.length === s.length ? spanMinutes(times) : null;
    if (span === null || !car) {
      $("[data-jp-span]").textContent = "Add a time to every stop"; $("[data-jp-hours]").textContent = "—"; $("[data-jp-quote]").textContent = "—";
    } else {
      const h = chauffeurHours(span, car, hire.chauffeur.stepMinutes);
      $("[data-jp-span]").textContent = `${Math.floor(span / 60)} h ${span % 60} min, ${times[0]} to ${times[times.length - 1]}`;
      $("[data-jp-hours]").textContent = `${h} ${h === 1 ? "hour" : "hours"}${h === car.minHours && span / 60 < car.minHours ? ` (our minimum)` : ""}`;
      $("[data-jp-quote]").textContent = `${money(Math.round(h * car.hourly * 100) / 100)} (${money(car.hourly)} an hour)`;
    }
    const msg = `${hire.chauffeur.message}\n\n${text()}${span !== null && car ? `\nHours from my times: ${chauffeurHours(span, car, hire.chauffeur.stepMinutes)}` : ""}\nI understand this is a request until you confirm.`;
    send.dataset.waText = msg;
    send.href = ctx.bookHref(msg);
    for (const b of list.querySelectorAll("[data-jp-del]")) /** @type {HTMLButtonElement} */ (b).disabled = s.length <= 2;
  }

  $("[data-jp-add]").addEventListener("click", () => {
    const li = /** @type {HTMLElement} */ (template.cloneNode(true));
    const n = list.children.length;
    const label = li.querySelector("[data-jp-label]");
    if (label) label.textContent = `Stop ${n}`;
    /** @type {HTMLInputElement} */ (li.querySelector("[data-jp-place]")).value = "";
    /** @type {HTMLInputElement} */ (li.querySelector("[data-jp-place]")).placeholder = "";
    /** @type {HTMLInputElement} */ (li.querySelector("[data-jp-place]")).setAttribute("aria-label", `Stop ${n}: where`);
    /** @type {HTMLInputElement} */ (li.querySelector("[data-jp-time]")).value = "";
    /** @type {HTMLInputElement} */ (li.querySelector("[data-jp-time]")).setAttribute("aria-label", `Stop ${n}: time`);
    li.querySelector("[data-jp-del]")?.setAttribute("aria-label", `Remove stop ${n}`);
    list.insertBefore(li, list.lastElementChild);
    /** @type {HTMLInputElement} */ (li.querySelector("[data-jp-place]")).focus();
    paint();
  });
  list.addEventListener("click", (e) => {
    const b = /** @type {HTMLElement} */ (e.target).closest("[data-jp-del]");
    if (!b || list.children.length <= 2) return;
    const li = b.closest("li");
    const next = li?.nextElementSibling ?? li?.previousElementSibling;
    li?.remove();
    /** @type {HTMLElement|null} */ (next?.querySelector("[data-jp-place]") ?? null)?.focus();
    paint();
  });
  $("[data-jp-share]").addEventListener("click", async () => {
    const t = text();
    const out = $("[data-jp-shared]");
    try {
      if (navigator.share) { await navigator.share({ title: $("[data-jp-title]").value.trim() || "Our day", text: t }); out.textContent = ""; return; }
      await navigator.clipboard.writeText(t);
      out.textContent = "Copied. Paste it into your group chat.";
    } catch { out.textContent = "Couldn't share from here; copy the card by hand."; }
  });
  root.addEventListener("input", paint);
  root.addEventListener("change", paint);
  paint();
}

/** @param {string} s */
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
