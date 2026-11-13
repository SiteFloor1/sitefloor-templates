// @ts-check
/**
 * Your commission, by code: reads the code (typed, or after # in the link the house sends), asks the provider, and
 * marks the stages: done, the current one, still to come. The next fitting goes to the calendar as a timed event;
 * the cloth opens in the cloth book's weave sheet when that section is on the page.
 */
import { cleanCode, fittingIcs, fittingWhen, eveningBefore } from "../../lib/tailor.js";

const WHY = {
  unknown: "We can't find that code. Check it against your order card, or call us and we'll tell you where your coat has reached.",
  stale: "We haven't updated this for a while, so it may be out of date. Please call us for the latest.",
  unreadable: "This isn't loading right now. Please call us and we'll tell you where your coat has reached.",
};

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), cfg = data.commission, provider = ctx.providers.commission;
  const q = (/** @type {string} */ s) => /** @type {HTMLElement|null} */ (root.querySelector(s));
  const form = /** @type {HTMLFormElement|null} */ (q("[data-cm-form]")), input = /** @type {HTMLInputElement|null} */ (q("[data-cm-code]"));
  const out = q("[data-cm-out]"), off = q("[data-cm-off]"), next = q("[data-cm-next]"), upd = q("[data-cm-upd]");
  const remind = q("[data-cm-remind]");
  const ics = /** @type {HTMLButtonElement|null} */ (q("[data-cm-ics]")), clothBtn = /** @type {HTMLButtonElement|null} */ (q("[data-cm-cloth]"));
  if (!cfg || !provider || !form || !input || !out || !off || !next || !upd || !ics) throw new Error("commission markup or provider missing");
  const stages = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-cm-stage]")]);
  const plain = stages.map((li) => li.querySelector("[data-cm-when]")?.textContent ?? "");
  const tz = data.hours.timezone;
  /** @type {{ code: string, next: number|null }} */ let shown = { code: "", next: null };
  const ago = (/** @type {number} */ ms) => { const h = Math.round(ms / 3_600_000); return h < 1 ? "within the hour" : h < 24 ? `${h} hour${h === 1 ? "" : "s"} ago` : h < 48 ? "yesterday" : `${Math.round(h / 24)} days ago`; };
  const reset = () => stages.forEach((li, i) => { li.classList.remove("done", "now", "todo"); li.removeAttribute("aria-current"); const w = li.querySelector("[data-cm-when]"); if (w) w.textContent = plain[i]; });

  /** @param {string} raw */
  const open = async (raw) => {
    const code = cleanCode(raw);
    if (!code) { input.setCustomValidity("Codes are 8 to 12 letters and numbers."); input.reportValidity(); return; }
    input.setCustomValidity(""); input.value = code;
    if (location.hash.slice(1) !== code) history.replaceState(null, "", `#${code}`);
    /** @type {any} */ let r;
    try { r = await provider.load(ctx, code); } catch { r = { ok: false, reason: "unreadable" }; }
    reset();
    if (!r.ok) { out.hidden = true; off.hidden = false; off.textContent = WHY[/** @type {"unknown"|"stale"|"unreadable"} */ (r.reason)] ?? WHY.unreadable; return; }
    off.hidden = true; out.hidden = false;
    stages.forEach((li, i) => {
      li.classList.add(i < r.stage ? "done" : i === r.stage ? "now" : "todo");
      if (i === r.stage) li.setAttribute("aria-current", "step");
      const w = li.querySelector("[data-cm-when]");
      if (w) w.textContent = i < r.stage ? "Done" : i === r.stage ? (r.next ? `Next fitting ${fittingWhen(r.next, tz)}` : "In the workroom now") : "To come";
    });
    const now = stages[r.stage]?.querySelector(".tl-cm-n")?.textContent ?? "";
    next.textContent = r.next ? `${now}: ${fittingWhen(r.next, tz)}.` : `${now}. We'll be in touch when we need you.`;
    shown = { code, next: r.next };
    ics.hidden = !r.next;
    if (remind) remind.hidden = !r.next;
    if (clothBtn) {
      const c = r.cloth ? root.ownerDocument.querySelector(`[data-cb-open="${r.cloth}"]`) : null;
      clothBtn.hidden = !c;
      if (c) { clothBtn.textContent = `Your cloth: ${/** @type {HTMLElement} */ (c).dataset.name}`; clothBtn.dataset.cloth = r.cloth; }
    }
    upd.textContent = `Updated ${ago(Date.now() - r.updatedAt)}.`;
  };
  form.addEventListener("submit", (e) => { e.preventDefault(); open(input.value); });
  input.addEventListener("input", () => input.setCustomValidity(""));
  q("[data-cm-try]")?.addEventListener("click", (e) => open(/** @type {HTMLElement} */ (e.currentTarget).dataset.cmTry ?? ""));
  clothBtn?.addEventListener("click", () => /** @type {HTMLElement|null} */ (root.ownerDocument.querySelector(`[data-cb-open="${clothBtn.dataset.cloth}"]`))?.click());
  ics.addEventListener("click", () => {
    if (!shown.next) return;
    const title = stages.find((li) => li.classList.contains("now"))?.querySelector(".tl-cm-n")?.textContent ?? "Fitting";
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const file = fittingIcs({ code: shown.code, startMs: shown.next, minutes: cfg.fittingMinutes, title, place: data.place, house: data.name,
      reminder: cfg.reminder ? { atMs: eveningBefore(shown.next, cfg.reminder.at, tz), items: cfg.reminder.items } : null }, stamp);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([file], { type: "text/calendar" }));
    a.download = `fitting-${shown.code}.ics`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  });
  // A code in the link (the house sends …/#CODE) opens it, now or when the link changes on this page.
  const fromLink = () => { const c = cleanCode(decodeURIComponent(location.hash.slice(1))); if (c && c !== shown.code) open(c); };
  addEventListener("hashchange", fromLink);
  fromLink();
}
