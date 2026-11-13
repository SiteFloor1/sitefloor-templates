// @ts-check
/**
 * Delivered tonight: the chosen car arrives at the door (its own arrival photograph when the client has one, otherwise
 * its night photograph), and the delivery window, the dates, the key and the quote assemble beneath, one line at a
 * time (no movement under reduced motion). The quote is the client's own table (lib/quote.js), the delivery fee the
 * postcode's zone. Sending opens WhatsApp with every part and the reference; the scene then becomes the confirmation:
 * request sent, not booked.
 */
import { startAvailability } from "../fleet/sheet-provider.js";
import { quote, money } from "../../lib/quote.js";
import { handoverFor, requestMessage } from "../../lib/request.js";
import { longDate } from "../../lib/words.js";
import { payRef } from "../../../../core/lib/pay-ref.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cars = JSON.parse(root.querySelector("[data-dt-cars]")?.textContent ?? "[]");
  const hire = /** @type {any} */ (ctx.data).hire;
  const $ = (/** @type {string} */ s) => /** @type {any} */ (root.querySelector(s));
  const sel = /** @type {HTMLSelectElement} */ ($("[data-dt-car]"));
  const pc = /** @type {HTMLInputElement} */ ($("[data-dt-pc]"));
  const photo = /** @type {HTMLImageElement} */ ($("[data-dt-photo]"));
  const cap = $("[data-dt-cap]"); const send = /** @type {HTMLAnchorElement} */ ($("[data-dt-send]"));
  const sent = /** @type {HTMLElement} */ ($("[data-dt-sent]")); const build = /** @type {HTMLElement} */ ($("[data-dt-build]"));
  const door = { src: photo.getAttribute("src") ?? "", alt: photo.alt };
  const prefix = (photo.getAttribute("src") ?? "").startsWith("/") ? "/" : "";
  /** @type {any} */ let range = null;
  let shown = "";

  /** @type {any} */ let avail = null;
  const shareBlocked = () => {
    if (!avail) return;
    ctx.share("date-range:tonight:blocked", avail.ok ? { status: "ok", dates: sel.value ? avail.taken[sel.value] ?? [] : [] } : { status: "error" });
  };
  startAvailability(ctx);
  ctx.watch("hire:availability", (a) => { avail = a; shareBlocked(); });
  ctx.watch("date-range:tonight", (r) => { range = r; paint(); });
  ctx.watch("hire:postcode", (v) => { if (!pc.value) { pc.value = v; paint(); } });
  root.addEventListener("change", (e) => { if (e.target === sel) shareBlocked(); paint(); });
  pc.addEventListener("input", paint);

  /** Swap the photograph with a slow fade, once per car. @param {{ src: string, alt: string }} p */
  const setPhoto = (p) => {
    if (shown === p.src) return;
    shown = p.src;
    root.dataset.arriving = "";
    const img = new Image();
    img.onload = () => { photo.src = p.src; photo.alt = p.alt; requestAnimationFrame(() => delete root.dataset.arriving); };
    img.src = p.src;
  };

  function paint() {
    const car = cars.find((/** @type {any} */ c) => c.id === sel.value);
    setPhoto(car ? { src: prefix + car.photo.src, alt: car.photo.alt } : door);
    const h = handoverFor({ kind: "deliver", postcode: pc.value }, { zones: hire.zones ?? [] });
    const ready = Boolean(car && range?.ok && h.ok);
    cap.textContent = car ? `${car.name}${pc.value.trim() ? `, at ${pc.value.trim().toUpperCase()}` : ""}${range?.ok ? `, ${longDate(range.from)}` : ""}.` : "Your door, tonight.";
    set("when", range?.ok ? `${longDate(range.from)}${range.selection?.fromTime ? ` at ${range.selection.fromTime}` : ""} to ${longDate(range.to)}` : range?.reason ?? "Choose your dates", Boolean(range?.ok));
    set("key", "Handed to you at the door", Boolean(car && range?.ok));
    $("[data-dt-warn]").textContent = car && range?.ok && !h.ok ? /** @type {any} */ (h).reason : "";
    for (const s of root.querySelectorAll("[data-dt-pay]")) /** @type {HTMLElement} */ (s).hidden = !car || /** @type {HTMLElement} */ (s).dataset.dtPay !== car.payLink;
    if (!car || !range?.ok) { set("parts", car ? "Choose your dates" : "Choose a car", false); set("total", "—", false); set("deposit", car ? money(car.deposit) : "—", Boolean(car)); send.setAttribute("aria-disabled", "true"); return; }
    const q = quote({ car, rules: hire.rates, range, extras: [], chosen: [], expectedMiles: 0, handover: h.ok ? h.handover : null });
    if (!q.ok) { set("parts", q.reason ?? "", false); set("total", "Ask us", false); send.setAttribute("aria-disabled", "true"); return; }
    set("parts", (q.parts ?? []).map((p) => `${p.label} ${money(p.amount)}`).join(" · "), true);
    set("total", money(q.total ?? 0), ready);
    set("deposit", money(car.deposit), true);
    const ref = payRef([car.id, range.from, range.to]);
    if (car.payLink) ctx.share(`pay-ref:${car.payLink}`, ref);
    const text = requestMessage({ business: ctx.data.name, car: car.name, range, handover: h.ok && h.handover ? h.handover.words : "delivery (postcode to follow)", quote: q, ref });
    send.dataset.waText = text;
    send.href = ctx.bookHref(text);
    send.toggleAttribute("aria-disabled", false);
    root.dataset.ref = ref;
  }

  /** One line of the assembly: its words, and whether it has arrived. @param {string} step @param {string} text @param {boolean} on */
  function set(step, text, on) {
    const li = /** @type {HTMLElement|null} */ (build.querySelector(`[data-dt-step="${step}"]`));
    if (!li) return;
    const b = li.querySelector("b");
    if (b && step !== "window") b.textContent = text;
    li.dataset.on = on ? "true" : "false";
  }

  send.addEventListener("click", () => {
    if (send.getAttribute("aria-disabled") === "true") return;
    const car = cars.find((/** @type {any} */ c) => c.id === sel.value);
    // The same scene, now the confirmation of what was sent. Never "booked".
    $("[data-dt-sent-h]").textContent = `${car?.name ?? "Your car"}, ${range?.ok ? `${longDate(range.from)} to ${longDate(range.to)}` : ""}${pc.value.trim() ? `, to ${pc.value.trim().toUpperCase()}` : ""}. Reference ${root.dataset.ref ?? ""}.`;
    root.dataset.sent = "";
    sent.hidden = false;
    setTimeout(() => sent.focus(), 50);
  });
  $("[data-dt-again]").addEventListener("click", () => { delete root.dataset.sent; sent.hidden = true; sel.focus(); });
  root.dataset.arrival = "";
  paint();
}
