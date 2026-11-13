// @ts-check
/**
 * Your home's certificates: reads the code from the link (#HX7Q2M) or the box, asks the provider (the client's sheet,
 * or a simulation on demos), lists what was certified and when, and offers a reminder for the next inspection. Fails
 * closed: anything uncertain says to message the client.
 */
import { cleanCode, nextInspection, ukDate, inspectionIcs, KINDS } from "../../lib/certificates.js";

/**
 * @typedef {import("../../lib/certificates.js").Found | import("../../lib/certificates.js").NotFound} Result
 * @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx, code: string) => Promise<Result> }} CertProvider
 */

const WHY = {
  unknown: "We can't find that code. Check it against our message, or message us for copies.",
  unreadable: "Your certificates aren't loading right now. Message us and we'll send copies.",
};

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  /** @type {CertProvider|null} */ const provider = ctx.providers.certificates;
  const cfg = /** @type {any} */ (ctx.data).certificates;
  const data = /** @type {any} */ (ctx.data);
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-certs-form]"));
  const input = /** @type {HTMLInputElement|null} */ (root.querySelector("#certs-code"));
  if (!provider || !cfg || !form || !input) throw new Error("certificates markup or provider missing");
  const $ = (/** @type {string} */ s) => /** @type {HTMLElement} */ (root.querySelector(s));
  let code = "", due = "";
  const kind = (/** @type {string} */ k) => cfg.kinds?.[k] ?? /** @type {any} */ (KINDS)[k] ?? k;

  /** @param {Result} r */
  const show = (r) => {
    const list = $("[data-certs-list]"), off = $("[data-certs-off]");
    if (!r.ok) {
      list.hidden = true; off.hidden = false;
      $("[data-certs-why]").textContent = WHY[r.reason];
      /** @type {HTMLAnchorElement} */ ($("[data-certs-ask]")).href = ctx.waHref(`Hello, could you send copies of my certificates? My code is ${code}.`);
      return;
    }
    off.hidden = true; list.hidden = false;
    const eicr = r.certs.find((c) => c.kind === "eicr");
    due = eicr ? nextInspection(eicr, cfg.intervalYears) : "";
    $("[data-certs-next]").hidden = !due;
    $("[data-certs-due]").textContent = due ? ukDate(due) : "";
    $("[data-certs-items]").replaceChildren(...r.certs.map((c) => {
      const li = document.createElement("li");
      const t = document.createElement("time"); t.dateTime = c.issued; t.textContent = ukDate(c.issued);
      const d = document.createElement("div");
      const b = document.createElement("b"); b.textContent = kind(c.kind);
      const s = document.createElement("span"); s.textContent = [c.note, c.nextDue && c.kind !== "eicr" ? `Runs to ${ukDate(c.nextDue)}.` : ""].filter(Boolean).join(" ");
      d.append(b, s); li.append(t, d); return li;
    }));
    /** @type {HTMLAnchorElement} */ ($("[data-certs-copy]")).href = ctx.waHref(`Hello, could you send copies of my certificates? My code is ${code}.`);
  };
  /** @param {string} raw */
  const open = (raw) => {
    const c = cleanCode(raw);
    if (!c) { input.setCustomValidity("Codes are 6 to 10 letters and numbers."); input.reportValidity(); return; }
    input.setCustomValidity(""); code = c; input.value = c;
    if (location.hash.slice(1) !== c) history.replaceState(null, "", `#${c}`);
    provider.load(ctx, c).then(show, () => show({ ok: false, reason: "unreadable" }));
  };
  form.addEventListener("submit", (e) => { e.preventDefault(); open(input.value); });
  input.addEventListener("input", () => input.setCustomValidity(""));
  $("[data-certs-ics]").addEventListener("click", () => {
    if (!due) return;
    const ics = inspectionIcs({ due, weeksBefore: cfg.weeksBefore, business: data.name, phone: data.phone, place: data.place, code, timeZone: data.hours.timezone, stamp: new Date() });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = "electrical-inspection.ics";
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  });
  const fromLink = cleanCode(decodeURIComponent(location.hash.slice(1)));
  if (fromLink) open(fromLink);
  else if (data.mode === "demo" && cfg.example) open(cfg.example);
}
